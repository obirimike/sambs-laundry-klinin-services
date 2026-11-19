import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupervisorNavigation from "@/components/supervisor/SupervisorNavigation";
import { getSupervisorBadges } from "@/lib/supervisor-data";

export const dynamic = "force-dynamic";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsupervisor");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session.user.role === "STAFF") {
    redirect("/staff");
  }

  if (session.user.role !== "SUPERVISOR") {
    redirect("/account");
  }

  const badges = await getSupervisorBadges(session.user.id);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:h-screen lg:flex-row lg:overflow-hidden">
      <SupervisorNavigation
        supervisorName={session.user.name || "Lead Supervisor"}
        badges={badges}
      />
      <div
        id="supervisor-main-content"
        className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto"
      >
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
