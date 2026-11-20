import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  Bell,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  Clock3,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBookingStatus, formatSupervisionStatus } from "@/lib/workflow";

export const dynamic = "force-dynamic";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Accra",
  }).format(date);
}

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);

  const [
    pendingBookings,
    confirmedBookings,
    inProgressBookings,
    completedBookings,
    unassignedConfirmed,
    awaitingSupervisorReview,
    awaitingFinalApprovalCount,
    activeTeamCount,
    newMessagesCount,
    sentQuotesCount,
    unreadNotificationsCount,
    finalApprovalQueue,
    unassignedQueue,
    pendingQueue,
    todaysBookings,
    recentAuditLogs,
  ] = await Promise.all([
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: "IN_PROGRESS" } }),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        assignments: { none: { isActive: true } },
      },
    }),
    db.booking.count({
      where: {
        supervisionStatus: "AWAITING_SUPERVISOR_REVIEW",
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
    }),
    db.booking.count({
      where: {
        supervisionStatus: "SUPERVISOR_APPROVED",
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    db.user.count({
      where: {
        role: { in: ["STAFF", "SUPERVISOR"] },
        accountStatus: "ACTIVE",
      },
    }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.quote.count({ where: { status: "SENT" } }),
    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
    db.booking.findMany({
      where: {
        supervisionStatus: "SUPERVISOR_APPROVED",
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        service: { select: { name: true } },
        supervisor: { select: { name: true } },
      },
    }),
    db.booking.findMany({
      where: {
        status: "CONFIRMED",
        assignments: { none: { isActive: true } },
      },
      take: 4,
      orderBy: { preferredDate: "asc" },
      include: {
        service: { select: { name: true } },
        customer: { select: { name: true } },
      },
    }),
    db.booking.findMany({
      where: { status: "PENDING" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        service: { select: { name: true } },
        customer: { select: { name: true } },
      },
    }),
    db.booking.findMany({
      where: {
        preferredDate: {
          gte: todayStart,
          lt: todayEnd,
        },
        status: { not: "CANCELLED" },
      },
      orderBy: { preferredTime: "asc" },
      take: 8,
      include: {
        service: { select: { name: true } },
        customer: { select: { name: true } },
        supervisor: { select: { name: true } },
        assignments: {
          where: { isActive: true },
          include: { staff: { select: { name: true } } },
        },
      },
    }),
    db.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { name: true, role: true } },
      },
    }),
  ]);

  const greeting = getGreeting(now.getHours());
  const formattedToday = new Intl.DateTimeFormat("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const stats = [
    {
      label: "Pending review",
      value: pendingBookings,
      note: "New customer requests",
      href: "/admin/bookings",
      icon: Clock3,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Active jobs",
      value: confirmedBookings + inProgressBookings,
      note: `${inProgressBookings} in progress`,
      href: "/admin/bookings",
      icon: CalendarClock,
      tone: "text-blue-700 bg-blue-50",
    },
    {
      label: "Unassigned confirmed",
      value: unassignedConfirmed,
      note: "Needs staff & supervisor",
      href: "/admin/assignments",
      icon: UserPlus,
      tone: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Awaiting final approval",
      value: awaitingFinalApprovalCount,
      note: "Supervisor signed off",
      href: "/admin/approvals",
      icon: CheckCheck,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Active team",
      value: activeTeamCount,
      note: "Staff & supervisors",
      href: "/admin/staff",
      icon: UserCheck,
      tone: "text-slate-700 bg-slate-100",
    },
    {
      label: "Open inbox & quotes",
      value: newMessagesCount + sentQuotesCount,
      note: `${newMessagesCount} messages · ${sentQuotesCount} quotes`,
      href: "/admin/messages",
      icon: MessageSquare,
      tone: "text-slate-700 bg-slate-100",
    },
  ];

  const pipelineStages = [
    {
      label: "Pending",
      count: pendingBookings,
      href: "/admin/bookings?status=PENDING",
    },
    {
      label: "Confirmed",
      count: confirmedBookings,
      href: "/admin/bookings?status=CONFIRMED",
    },
    {
      label: "In Progress",
      count: inProgressBookings,
      href: "/admin/bookings?status=IN_PROGRESS",
    },
    {
      label: "Supervisor Review",
      count: awaitingSupervisorReview,
      href: "/admin/bookings?supervision=AWAITING_SUPERVISOR_REVIEW",
    },
    {
      label: "Admin Approval",
      count: awaitingFinalApprovalCount,
      href: "/admin/approvals",
    },
    {
      label: "Completed",
      count: completedBookings,
      href: "/admin/bookings?status=COMPLETED",
    },
  ];

  const attentionItems = [
    ...(
      finalApprovalQueue as Array<{
        id: string;
        bookingNumber: string;
        service: { name: string };
        supervisor: { name: string } | null;
      }>
    ).map((b) => ({
      id: `final-${b.id}`,
      category: "Final Approval",
      title: `${b.bookingNumber} · ${b.service.name}`,
      detail: `Supervisor ${b.supervisor?.name || "Lead"} approved work for release`,
      href: `/admin/approvals`,
      actionLabel: "Review & approve",
      accent: "text-emerald-800 bg-emerald-50 border-emerald-200",
    })),
    ...(
      unassignedQueue as Array<{
        id: string;
        bookingNumber: string;
        preferredDate: Date;
        preferredTime: string;
        service: { name: string };
        customer: { name: string };
      }>
    ).map((b) => ({
      id: `assign-${b.id}`,
      category: "Unassigned",
      title: `${b.bookingNumber} · ${b.service.name}`,
      detail: `${b.customer.name} · ${formatDate(b.preferredDate)} at ${b.preferredTime}`,
      href: `/admin/assignments`,
      actionLabel: "Assign team",
      accent: "text-indigo-800 bg-indigo-50 border-indigo-200",
    })),
    ...(
      pendingQueue as Array<{
        id: string;
        bookingNumber: string;
        preferredDate: Date;
        service: { name: string };
        customer: { name: string };
      }>
    ).map((b) => ({
      id: `pending-${b.id}`,
      category: "Pending Review",
      title: `${b.bookingNumber} · ${b.service.name}`,
      detail: `${b.customer.name} · Requested ${formatDate(b.preferredDate)}`,
      href: `/admin/bookings/${b.id}`,
      actionLabel: "Review request",
      accent: "text-amber-800 bg-amber-50 border-amber-200",
    })),
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-7 sm:px-6 lg:px-8">
      {/* Contextual Control Center Header */}
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{formattedToday}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting}, {session.user.name || "Administrator"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Operational overview across bookings, field assignments, supervisor
            sign-offs, and customer releases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/account/notifications"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 whitespace-nowrap"
          >
            <Bell size={16} className="text-slate-500" />
            <span>Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-800 tabular-nums">
                {unreadNotificationsCount}
              </span>
            )}
          </Link>

          <Link
            href={
              awaitingFinalApprovalCount > 0
                ? "/admin/approvals"
                : "/admin/bookings"
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#031c43] px-4 text-sm font-semibold text-white transition hover:bg-blue-950 whitespace-nowrap"
          >
            <span>
              {awaitingFinalApprovalCount > 0
                ? `Final Approvals (${awaitingFinalApprovalCount})`
                : "Manage Bookings"}
            </span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Operational Stats Row */}
      <section aria-label="Operational metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    {stat.label}
                  </span>
                  <span className={`rounded-lg p-1.5 ${stat.tone}`}>
                    <Icon size={16} />
                  </span>
                </div>
                <p className="mt-3 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {stat.note}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Work Pipeline Strip */}
      <section
        aria-label="Work pipeline"
        className="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Work Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Live booking distribution from intake through supervisor review and
              final completion
            </p>
          </div>
          <Link
            href="/admin/bookings"
            className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
          >
            View all bookings
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {pipelineStages.map((stage) => (
            <Link
              key={stage.label}
              href={stage.href}
              className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition hover:border-blue-300 hover:bg-white"
            >
              <p className="truncate text-xs font-medium text-slate-600">
                {stage.label}
              </p>
              <p className="mt-1.5 font-mono text-xl font-bold text-slate-900 tabular-nums">
                {stage.count}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Requires Your Attention + Today's Schedule */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Requires Your Attention */}
        <section
          aria-label="Requires your attention"
          className="rounded-xl border border-slate-200 bg-white lg:col-span-7"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Requires Your Attention
              </h2>
              <p className="text-xs text-slate-500">
                Final approvals, unassigned jobs, and pending requests
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums">
              {attentionItems.length} items
            </span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheck size={28} className="mx-auto text-emerald-600" />
              <p className="mt-2 text-base font-semibold text-slate-900">
                All queues are up to date
              </p>
              <p className="mt-1 text-sm text-slate-500">
                No pending requests, unassigned confirmed jobs, or final
                approvals waiting right now.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {attentionItems.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${item.accent}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {item.title}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm text-slate-600">
                      {item.detail}
                    </p>
                  </div>

                  <Link
                    href={item.href}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-800 transition hover:bg-slate-50 whitespace-nowrap shadow-2xs"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Today's Schedule */}
        <section
          aria-label="Today's schedule"
          className="rounded-xl border border-slate-200 bg-white lg:col-span-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Today&apos;s Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Bookings scheduled for today
              </p>
            </div>
            <Link
              href="/admin/calendar"
              className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
            >
              Open calendar
            </Link>
          </div>

          {todaysBookings.length === 0 ? (
            <div className="p-8 text-center">
              <ClipboardList size={26} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-900">
                No jobs scheduled today
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Confirmed and active jobs for today&apos;s date will appear
                here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(
                todaysBookings as Array<{
                  id: string;
                  bookingNumber: string;
                  status: string;
                  supervisionStatus: string;
                  preferredTime: string;
                  service: { name: string };
                  customer: { name: string };
                  supervisor: { name: string } | null;
                  assignments: Array<{ staff: { name: string } }>;
                }>
              ).map((booking) => {
                const bStatus = formatBookingStatus(booking.status);
                const sStatus = formatSupervisionStatus(
                  booking.supervisionStatus
                );

                return (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="block px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                        {booking.preferredTime} · {booking.bookingNumber}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {bStatus.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-base font-bold text-slate-950">
                      {booking.service.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{booking.customer.name}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        {booking.assignments.length} staff
                        {booking.supervisor
                          ? ` · Lead: ${booking.supervisor.name}`
                          : " · No supervisor"}
                      </span>
                      {booking.supervisionStatus !== "NOT_REQUIRED" && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-semibold text-blue-900">
                            {sStatus.label}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-label="Recent activity"
          className="rounded-xl border border-slate-200 bg-white lg:col-span-8"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Recent Activity
              </h2>
              <p className="text-xs text-slate-500">
                Latest recorded operational, supervisor, and admin events
              </p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
            >
              Full audit log
            </Link>
          </div>

          {recentAuditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No operational events logged yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(
                recentAuditLogs as Array<{
                  id: string;
                  action: string;
                  entityType: string;
                  reason: string | null;
                  createdAt: Date;
                  actor: { name: string; role: string } | null;
                }>
              ).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-1.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-slate-900">
                      {humanizeAction(log.action)}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">{log.actor?.name || "System"}</span> · {log.entityType}
                      {log.reason ? ` · ${log.reason}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs sm:text-sm font-medium text-slate-500 tabular-nums">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          aria-label="Quick actions"
          className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-4"
        >
          <h2 className="text-base font-semibold text-slate-900">
            Quick Actions
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Jump directly to daily management tasks
          </p>

          <div className="mt-4 space-y-2.5">
            <Link
              href="/admin/assignments"
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2.5">
                <UserPlus size={16} className="text-blue-700" />
                Assign staff &amp; supervisors
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>

            <Link
              href="/admin/approvals"
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2.5">
                <CheckCheck size={16} className="text-emerald-700" />
                Review final approvals
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>

            <Link
              href="/admin/staff"
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2.5">
                <Users size={16} className="text-slate-700" />
                Manage staff &amp; supervisors
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>

            <Link
              href="/admin/quotes"
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2.5">
                <BadgeDollarSign size={16} className="text-slate-700" />
                Quotes &amp; pricing
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
