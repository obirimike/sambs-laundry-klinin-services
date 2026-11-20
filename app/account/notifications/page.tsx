import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleHomePath } from "@/lib/role-guards";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import NotificationsList from "@/components/dashboard/notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Faccount%2Fnotifications");
  }

  const backHref = roleHomePath(session.user.role);

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700 transition"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
          </div>

          <NotificationsList
            initialNotifications={notifications.map((notification) => ({
              ...notification,
              createdAt: notification.createdAt.toISOString(),
            }))}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}