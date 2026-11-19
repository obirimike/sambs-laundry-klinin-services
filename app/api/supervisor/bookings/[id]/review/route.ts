import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertSupervisor } from "@/lib/role-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reviewSchema = z
  .object({
    decision: z.enum(["APPROVE", "REQUEST_CHANGES"]),
    comment: z.string().trim().max(2000).optional(),
    targetAssignmentIds: z.array(z.string().uuid()).optional(),
  })
  .strict();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const guard = await assertSupervisor(request);
    if (guard.response) return guard.response;

    const { id: bookingId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(422, "VALIDATION_ERROR", "Invalid review submission.", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { decision, comment, targetAssignmentIds } = parsed.data;
    const trimmedComment = comment?.trim() || "";

    if (decision === "REQUEST_CHANGES" && trimmedComment.length < 5) {
      return apiError(
        422,
        "COMMENT_REQUIRED",
        "Please provide specific feedback (at least 5 characters) when requesting corrections."
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            staff: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!booking) {
      return apiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    if (booking.supervisorId !== guard.session.user.id) {
      return apiError(
        403,
        "SUPERVISOR_NOT_ASSIGNED",
        "You are only authorized to review bookings assigned to you for supervision."
      );
    }

    if (!["CONFIRMED", "IN_PROGRESS"].includes(booking.status)) {
      return apiError(
        409,
        "BOOKING_NOT_REVIEWABLE",
        "This booking is no longer open for supervisor review."
      );
    }

    if (booking.assignments.length === 0) {
      return apiError(
        409,
        "NO_ACTIVE_ASSIGNMENTS",
        "Cannot review a booking with no active staff assignments."
      );
    }

    if (decision === "APPROVE") {
      const pendingWorkers = booking.assignments.filter(
        (a: { status: string }) =>
          a.status !== "SUBMITTED_FOR_REVIEW" && a.status !== "APPROVED"
      );

      if (pendingWorkers.length > 0) {
        const names = pendingWorkers
          .map((a: { staff: { name: string } }) => a.staff.name)
          .join(", ");
        return apiError(
          409,
          "STAFF_SUBMISSIONS_INCOMPLETE",
          `All assigned staff must submit completion reports before approval. Waiting on: ${names}.`
        );
      }

      const now = new Date();
      const updated = await db.$transaction(
        async (tx: Prisma.TransactionClient) => {
        await tx.bookingAssignment.updateMany({
          where: {
            bookingId,
            isActive: true,
            status: "SUBMITTED_FOR_REVIEW",
          },
          data: {
            status: "APPROVED",
            approvedAt: now,
          },
        });

        const b = await tx.booking.update({
          where: { id: bookingId },
          data: {
            supervisionStatus: "SUPERVISOR_APPROVED",
          },
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            supervisionStatus: true,
          },
        });

        await tx.workflowReview.create({
          data: {
            bookingId,
            reviewerId: guard.session.user.id,
            reviewerRole: "SUPERVISOR",
            decision: "APPROVED",
            comment:
              trimmedComment ||
              "Work inspected and approved by lead supervisor.",
          },
        });

        const admins = await tx.user.findMany({
          where: { role: "ADMIN", accountStatus: "ACTIVE" },
          select: { id: true },
        });

        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              title: "Booking ready for final approval",
              message: `Supervisor ${guard.session.user.name || "Lead"} approved booking ${booking.bookingNumber} for final admin sign-off.`,
              type: "FINAL_APPROVAL_READY",
            },
          });
        }

        await writeAudit(tx, {
          actorId: guard.session.user.id,
          action: "SUPERVISOR_APPROVED_JOB",
          entityType: "BOOKING",
          entityId: bookingId,
          reason: trimmedComment || undefined,
          changes: {
            bookingNumber: booking.bookingNumber,
            before: { supervisionStatus: booking.supervisionStatus },
            after: { supervisionStatus: "SUPERVISOR_APPROVED" },
          },
        });

        return b;
      });

      return apiSuccess(
        `Booking ${booking.bookingNumber} approved and sent to Administrators for final completion sign-off.`,
        { booking: updated }
      );
    }

    // REQUEST_CHANGES flow
    type ActiveAssignment = {
      id: string;
      status: string;
      staff: { id: string; name: string };
    };
    const typedAssignments = booking.assignments as ActiveAssignment[];
    const activeIds = new Set(typedAssignments.map((a) => a.id));
    const targeted =
      targetAssignmentIds && targetAssignmentIds.length > 0
        ? typedAssignments.filter((a) => targetAssignmentIds.includes(a.id))
        : typedAssignments.filter((a) =>
            ["SUBMITTED_FOR_REVIEW", "APPROVED", "IN_PROGRESS"].includes(
              a.status
            )
          );

    if (
      targetAssignmentIds &&
      targetAssignmentIds.some((id) => !activeIds.has(id))
    ) {
      return apiError(
        422,
        "INVALID_TARGET_ASSIGNMENT",
        "One or more selected assignments do not belong to this booking."
      );
    }

    if (targeted.length === 0) {
      return apiError(
        409,
        "NO_ELIGIBLE_ASSIGNMENTS",
        "No submitted or active staff assignments are available to return for corrections."
      );
    }

    const updated = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        for (const target of targeted) {
          await tx.bookingAssignment.update({
            where: { id: target.id },
            data: { status: "CHANGES_REQUESTED" },
          });

          await tx.workflowReview.create({
            data: {
              bookingId,
              assignmentId: target.id,
              reviewerId: guard.session.user.id,
              reviewerRole: "SUPERVISOR",
              decision: "CHANGES_REQUESTED",
              comment: trimmedComment,
            },
          });

          await tx.notification.create({
            data: {
              userId: target.staff.id,
              title: "Corrections requested on assignment",
              message: `Supervisor requested changes for booking ${booking.bookingNumber}: ${trimmedComment}`,
              type: "ASSIGNMENT_CHANGES_REQUESTED",
            },
          });
        }

        const b = await tx.booking.update({
          where: { id: bookingId },
          data: {
            supervisionStatus: "CHANGES_REQUESTED",
          },
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            supervisionStatus: true,
          },
        });

        await writeAudit(tx, {
          actorId: guard.session.user.id,
          action: "SUPERVISOR_REQUESTED_CHANGES",
          entityType: "BOOKING",
          entityId: bookingId,
          reason: trimmedComment,
          changes: {
            bookingNumber: booking.bookingNumber,
            targetedStaff: targeted.map((t) => t.staff.name),
            after: { supervisionStatus: "CHANGES_REQUESTED" },
          },
        });

      return b;
    });

    return apiSuccess(
      `Correction request sent for booking ${booking.bookingNumber}. Affected staff have been notified.`,
      { booking: updated }
    );
  } catch (error) {
    console.error("Supervisor review error:", error);
    return apiError(
      500,
      "SUPERVISOR_REVIEW_FAILED",
      "Unable to submit supervisor review right now."
    );
  }
}
