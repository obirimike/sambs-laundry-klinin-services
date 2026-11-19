import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AssignmentManagement from "@/components/admin/AssignmentManagement";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  const [bookings, staff, supervisors] = await Promise.all([
    db.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      orderBy: [{ preferredDate: "asc" }, { preferredTime: "asc" }],
      include: {
        customer: {
          select: {
            name: true,
            email: true,
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
            email: true,
          },
        },
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            assignedBy: {
              select: { name: true },
            },
            unassignedBy: {
              select: { name: true },
            },
          },
        },
      },
    }),

    db.user.findMany({
      where: { role: "STAFF", accountStatus: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),

    db.user.findMany({
      where: { role: "SUPERVISOR", accountStatus: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
  ]);

  interface RawAssignmentBooking {
    id: string;
    bookingNumber: string;
    status: string;
    supervisionStatus: string;
    supervisorId: string | null;
    supervisor: { id: string; name: string; email: string } | null;
    preferredDate: Date;
    preferredTime: string;
    address: string;
    specialInstructions: string | null;
    customer: { name: string; email: string; phone: string | null };
    service: { name: string; category: string };
    assignments: Array<{
      id: string;
      staffId: string;
      staff: { id: string; name: string; email: string; phone: string | null };
      status: string;
      notes: string | null;
      isActive: boolean;
      assignedAt: Date;
      unassignedAt: Date | null;
      assignedBy: { name: string };
      unassignedBy: { name: string } | null;
    }>;
  }

  const initialBookings = (bookings as RawAssignmentBooking[]).map((booking) => ({
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    supervisionStatus: booking.supervisionStatus,
    supervisorId: booking.supervisorId,
    supervisor: booking.supervisor,
    preferredDate: booking.preferredDate.toISOString(),
    preferredTime: booking.preferredTime,
    address: booking.address,
    specialInstructions: booking.specialInstructions,
    customer: booking.customer,
    service: booking.service,
    assignments: booking.assignments.map((assignment) => ({
      id: assignment.id,
      staffId: assignment.staffId,
      staff: assignment.staff,
      status: assignment.status,
      notes: assignment.notes,
      isActive: assignment.isActive,
      assignedAt: assignment.assignedAt.toISOString(),
      unassignedAt: assignment.unassignedAt?.toISOString() ?? null,
      assignedByName: assignment.assignedBy.name,
      unassignedByName: assignment.unassignedBy?.name ?? null,
    })),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AssignmentManagement
        initialBookings={initialBookings}
        staff={staff}
        supervisors={supervisors}
      />
    </main>
  );
}
