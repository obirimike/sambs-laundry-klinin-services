import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupervisorJobsView from "@/components/supervisor/SupervisorJobsView";
import { getSupervisedBookings } from "@/lib/supervisor-data";

export const dynamic = "force-dynamic";

export default async function SupervisorApprovedPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsupervisor%2Fapproved");
  }

  if (session.user.role !== "SUPERVISOR") {
    redirect("/account");
  }

  const allBookings = await getSupervisedBookings(session.user.id);
  const bookings = allBookings.filter(
    (b) =>
      b.supervisionStatus === "SUPERVISOR_APPROVED" || b.status === "COMPLETED"
  );

  return (
    <SupervisorJobsView
      title="Approved Jobs"
      subtitle="Bookings you approved for final administrator sign-off, as well as customer-completed jobs."
      emptyTitle="No approved jobs yet"
      emptyDescription="Jobs you approve after staff submission will appear here."
      bookings={bookings}
    />
  );
}
