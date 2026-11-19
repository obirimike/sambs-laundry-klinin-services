import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import StaffWorkspaceClient, {
  type StaffAssignmentItem,
} from "@/components/staff/StaffWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fstaff");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "SUPERVISOR") redirect("/supervisor");
  if (session.user.role !== "STAFF") redirect("/account");

  const [assignments, unreadNotifications] = await Promise.all([
    db.bookingAssignment.findMany({
      where: {
        staffId: session.user.id,
        isActive: true,
        booking: {
          status: { in: ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] },
        },
      },
      orderBy: { assignedAt: "desc" },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            supervisionStatus: true,
            preferredDate: true,
            preferredTime: true,
            address: true,
            specialInstructions: true,
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
            service: {
              select: {
                name: true,
                category: true,
              },
            },
            supervisor: {
              select: {
                id: true,
                name: true,
              },
            },
            assignments: {
              where: { isActive: true },
              select: {
                id: true,
                staffId: true,
                status: true,
                staff: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            workflowReviews: {
              orderBy: { createdAt: "desc" },
              take: 10,
              include: {
                reviewer: { select: { name: true } },
              },
            },
          },
        },
      },
    }),

    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  interface RawStaffBookingAssignment {
    id: string;
    status: string;
    notes: string | null;
    assignedAt: Date;
    startedAt: Date | null;
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
    booking: {
      id: string;
      bookingNumber: string;
      status: string;
      supervisionStatus: string;
      preferredDate: Date;
      preferredTime: string;
      address: string;
      specialInstructions: string | null;
      customer: { name: string; phone: string | null };
      service: { name: string; category: string };
      supervisor: { id: string; name: string } | null;
      assignments?: Array<{
        id: string;
        staffId: string;
        status: string;
        staff: { id: string; name: string } | null;
      }>;
      workflowReviews?: Array<{
        decision: string;
        assignmentId: string | null;
        comment: string | null;
        createdAt: Date;
        reviewer: { name: string } | null;
      }>;
    };
  }

  const serialized: StaffAssignmentItem[] = (
    assignments as RawStaffBookingAssignment[]
  ).map((a) => {
    const coworkers = (a.booking.assignments ?? [])
      .filter((other) => other.staffId !== session.user.id)
      .map((other) => ({
        assignmentId: other.id,
        staffId: other.staffId,
        name: other.staff?.name || "Team Member",
        status: other.status,
      }));

    const latestSub = a.submissions?.[0] ?? null;

    const matchingFeedback = (a.booking.workflowReviews ?? []).find(
      (r) =>
        r.decision === "CHANGES_REQUESTED" &&
        (!r.assignmentId || r.assignmentId === a.id)
    );

    return {
      id: a.id,
      status: a.status,
      notes: a.notes,
      assignedAt: a.assignedAt.toISOString(),
      startedAt: a.startedAt?.toISOString() ?? null,
      submittedAt: a.submittedAt?.toISOString() ?? null,
      approvedAt: a.approvedAt?.toISOString() ?? null,
      booking: {
        id: a.booking.id,
        bookingNumber: a.booking.bookingNumber,
        status: a.booking.status,
        supervisionStatus: a.booking.supervisionStatus,
        preferredDate: a.booking.preferredDate.toISOString(),
        preferredTime: a.booking.preferredTime,
        address: a.booking.address,
        specialInstructions: a.booking.specialInstructions,
        customer: a.booking.customer,
        service: a.booking.service,
        supervisor: a.booking.supervisor,
      },
      coworkers,
      latestSubmission: latestSub
        ? {
            id: latestSub.id,
            summary: latestSub.summary,
            workPerformed: latestSub.workPerformed,
            issuesNoted: latestSub.issuesNoted,
            photos: Array.isArray(latestSub.photos)
              ? (latestSub.photos as Array<{
                  storagePath: string;
                  fileName: string;
                }>)
              : [],
            createdAt: latestSub.createdAt.toISOString(),
          }
        : null,
      supervisorFeedback: matchingFeedback?.comment
        ? {
            comment: matchingFeedback.comment,
            reviewerName: matchingFeedback.reviewer?.name || "Supervisor",
            createdAt: matchingFeedback.createdAt.toISOString(),
          }
        : null,
    };
  });

  return (
    <StaffWorkspaceClient
      staffName={session.user.name || "Team member"}
      unreadNotifications={unreadNotifications}
      assignments={serialized}
    />
  );
}
