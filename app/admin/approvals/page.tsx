import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import FinalApprovalClient, {
  type ApprovalBookingRecord,
} from "@/components/admin/FinalApprovalClient";

export const dynamic = "force-dynamic";

interface RawApprovalBooking {
  id: string;
  bookingNumber: string;
  status: string;
  supervisionStatus: string;
  preferredDate: Date;
  preferredTime: string;
  address: string;
  finalApprovedAt: Date | null;
  finalApprovalNote: string | null;
  customer: { name: string; email: string; phone: string | null };
  service: { name: string; category: string };
  supervisor: { id: string; name: string; email: string } | null;
  finalApprovedBy: { name: string } | null;
  assignments?: Array<{
    id: string;
    status: string;
    staff: { id: string; name: string; email: string };
    submittedAt: Date | null;
    approvedAt: Date | null;
    submissions?: Array<{
      id: string;
      summary: string;
      workPerformed: string;
      issuesNoted: string | null;
      photos: unknown;
      createdAt: Date;
    }>;
  }>;
  workflowReviews?: Array<{
    id: string;
    reviewerRole: string;
    decision: string;
    comment: string | null;
    createdAt: Date;
    reviewer: { name: string };
  }>;
}

function serializeBooking(booking: RawApprovalBooking): ApprovalBookingRecord {
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    supervisionStatus: booking.supervisionStatus,
    preferredDate: booking.preferredDate.toISOString(),
    preferredTime: booking.preferredTime,
    address: booking.address,
    finalApprovedAt: booking.finalApprovedAt?.toISOString() ?? null,
    finalApprovalNote: booking.finalApprovalNote ?? null,
    customer: booking.customer,
    service: booking.service,
    supervisor: booking.supervisor ?? null,
    finalApprovedBy: booking.finalApprovedBy ?? null,
    assignments: (booking.assignments || []).map((a) => ({
      id: a.id,
      status: a.status,
      staff: a.staff,
      submittedAt: a.submittedAt?.toISOString() ?? null,
      approvedAt: a.approvedAt?.toISOString() ?? null,
      submissions: (a.submissions || []).map((s) => ({
        id: s.id,
        summary: s.summary,
        workPerformed: s.workPerformed,
        issuesNoted: s.issuesNoted ?? null,
        photos: Array.isArray(s.photos)
          ? (s.photos as Array<{ storagePath: string; fileName: string }>)
          : [],
        createdAt: s.createdAt.toISOString(),
      })),
    })),
    workflowReviews: (booking.workflowReviews || []).map((r) => ({
      id: r.id,
      reviewerRole: r.reviewerRole,
      decision: r.decision,
      comment: r.comment ?? null,
      createdAt: r.createdAt.toISOString(),
      reviewer: r.reviewer,
    })),
  };
}

export default async function AdminFinalApprovalsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fadmin%2Fapprovals");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const bookingInclude = {
    customer: { select: { name: true, email: true, phone: true } },
    service: { select: { name: true, category: true } },
    supervisor: { select: { id: true, name: true, email: true } },
    finalApprovedBy: { select: { name: true } },
    assignments: {
      where: { isActive: true },
      orderBy: { assignedAt: "asc" as const },
      include: {
        staff: { select: { id: true, name: true, email: true } },
        submissions: {
          orderBy: { createdAt: "desc" as const },
          take: 3,
        },
      },
    },
    workflowReviews: {
      orderBy: { createdAt: "desc" as const },
      include: {
        reviewer: { select: { name: true } },
      },
    },
  };

  const [awaitingRaw, returnedRaw, completedRaw] = await Promise.all([
    db.booking.findMany({
      where: {
        supervisionStatus: "SUPERVISOR_APPROVED",
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: { updatedAt: "desc" },
      include: bookingInclude,
    }),
    db.booking.findMany({
      where: {
        supervisionStatus: "RETURNED_BY_ADMIN",
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: { updatedAt: "desc" },
      include: bookingInclude,
    }),
    db.booking.findMany({
      where: {
        status: "COMPLETED",
        finalApprovedAt: { not: null },
      },
      orderBy: { finalApprovedAt: "desc" },
      take: 25,
      include: bookingInclude,
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <FinalApprovalClient
        awaitingBookings={awaitingRaw.map(serializeBooking)}
        returnedBookings={returnedRaw.map(serializeBooking)}
        completedBookings={completedRaw.map(serializeBooking)}
      />
    </main>
  );
}
