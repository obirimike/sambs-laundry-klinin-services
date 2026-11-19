import { db } from "@/lib/db";

export type SupervisedBookingDTO = {
  id: string;
  bookingNumber: string;
  status: string;
  supervisionStatus: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  specialInstructions: string | null;
  finalApprovalNote: string | null;
  supervisorAssignedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  service: {
    name: string;
    category: string;
    description: string;
  };
  assignments: Array<{
    id: string;
    staffId: string;
    status: string;
    notes: string | null;
    assignedAt: string;
    startedAt: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    staff: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
    submissions: Array<{
      id: string;
      summary: string;
      workPerformed: string;
      issuesNoted: string | null;
      photos: Array<{ storagePath: string; fileName: string }>;
      createdAt: string;
    }>;
  }>;
  workflowReviews: Array<{
    id: string;
    assignmentId: string | null;
    reviewerRole: string;
    decision: string;
    comment: string | null;
    createdAt: string;
    reviewer: { name: string };
  }>;
};

interface RawSupervisedBooking {
  id: string;
  bookingNumber: string;
  status: string;
  supervisionStatus: string;
  preferredDate: Date;
  preferredTime: string;
  address: string;
  specialInstructions: string | null;
  finalApprovalNote: string | null;
  supervisorAssignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer: { name: string; email: string; phone: string | null };
  service: { name: string; category: string; description: string };
  assignments?: Array<{
    id: string;
    staffId: string;
    status: string;
    notes: string | null;
    assignedAt: Date;
    startedAt: Date | null;
    submittedAt: Date | null;
    approvedAt: Date | null;
    staff: { id: string; name: string; email: string; phone: string | null };
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
    assignmentId: string | null;
    reviewerRole: string;
    decision: string;
    comment: string | null;
    createdAt: Date;
    reviewer: { name: string };
  }>;
}

function serializeBooking(b: RawSupervisedBooking): SupervisedBookingDTO {
  return {
    id: b.id,
    bookingNumber: b.bookingNumber,
    status: b.status,
    supervisionStatus: b.supervisionStatus,
    preferredDate: b.preferredDate.toISOString(),
    preferredTime: b.preferredTime,
    address: b.address,
    specialInstructions: b.specialInstructions ?? null,
    finalApprovalNote: b.finalApprovalNote ?? null,
    supervisorAssignedAt: b.supervisorAssignedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    customer: b.customer,
    service: b.service,
    assignments: (b.assignments ?? []).map((a) => ({
      id: a.id,
      staffId: a.staffId,
      status: a.status,
      notes: a.notes ?? null,
      assignedAt: a.assignedAt.toISOString(),
      startedAt: a.startedAt?.toISOString() ?? null,
      submittedAt: a.submittedAt?.toISOString() ?? null,
      approvedAt: a.approvedAt?.toISOString() ?? null,
      staff: a.staff,
      submissions: (a.submissions ?? []).map((s) => ({
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
    workflowReviews: (b.workflowReviews ?? []).map((r) => ({
      id: r.id,
      assignmentId: r.assignmentId ?? null,
      reviewerRole: r.reviewerRole,
      decision: r.decision,
      comment: r.comment ?? null,
      createdAt: r.createdAt.toISOString(),
      reviewer: r.reviewer,
    })),
  };
}

export async function getSupervisedBookings(
  supervisorId: string
): Promise<SupervisedBookingDTO[]> {
  const bookings = await db.booking.findMany({
    where: {
      supervisorId,
      status: { not: "CANCELLED" },
    },
    orderBy: [{ preferredDate: "asc" }, { updatedAt: "desc" }],
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      service: { select: { name: true, category: true, description: true } },
      assignments: {
        where: { isActive: true },
        orderBy: { assignedAt: "asc" },
        include: {
          staff: {
            select: { id: true, name: true, email: true, phone: true },
          },
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      },
      workflowReviews: {
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: { select: { name: true } },
        },
      },
    },
  });

  return bookings.map(serializeBooking);
}

export async function getSupervisedBookingById(
  bookingId: string,
  supervisorId: string
): Promise<SupervisedBookingDTO | null> {
  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      supervisorId,
    },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      service: { select: { name: true, category: true, description: true } },
      assignments: {
        where: { isActive: true },
        orderBy: { assignedAt: "asc" },
        include: {
          staff: {
            select: { id: true, name: true, email: true, phone: true },
          },
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      workflowReviews: {
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: { select: { name: true } },
        },
      },
    },
  });

  return booking ? serializeBooking(booking) : null;
}

export async function getSupervisorBadges(supervisorId: string) {
  const [
    awaitingReview,
    changesRequested,
    approvedCount,
    unreadNotifications,
  ] = await Promise.all([
    db.booking.count({
      where: {
        supervisorId,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        supervisionStatus: {
          in: ["AWAITING_SUPERVISOR_REVIEW", "RETURNED_BY_ADMIN"],
        },
      },
    }),
    db.booking.count({
      where: {
        supervisorId,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        supervisionStatus: "CHANGES_REQUESTED",
      },
    }),
    db.booking.count({
      where: {
        supervisorId,
        supervisionStatus: "SUPERVISOR_APPROVED",
      },
    }),
    db.notification.count({
      where: { userId: supervisorId, isRead: false },
    }),
  ]);

  return {
    awaitingReview,
    changesRequested,
    approvedCount,
    unreadNotifications,
  };
}
