import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suspendedAccountResponse } from "@/lib/account-access";
import { writeAudit } from "@/lib/audit";
import { sendBookingStatusEmail } from "@/lib/emails";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    reason: z.string().trim().max(1000).optional(),
  }),
  z.object({
    action: z.literal("reschedule"),
    preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
    reason: z.string().trim().max(1000).optional(),
  }),
]);

function getTodayInGhana(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to update your booking." },
        { status: 401 }
      );
    }

    const suspended = await suspendedAccountResponse(session.user.id);
    if (suspended) return suspended;

    const { id } = await context.params;

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        service: {
          select: { name: true },
        },
        customer: {
          select: { name: true, email: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found." },
        { status: 404 }
      );
    }

    // Ownership check (or ADMIN)
    if (booking.customerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You do not have permission to manage this booking." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid action or parameters." },
        { status: 400 }
      );
    }

    // Work in progress cannot be cancelled or rescheduled
    if (booking.status === "IN_PROGRESS") {
      return NextResponse.json(
        {
          message:
            "This booking is currently in progress. Changes or cancellations are locked once service work has begun. Please contact customer care for assistance.",
        },
        { status: 400 }
      );
    }

    // ACTION: CANCEL
    if (parsed.data.action === "cancel") {
      if (booking.status === "COMPLETED") {
        return NextResponse.json(
          {
            message:
              "This service has already been completed and cannot be cancelled. You may delete the record from your booking history if desired.",
          },
          { status: 400 }
        );
      }

      if (booking.status === "CANCELLED") {
        return NextResponse.json(
          { message: "This booking has already been cancelled." },
          { status: 400 }
        );
      }

      const now = new Date();
      const reason = parsed.data.reason?.trim();

      const updated = await db.$transaction(async (tx: any) => {
        const b = await tx.booking.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            specialInstructions: reason
              ? `${booking.specialInstructions ? booking.specialInstructions + "\n\n" : ""}[Customer Cancellation Reason]: ${reason}`
              : booking.specialInstructions,
          },
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            cancelledAt: true,
          },
        });

        await writeAudit(tx, {
          actorId: session.user.id,
          action: "CUSTOMER_CANCELLED_BOOKING",
          entityType: "BOOKING",
          entityId: id,
          reason: reason || "Customer cancelled booking before work started",
          changes: {
            before: { status: booking.status },
            after: { status: "CANCELLED" },
          },
        });

        return b;
      });

      // Notification
      try {
        await db.notification.create({
          data: {
            userId: booking.customerId,
            title: "Booking Cancelled",
            message: `Your booking #${booking.bookingNumber} (${booking.service.name}) was successfully cancelled.`,
            type: "BOOKING_UPDATE",
          },
        });
      } catch (notifErr) {
        console.error("Failed to create customer cancellation notification:", notifErr);
      }

      // Email
      if (booking.customer?.email) {
        try {
          await sendBookingStatusEmail({
            to: booking.customer.email,
            customerName: booking.customer.name,
            bookingNumber: booking.bookingNumber,
            status: "CANCELLED",
          });
        } catch (emailErr) {
          console.error("Failed to send cancellation email:", emailErr);
        }
      }

      return NextResponse.json(
        {
          message: "Your booking has been cancelled successfully.",
          booking: updated,
        },
        { status: 200 }
      );
    }

    // ACTION: RESCHEDULE
    if (parsed.data.action === "reschedule") {
      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        return NextResponse.json(
          {
            message:
              "Completed or cancelled bookings cannot be rescheduled. Please use 'Book Again' to request a new appointment.",
          },
          { status: 400 }
        );
      }

      const { preferredDate, preferredTime, reason } = parsed.data;

      // Validate date is not in past
      if (preferredDate < getTodayInGhana()) {
        return NextResponse.json(
          { message: "The new preferred date cannot be in the past." },
          { status: 400 }
        );
      }

      const [year, month, day] = preferredDate.split("-").map(Number);
      const [hours, minutes] = preferredTime.split(":").map(Number);

      const newDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const dateIsValid =
        Number.isFinite(newDate.getTime()) &&
        newDate.getUTCFullYear() === year &&
        newDate.getUTCMonth() === month - 1 &&
        newDate.getUTCDate() === day;

      const timeIsValid = hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;

      if (!dateIsValid || !timeIsValid) {
        return NextResponse.json(
          { message: "Please provide a valid date and time." },
          { status: 400 }
        );
      }

      const trimmedReason = reason?.trim();

      const updated = await db.$transaction(async (tx: any) => {
        const b = await tx.booking.update({
          where: { id },
          data: {
            preferredDate: newDate,
            preferredTime,
            specialInstructions: trimmedReason
              ? `${booking.specialInstructions ? booking.specialInstructions + "\n\n" : ""}[Rescheduled by Customer to ${preferredDate} at ${preferredTime}]: ${trimmedReason}`
              : booking.specialInstructions,
          },
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            preferredDate: true,
            preferredTime: true,
          },
        });

        await writeAudit(tx, {
          actorId: session.user.id,
          action: "CUSTOMER_RESCHEDULED_BOOKING",
          entityType: "BOOKING",
          entityId: id,
          reason: trimmedReason || `Rescheduled to ${preferredDate} at ${preferredTime}`,
          changes: {
            before: {
              preferredDate: booking.preferredDate,
              preferredTime: booking.preferredTime,
            },
            after: {
              preferredDate: newDate,
              preferredTime,
            },
          },
        });

        return b;
      });

      // Format date for notification display
      const formattedDateDisplay = new Intl.DateTimeFormat("en-GH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(newDate);

      // In-app notification
      try {
        await db.notification.create({
          data: {
            userId: booking.customerId,
            title: "Booking Rescheduled",
            message: `Your appointment for booking #${booking.bookingNumber} (${booking.service.name}) has been updated to ${formattedDateDisplay} at ${preferredTime}.`,
            type: "BOOKING_UPDATE",
          },
        });
      } catch (notifErr) {
        console.error("Failed to create reschedule notification:", notifErr);
      }

      return NextResponse.json(
        {
          message: `Your booking has been successfully rescheduled to ${formattedDateDisplay} at ${preferredTime}.`,
          booking: updated,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Unrecognized action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Customer booking update error:", error);
    return NextResponse.json(
      { message: "Unable to update booking right now. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to manage your bookings." },
        { status: 401 }
      );
    }

    const suspended = await suspendedAccountResponse(session.user.id);
    if (suspended) return suspended;

    const { id } = await context.params;

    const booking = await db.booking.findUnique({
      where: { id },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        customerId: true,
        service: { select: { name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found." },
        { status: 404 }
      );
    }

    // Ownership check (or ADMIN)
    if (booking.customerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You do not have permission to delete this booking." },
        { status: 403 }
      );
    }

    // Cannot delete while in progress
    if (booking.status === "IN_PROGRESS") {
      return NextResponse.json(
        {
          message:
            "This booking is currently in progress and cannot be deleted. Please contact customer care if you need immediate assistance.",
        },
        { status: 400 }
      );
    }

    // Deletion allowed:
    // 1. Before work starts: PENDING, CONFIRMED
    // 2. When completed: COMPLETED
    // 3. When already cancelled: CANCELLED
    await db.$transaction(async (tx: any) => {
      await writeAudit(tx, {
        actorId: session.user.id,
        action: "CUSTOMER_DELETED_BOOKING",
        entityType: "BOOKING",
        entityId: id,
        reason: `Customer deleted booking #${booking.bookingNumber} (${booking.status})`,
        changes: {
          before: {
            bookingNumber: booking.bookingNumber,
            status: booking.status,
          },
        },
      });

      // Prisma cascade deletes related assignments, quotes, and reviews
      await tx.booking.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      {
        message: `Booking #${booking.bookingNumber} has been permanently deleted from your records.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Customer delete booking error:", error);
    return NextResponse.json(
      { message: "Unable to delete booking right now. Please try again." },
      { status: 500 }
    );
  }
}
