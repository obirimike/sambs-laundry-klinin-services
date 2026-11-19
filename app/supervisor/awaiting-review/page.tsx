import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupervisorJobsView from "@/components/supervisor/SupervisorJobsView";
import { getSupervisedBookings } from "@/lib/supervisor-data";

export const dynamic = "force-dynamic";

export default async function SupervisorAwaitingReviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsupervisor%2Fawaiting-review");
  }

  if (session.user.role !== "SUPERVISOR") {
    redirect("/account");
  }

  const allBookings = await getSupervisedBookings(session.user.id);
  const bookings = allBookings.filter(
    (b) =>
      ["AWAITING_SUPERVISOR_REVIEW", "RETURNED_BY_ADMIN"].includes(
        b.supervisionStatus
      ) && ["CONFIRMED", "IN_PROGRESS"].includes(b.status)
  );

  return (
    <SupervisorJobsView
      title="Awaiting Review"
      subtitle="Bookings with completed staff reports ready for your inspection, plus any jobs returned by administrators."
      emptyTitle="No bookings awaiting review"
      emptyDescription="Once all assigned staff submit completion reports, the booking moves here for your inspection."
      bookings={bookings}
    />
  );
}
