import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupervisorJobsView from "@/components/supervisor/SupervisorJobsView";
import { getSupervisedBookings } from "@/lib/supervisor-data";

export const dynamic = "force-dynamic";

export default async function SupervisorJobsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsupervisor%2Fjobs");
  }

  if (session.user.role !== "SUPERVISOR") {
    redirect("/account");
  }

  const bookings = await getSupervisedBookings(session.user.id);

  return (
    <SupervisorJobsView
      title="Supervised Jobs"
      subtitle="All bookings assigned to you as lead supervisor across active and completed stages."
      emptyTitle="No supervised jobs yet"
      emptyDescription="Bookings will appear here once an administrator assigns you as the lead supervisor."
      bookings={bookings}
    />
  );
}
