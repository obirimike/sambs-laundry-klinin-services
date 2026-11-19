import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin-guard";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";

const updateStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    role: z.enum(["STAFF", "SUPERVISOR"]).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

const deleteStaffSchema = z.object({
  confirm: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = updateStaffSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(422, "VALIDATION_ERROR", "Invalid team member information.", {
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await db.user.findFirst({
      where: { id, role: { in: ["STAFF", "SUPERVISOR"] } },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    if (!existing) {
      return apiError(404, "STAFF_NOT_FOUND", "Team member not found.");
    }

    const roleChanging =
      parsed.data.role !== undefined && parsed.data.role !== existing.role;

    const updated = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
          ...(parsed.data.phone !== undefined
            ? { phone: parsed.data.phone?.trim() || null }
            : {}),
          ...(roleChanging
            ? {
                role: parsed.data.role,
                sessionVersion: { increment: 1 },
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          accountStatus: true,
        },
      });

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action: roleChanging ? "TEAM_ROLE_CHANGED" : "STAFF_UPDATED",
        entityType: "USER",
        entityId: id,
        reason: parsed.data.reason,
        changes: {
          before: {
            name: existing.name,
            phone: existing.phone,
            role: existing.role,
          },
          after: { name: u.name, phone: u.phone, role: u.role },
        },
      });

      return u;
    });

    return apiSuccess("Team member information updated successfully.", {
      staff: updated,
    });
  } catch (error) {
    console.error("Staff update error:", error);
    return apiError(500, "STAFF_UPDATE_FAILED", "Unable to update team member.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const guard = await assertAdmin(request);
    if (guard.response) return guard.response;

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = deleteStaffSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Type the team member's email to confirm deletion."
      );
    }

    const existing = await db.user.findFirst({
      where: { id, role: { in: ["STAFF", "SUPERVISOR"] } },
      include: {
        _count: {
          select: {
            assignmentsReceived: true,
            assignmentsCreated: true,
            bookingsSupervised: true,
          },
        },
      },
    });

    if (!existing) {
      return apiError(404, "STAFF_NOT_FOUND", "Team member not found.");
    }

    if (parsed.data.confirm.toLowerCase() !== existing.email.toLowerCase()) {
      return apiError(
        422,
        "CONFIRMATION_MISMATCH",
        "The confirmation text does not match the member's email."
      );
    }

    if (
      existing._count.assignmentsReceived > 0 ||
      existing._count.bookingsSupervised > 0
    ) {
      return apiError(
        409,
        "STAFF_HAS_ASSIGNMENTS",
        "This team member has historical assignments or supervised bookings. Suspend the account instead of deleting it to preserve operational records."
      );
    }

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action:
          existing.role === "SUPERVISOR" ? "SUPERVISOR_DELETED" : "STAFF_DELETED",
        entityType: "USER",
        entityId: id,
        reason: parsed.data.reason,
        changes: {
          before: {
            email: existing.email,
            name: existing.name,
            role: existing.role,
          },
        },
      });

      await tx.user.delete({ where: { id } });
    });

    return apiSuccess(
      `Account for ${existing.name} has been permanently deleted.`
    );
  } catch (error) {
    console.error("Staff delete error:", error);
    return apiError(500, "STAFF_DELETE_FAILED", "Unable to delete team account.");
  }
}
