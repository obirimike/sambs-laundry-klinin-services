import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupervisorJobsView from "@/components/supervisor/SupervisorJobsView";
import { getSupervisedBookings } from "@/lib/supervisor-data";

export const dynamic = "force-dynamic";

export default async function SupervisorInProgressPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsupervisor%2Fin-progress");
  }

  if (session.user.role !== "SUPERVISOR") {
    redirect("/account");
  }

  const allBookings = await getSupervisedBookings(session.user.id);
  const bookings = allBookings.filter(
    (b) =>
      ["ASSIGNED", "IN_PROGRESS"].includes(b.supervisionStatus) &&
      ["CONFIRMED", "IN_PROGRESS"].includes(b.status)
  );

  return (
    <SupervisorJobsView
      title="In Progress"
      subtitle="Supervised jobs where field staff are currently scheduled or actively executing service."
      emptyTitle="No jobs currently in progress"
      emptyDescription="Assigned bookings awaiting staff completion reports will appear in this queue."
      bookings={bookings}
    />
  );
}
