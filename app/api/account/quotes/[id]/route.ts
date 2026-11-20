import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suspendedAccountResponse } from "@/lib/account-access";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to manage your quotations." },
        { status: 401 }
      );
    }

    if (session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { message: "Only customer accounts can access this feature." },
        { status: 403 }
      );
    }

    const suspended = await suspendedAccountResponse(session.user.id);
    if (suspended) return suspended;

    const { id } = await params;

    // Ensure the quote belongs to a booking owned by this customer
    const quote = await db.quote.findFirst({
      where: {
        id,
        booking: {
          is: {
            customerId: session.user.id,
          },
        },
      },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            customerId: true,
            service: { select: { name: true } },
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { message: "Quotation not found or you do not have permission to remove it." },
        { status: 404 }
      );
    }

    await db.$transaction(async (tx) => {
      await writeAudit(tx, {
        actorId: session.user.id,
        action: "CUSTOMER_CLEARED_QUOTE",
        entityType: "QUOTE",
        entityId: id,
        reason: `Customer removed quote #${quote.quoteNumber} (status: ${quote.status})`,
        changes: {
          before: {
            quoteNumber: quote.quoteNumber,
            status: quote.status,
            amount: quote.amount.toString(),
            bookingNumber: quote.booking.bookingNumber,
          },
        },
      });

      await tx.quote.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      {
        message: `Quotation #${quote.quoteNumber} has been removed successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Customer delete quote error:", error);
    return NextResponse.json(
      { message: "Unable to remove this quotation right now. Please try again." },
      { status: 500 }
    );
  }
}
