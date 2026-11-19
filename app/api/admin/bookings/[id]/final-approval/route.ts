import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { sendBookingStatusEmail } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const finalApprovalSchema = z
  .object({
    decision: z.enum(["APPROVE", "RETURN"]),
    note: z.string().trim().max(2000).optional(),
  })
  .strict();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id: bookingId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = finalApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(422, "VALIDATION_ERROR", "Invalid approval payload.", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { decision, note } = parsed.data;
    const trimmedNote = note?.trim() || "";

    if (decision === "RETURN" && trimmedNote.length < 5) {
      return apiError(
        422,
        "REASON_REQUIRED",
        "Please provide an explanation (at least 5 characters) when returning a booking to the supervisor."
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignments: {
          where: { isActive: true },
          select: { id: true, staffId: true },
        },
      },
    });

    if (!booking) {
      return apiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
      return apiError(
        409,
        "BOOKING_ALREADY_CLOSED",
        `This booking is already ${booking.status.toLowerCase()}.`
      );
    }

    if (booking.supervisionStatus !== "SUPERVISOR_APPROVED") {
      return apiError(
        409,
        "SUPERVISOR_APPROVAL_REQUIRED",
        "This booking must be approved by its supervisor before final administrator approval."
      );
    }

    const now = new Date();

    const updated = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
      if (decision === "APPROVE") {
        const b = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: "COMPLETED",
            completedAt: now,
            finalApprovedById: guard.session.user.id,
            finalApprovedAt: now,
            finalApprovalNote: trimmedNote || null,
          },
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            supervisionStatus: true,
            completedAt: true,
            finalApprovedAt: true,
          },
        });

        await tx.workflowReview.create({
          data: {
            bookingId,
            reviewerId: guard.session.user.id,
            reviewerRole: "ADMIN",
            decision: "APPROVED",
            comment: trimmedNote || "Final completion approved by administrator.",
          },
        });

        await writeAudit(tx, {
          actorId: guard.session.user.id,
          action: "ADMIN_FINAL_APPROVED",
          entityType: "BOOKING",
          entityId: bookingId,
          reason: trimmedNote || undefined,
          changes: {
            before: { status: booking.status },
            after: {
              status: "COMPLETED",
              finalApprovedById: guard.session.user.id,
            },
          },
        });

        if (booking.supervisorId) {
          await tx.notification.create({
            data: {
              userId: booking.supervisorId,
              title: "Booking final approval completed",
              message: `Administrator gave final approval for booking ${booking.bookingNumber}.`,
              type: "FINAL_APPROVED",
            },
          });
        }

        for (const a of booking.assignments) {
          await tx.notification.create({
            data: {
              userId: a.staffId,
              title: "Job finalized",
              message: `Booking ${booking.bookingNumber} has received final administrator approval.`,
              type: "FINAL_APPROVED",
            },
          });
        }

        await tx.notification.create({
          data: {
            userId: booking.customerId,
            title: "Service completed",
            message: `Your booking ${booking.bookingNumber} has been marked as completed. Thank you for choosing SAMB's Laundry and Klinin Services.`,
            type: "BOOKING_UPDATE",
          },
        });

        return b;
      }

      // RETURN decision
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          supervisionStatus: "RETURNED_BY_ADMIN",
          finalApprovalNote: trimmedNote,
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
          reviewerRole: "ADMIN",
          decision: "RETURNED_TO_SUPERVISOR",
          comment: trimmedNote,
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "ADMIN_RETURNED_FOR_ACTION",
        entityType: "BOOKING",
        entityId: bookingId,
        reason: trimmedNote,
        changes: {
          before: { supervisionStatus: booking.supervisionStatus },
          after: { supervisionStatus: "RETURNED_BY_ADMIN" },
        },
      });

      if (booking.supervisorId) {
        await tx.notification.create({
          data: {
            userId: booking.supervisorId,
            title: "Booking returned for further action",
            message: `Administrator returned booking ${booking.bookingNumber}: ${trimmedNote}`,
            type: "ADMIN_RETURNED_JOB",
          },
        });
      }

      return b;
    });

    // Trigger customer completion email ONLY on Admin Final Approval
    if (decision === "APPROVE" && booking.customer) {
      try {
        await sendBookingStatusEmail({
          to: booking.customer.email,
          customerName: booking.customer.name,
          bookingNumber: booking.bookingNumber,
          status: "COMPLETED",
        });
      } catch (error) {
        console.error("Failed to send final completion email:", error);
      }
    }

    return apiSuccess(
      decision === "APPROVE"
        ? `Booking ${booking.bookingNumber} has been approved as completed and the customer has been notified.`
        : `Booking ${booking.bookingNumber} has been returned to the supervisor for further action.`,
      { booking: updated }
    );
  } catch (error) {
    console.error("Admin final approval error:", error);
    return apiError(
      500,
      "FINAL_APPROVAL_FAILED",
      "Unable to process final approval right now."
    );
  }
}
