import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import StaffManagement from "@/components/admin/StaffManagement";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/account");

  const members = await db.user.findMany({
    where: { role: { in: ["STAFF", "SUPERVISOR"] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      accountStatus: true,
      createdAt: true,
      assignmentsReceived: {
        where: { isActive: true },
        select: { id: true },
      },
      bookingsSupervised: {
        where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
        select: { id: true },
      },
    },
  });

  interface RawTeamMember {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "STAFF" | "SUPERVISOR";
    accountStatus: "ACTIVE" | "SUSPENDED";
    createdAt: Date;
    assignmentsReceived: Array<{ id: string }>;
    bookingsSupervised: Array<{ id: string }>;
  }

  const initialStaff = (members as RawTeamMember[]).map(
    ({ assignmentsReceived, bookingsSupervised, ...member }) => ({
      ...member,
      createdAt: member.createdAt.toISOString(),
      activeAssignmentCount: assignmentsReceived.length,
      activeSupervisionCount: bookingsSupervised.length,
    })
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <StaffManagement initialStaff={initialStaff} />
    </main>
  );
}
