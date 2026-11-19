import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supervisorSchema = z
  .object({
    supervisorId: z.string().uuid().nullable(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id: bookingId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = supervisorSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(422, "VALIDATION_ERROR", "Invalid supervisor selection.", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        supervisorId: true,
        supervisionStatus: true,
      },
    });

    if (!booking) {
      return apiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    if (!["CONFIRMED", "IN_PROGRESS"].includes(booking.status)) {
      return apiError(
        409,
        "BOOKING_NOT_ELIGIBLE",
        "Supervisors can only be assigned to confirmed or in-progress bookings."
      );
    }

    const { supervisorId, reason } = parsed.data;

    let supervisor: { id: string; name: string } | null = null;
    if (supervisorId) {
      supervisor = await db.user.findFirst({
        where: {
          id: supervisorId,
          role: "SUPERVISOR",
          accountStatus: "ACTIVE",
        },
        select: { id: true, name: true },
      });

      if (!supervisor) {
        return apiError(
          404,
          "SUPERVISOR_NOT_FOUND",
          "The selected supervisor account was not found or is suspended."
        );
      }
    }

    if (booking.supervisorId === supervisorId) {
      return apiSuccess("Lead supervisor is unchanged.", { booking });
    }

    const now = new Date();
    const updated = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
      const nextSupervisionStatus = supervisorId
        ? booking.supervisionStatus === "NOT_REQUIRED"
          ? "ASSIGNED"
          : booking.supervisionStatus
        : booking.supervisionStatus === "ASSIGNED"
          ? "NOT_REQUIRED"
          : booking.supervisionStatus;

      const b = await tx.booking.update({
        where: { id: bookingId },
        data: {
          supervisorId,
          supervisorAssignedAt: supervisorId ? now : null,
          supervisionStatus: nextSupervisionStatus,
        },
        select: {
          id: true,
          bookingNumber: true,
          supervisorId: true,
          supervisionStatus: true,
        },
      });

      if (booking.supervisorId && booking.supervisorId !== supervisorId) {
        await tx.notification.create({
          data: {
            userId: booking.supervisorId,
            title: "Supervision assignment updated",
            message: `You are no longer assigned as lead supervisor for booking ${booking.bookingNumber}.`,
            type: "SUPERVISOR_UNASSIGNED",
          },
        });
      }

      if (supervisor) {
        await tx.notification.create({
          data: {
            userId: supervisor.id,
            title: "New supervision assignment",
            message: `You have been assigned to supervise booking ${booking.bookingNumber}.`,
            type: "SUPERVISOR_ASSIGNED",
          },
        });
      }

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: supervisor ? "SUPERVISOR_ASSIGNED" : "SUPERVISOR_REMOVED",
        entityType: "BOOKING",
        entityId: bookingId,
        reason,
        changes: {
          before: { supervisorId: booking.supervisorId },
          after: {
            supervisorId,
            supervisorName: supervisor?.name ?? null,
          },
        },
      });

      return b;
    });

    return apiSuccess(
      supervisor
        ? `${supervisor.name} assigned as lead supervisor for ${booking.bookingNumber}.`
        : `Lead supervisor removed from ${booking.bookingNumber}.`,
      { booking: updated }
    );
  } catch (error) {
    console.error("Assign supervisor error:", error);
    return apiError(
      500,
      "SUPERVISOR_ASSIGN_FAILED",
      "Unable to update lead supervisor."
    );
  }
}

export const PATCH = PUT;
