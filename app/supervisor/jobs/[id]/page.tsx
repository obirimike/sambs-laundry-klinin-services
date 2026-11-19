import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupervisorJobReviewClient from "@/components/supervisor/SupervisorJobReviewClient";
import { getSupervisedBookingById } from "@/lib/supervisor-data";

export const dynamic = "force-dynamic";

export default async function SupervisorJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsupervisor%2Fjobs");
  }

  if (session.user.role !== "SUPERVISOR") {
    redirect("/account");
  }

  const { id } = await params;
  const booking = await getSupervisedBookingById(id, session.user.id);

  if (!booking) {
    notFound();
  }

  return <SupervisorJobReviewClient booking={booking} />;
}
