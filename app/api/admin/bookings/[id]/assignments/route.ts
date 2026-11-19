import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const assignmentSchema = z
  .object({
    staffId: z.string().uuid().optional(),
    staffIds: z.array(z.string().uuid()).min(1).max(20).optional(),
    supervisorId: z.string().uuid().nullable().optional(),
    replaceAssignmentId: z.string().uuid().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine(
    (data) =>
      Boolean(data.staffId) ||
      (Array.isArray(data.staffIds) && data.staffIds.length > 0),
    { message: "Select at least one staff member to assign." }
  );

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can assign staff." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Please provide valid JSON." },
        { status: 400 }
      );
    }

    const parsed = assignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please check the assignment details.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { id: bookingId } = await context.params;
    const { staffId, staffIds, supervisorId, replaceAssignmentId, notes } =
      parsed.data;

    const requestedIds = Array.from(
      new Set([
        ...(staffId ? [staffId] : []),
        ...(staffIds ? staffIds : []),
      ])
    );

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
      return NextResponse.json(
        { message: "Booking not found." },
        { status: 404 }
      );
    }

    if (!["CONFIRMED", "IN_PROGRESS"].includes(booking.status)) {
      return NextResponse.json(
        {
          message:
            "Staff can only be assigned to confirmed or in-progress bookings.",
        },
        { status: 409 }
      );
    }

    const staffUsers = await db.user.findMany({
      where: {
        id: { in: requestedIds },
        role: "STAFF",
        accountStatus: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (staffUsers.length !== requestedIds.length) {
      return NextResponse.json(
        {
          message:
            "One or more selected staff accounts were not found or are suspended.",
        },
        { status: 404 }
      );
    }

    let validSupervisor: { id: string; name: string } | null = null;
    if (supervisorId) {
      validSupervisor = await db.user.findFirst({
        where: {
          id: supervisorId,
          role: "SUPERVISOR",
          accountStatus: "ACTIVE",
        },
        select: { id: true, name: true },
      });

      if (!validSupervisor) {
        return NextResponse.json(
          {
            message:
              "Selected supervisor was not found or is suspended.",
          },
          { status: 404 }
        );
      }
    }

    const outcome = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const now = new Date();

      if (replaceAssignmentId) {
        const toReplace = await tx.bookingAssignment.findFirst({
          where: {
            id: replaceAssignmentId,
            bookingId,
            isActive: true,
          },
          include: { staff: { select: { id: true, name: true } } },
        });

        if (!toReplace) {
          return { kind: "REPLACE_NOT_FOUND" as const };
        }

        await tx.bookingAssignment.update({
          where: { id: replaceAssignmentId },
          data: {
            isActive: false,
            unassignedAt: now,
            unassignedById: session.user.id,
          },
        });

        await tx.notification.create({
          data: {
            userId: toReplace.staff.id,
            title: "Booking assignment updated",
            message: `You have been replaced on booking ${booking.bookingNumber}.`,
            type: "BOOKING_UNASSIGNED",
          },
        });

        await writeAudit(tx, {
          actorId: session.user.id,
          action: "ASSIGNMENT_REPLACED",
          entityType: "BOOKING_ASSIGNMENT",
          entityId: replaceAssignmentId,
          changes: {
            bookingId,
            bookingNumber: booking.bookingNumber,
            previousStaffId: toReplace.staff.id,
            previousStaffName: toReplace.staff.name,
          },
        });
      }

      const activeAssignments = await tx.bookingAssignment.findMany({
        where: {
          bookingId,
          isActive: true,
        },
        select: { staffId: true },
      });

      const activeStaffIds = new Set(
        activeAssignments.map((a: { staffId: string }) => a.staffId)
      );

      type StaffSummary = { id: string; name: string };
      const typedStaffUsers = staffUsers as StaffSummary[];
      const duplicate = typedStaffUsers.filter((u) => activeStaffIds.has(u.id));
      if (duplicate.length === typedStaffUsers.length) {
        return { kind: "DUPLICATE" as const };
      }

      const toAssign = typedStaffUsers.filter((u) => !activeStaffIds.has(u.id));
      const createdAssignments: Array<{
        id: string;
        staffId: string;
        status: string;
        notes: string | null;
        isActive: boolean;
        assignedAt: Date;
        staff: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
        };
      }> = [];

      for (const member of toAssign) {
        const created = await tx.bookingAssignment.create({
          data: {
            bookingId,
            staffId: member.id,
            assignedById: session.user.id,
            status: "PENDING",
            notes: notes?.trim() || null,
          },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        });

        createdAssignments.push(created);

        await tx.notification.create({
          data: {
            userId: member.id,
            title: "New booking assignment",
            message: `You have been assigned to booking ${booking.bookingNumber}.`,
            type: "BOOKING_ASSIGNED",
          },
        });

        await writeAudit(tx, {
          actorId: session.user.id,
          action: "ASSIGNMENT_CREATED",
          entityType: "BOOKING_ASSIGNMENT",
          entityId: created.id,
          changes: {
            bookingId,
            bookingNumber: booking.bookingNumber,
            staffId: member.id,
            staffName: member.name,
          },
        });
      }

      // Update supervisor and supervisionStatus safely
      const bookingPatch: Record<string, unknown> = {};
      if (validSupervisor && validSupervisor.id !== booking.supervisorId) {
        bookingPatch.supervisorId = validSupervisor.id;
        bookingPatch.supervisorAssignedAt = now;

        await tx.notification.create({
          data: {
            userId: validSupervisor.id,
            title: "New supervision assignment",
            message: `You are now the lead supervisor for booking ${booking.bookingNumber}.`,
            type: "SUPERVISOR_ASSIGNED",
          },
        });

        await writeAudit(tx, {
          actorId: session.user.id,
          action: "SUPERVISOR_ASSIGNED",
          entityType: "BOOKING",
          entityId: bookingId,
          changes: {
            bookingNumber: booking.bookingNumber,
            supervisorId: validSupervisor.id,
            supervisorName: validSupervisor.name,
          },
        });
      }

      if (
        booking.supervisionStatus === "NOT_REQUIRED" &&
        (validSupervisor || booking.supervisorId)
      ) {
        bookingPatch.supervisionStatus = "ASSIGNED";
      } else if (
        booking.supervisionStatus === "AWAITING_SUPERVISOR_REVIEW" ||
        booking.supervisionStatus === "SUPERVISOR_APPROVED"
      ) {
        bookingPatch.supervisionStatus = "IN_PROGRESS";
      }

      if (Object.keys(bookingPatch).length > 0) {
        await tx.booking.update({
          where: { id: bookingId },
          data: bookingPatch,
        });
      }

      return {
        kind: "SUCCESS" as const,
        createdAssignments,
        assignedNames: toAssign.map((u) => u.name),
      };
    });

    if (outcome.kind === "REPLACE_NOT_FOUND") {
      return NextResponse.json(
        { message: "Assignment to replace was not found." },
        { status: 404 }
      );
    }

    if (outcome.kind === "DUPLICATE") {
      return NextResponse.json(
        { message: "The selected staff member(s) are already assigned to this booking." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: `${outcome.assignedNames.join(", ")} assigned to booking ${booking.bookingNumber}.`,
        assignments: outcome.createdAssignments,
        assignment: outcome.createdAssignments[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to assign staff:", error);

    return NextResponse.json(
      { message: "Unable to assign staff right now." },
      { status: 500 }
    );
  }
}
