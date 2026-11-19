import type { Prisma } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertStaff } from "@/lib/role-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ assignmentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const guard = await assertStaff(request);
    if (guard.response) return guard.response;

    const { assignmentId } = await context.params;

    const assignment = await db.bookingAssignment.findFirst({
      where: {
        id: assignmentId,
        staffId: guard.session.user.id,
        isActive: true,
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            supervisorId: true,
            supervisionStatus: true,
          },
        },
      },
    });

    if (!assignment) {
      return apiError(
        404,
        "ASSIGNMENT_NOT_FOUND",
        "Your active assignment could not be found."
      );
    }

    if (!["CONFIRMED", "IN_PROGRESS"].includes(assignment.booking.status)) {
      return apiError(
        409,
        "BOOKING_NOT_ACTIVE",
        "Work can only be started on confirmed or in-progress bookings."
      );
    }

    if (!["PENDING", "CHANGES_REQUESTED"].includes(assignment.status)) {
      return apiError(
        409,
        "INVALID_ASSIGNMENT_TRANSITION",
        `Cannot start assignment when status is ${assignment.status.replaceAll("_", " ").toLowerCase()}.`
      );
    }

    const now = new Date();

    const updated = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const a = await tx.bookingAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: assignment.startedAt ?? now,
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
        },
      });

      const bookingPatch: Record<string, unknown> = {};
      if (assignment.booking.status === "CONFIRMED") {
        bookingPatch.status = "IN_PROGRESS";
      }
      if (
        assignment.booking.supervisionStatus === "ASSIGNED" ||
        assignment.booking.supervisionStatus === "NOT_REQUIRED" ||
        assignment.booking.supervisionStatus === "CHANGES_REQUESTED" ||
        assignment.booking.supervisionStatus === "RETURNED_BY_ADMIN"
      ) {
        bookingPatch.supervisionStatus = "IN_PROGRESS";
      }

      if (Object.keys(bookingPatch).length > 0) {
        await tx.booking.update({
          where: { id: assignment.booking.id },
          data: bookingPatch,
        });
      }

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: "ASSIGNMENT_STARTED",
        entityType: "BOOKING_ASSIGNMENT",
        entityId: assignment.id,
        changes: {
          bookingId: assignment.booking.id,
          bookingNumber: assignment.booking.bookingNumber,
          before: { status: assignment.status },
          after: { status: "IN_PROGRESS" },
        },
      });

      return a;
    });

    return apiSuccess(
      `Started work on booking ${assignment.booking.bookingNumber}.`,
      { assignment: updated }
    );
  } catch (error) {
    console.error("Start assignment error:", error);
    return apiError(
      500,
      "ASSIGNMENT_START_FAILED",
      "Unable to start this assignment right now."
    );
  }
}
