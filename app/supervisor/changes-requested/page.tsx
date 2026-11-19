import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupervisorJobsView from "@/components/supervisor/SupervisorJobsView";
import { getSupervisedBookings } from "@/lib/supervisor-data";

export const dynamic = "force-dynamic";

export default async function SupervisorChangesRequestedPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsupervisor%2Fchanges-requested");
  }

  if (session.user.role !== "SUPERVISOR") {
    redirect("/account");
  }

  const allBookings = await getSupervisedBookings(session.user.id);
  const bookings = allBookings.filter(
    (b) =>
      b.supervisionStatus === "CHANGES_REQUESTED" &&
      ["CONFIRMED", "IN_PROGRESS"].includes(b.status)
  );

  return (
    <SupervisorJobsView
      title="Changes Requested"
      subtitle="Jobs sent back to field staff for rework or updated completion evidence."
      emptyTitle="No pending correction requests"
      emptyDescription="Bookings where you requested staff corrections will appear here until staff resubmit."
      bookings={bookings}
    />
  );
}
