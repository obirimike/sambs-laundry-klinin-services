import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminNavigation from "@/components/admin/AdminNavigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const [
    pendingBookings,
    awaitingFinalApproval,
    newMessages,
    unreadNotifications,
  ] = await Promise.all([
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({
      where: {
        supervisionStatus: "SUPERVISOR_APPROVED",
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex lg:h-screen lg:overflow-hidden">
      <AdminNavigation
        adminName={session.user.name || "Administrator"}
        badges={{
          pendingBookings,
          awaitingFinalApproval,
          newMessages,
          unreadNotifications,
        }}
      />
      <div
        id="admin-main-content"
        className="min-w-0 flex-1 lg:h-screen lg:overflow-y-auto lg:overscroll-contain"
      >
        {children}
      </div>
    </div>
  );
}
