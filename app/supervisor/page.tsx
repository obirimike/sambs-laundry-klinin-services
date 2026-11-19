import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  Clock3,
  ShieldCheck,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSupervisedBookings } from "@/lib/supervisor-data";
import { formatBookingStatus, formatSupervisionStatus } from "@/lib/workflow";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SupervisorOverviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsupervisor");
  }

  if (session.user.role !== "SUPERVISOR") {
    redirect("/account");
  }

  const [bookings, unreadNotifications] = await Promise.all([
    getSupervisedBookings(session.user.id),
    db.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  const inProgressJobs = bookings.filter(
    (b) =>
      ["ASSIGNED", "IN_PROGRESS"].includes(b.supervisionStatus) &&
      ["CONFIRMED", "IN_PROGRESS"].includes(b.status)
  );
  const awaitingReviewJobs = bookings.filter(
    (b) =>
      ["AWAITING_SUPERVISOR_REVIEW", "RETURNED_BY_ADMIN"].includes(
        b.supervisionStatus
      ) && ["CONFIRMED", "IN_PROGRESS"].includes(b.status)
  );
  const changesRequestedJobs = bookings.filter(
    (b) =>
      b.supervisionStatus === "CHANGES_REQUESTED" &&
      ["CONFIRMED", "IN_PROGRESS"].includes(b.status)
  );
  const approvedJobs = bookings.filter(
    (b) =>
      b.supervisionStatus === "SUPERVISOR_APPROVED" || b.status === "COMPLETED"
  );
  const returnedCount = bookings.filter(
    (b) => b.supervisionStatus === "RETURNED_BY_ADMIN"
  ).length;

  const stats = [
    {
      label: "Total Supervised",
      value: bookings.length,
      note: "Active & historical",
      href: "/supervisor/jobs",
      icon: Briefcase,
      tone: "text-slate-700 bg-slate-100",
    },
    {
      label: "In Progress",
      value: inProgressJobs.length,
      note: "Field teams working",
      href: "/supervisor/in-progress",
      icon: Clock3,
      tone: "text-blue-700 bg-blue-50",
    },
    {
      label: "Awaiting My Review",
      value: awaitingReviewJobs.length,
      note:
        returnedCount > 0
          ? `${returnedCount} returned by admin`
          : "Reports submitted",
      href: "/supervisor/awaiting-review",
      icon: ClipboardCheck,
      tone: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "Changes Requested",
      value: changesRequestedJobs.length,
      note: "Awaiting staff rework",
      href: "/supervisor/changes-requested",
      icon: AlertTriangle,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Approved / Completed",
      value: approvedJobs.length,
      note: "Escalated or closed",
      href: "/supervisor/approved",
      icon: CheckCheck,
      tone: "text-emerald-700 bg-emerald-50",
    },
  ];

  const upcomingJobs = bookings
    .filter((b) => ["CONFIRMED", "IN_PROGRESS"].includes(b.status))
    .slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-7 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Lead Supervisor Portal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome, {session.user.name || "Supervisor"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inspect field staff completion reports, request rework when needed,
            and escalate quality-verified jobs to administrators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/account/notifications"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 whitespace-nowrap"
          >
            <Bell size={16} className="text-slate-500" />
            <span>Notifications</span>
            {unreadNotifications > 0 && (
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-800 tabular-nums">
                {unreadNotifications}
              </span>
            )}
          </Link>

          <Link
            href={
              awaitingReviewJobs.length > 0
                ? "/supervisor/awaiting-review"
                : "/supervisor/jobs"
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#031c43] px-4 text-sm font-semibold text-white transition hover:bg-blue-950 whitespace-nowrap"
          >
            <span>
              {awaitingReviewJobs.length > 0
                ? `Review Queue (${awaitingReviewJobs.length})`
                : "View Supervised Jobs"}
            </span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Metrics */}
      <section aria-label="Supervision metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Urgent Inspection Queue */}
        <section
          aria-label="Jobs awaiting inspection"
          className="rounded-xl border border-slate-200 bg-white lg:col-span-7"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Action Required: Inspection Queue
              </h2>
              <p className="text-xs text-slate-500">
                Staff-submitted jobs and any bookings returned by administrators
              </p>
            </div>
            <Link
              href="/supervisor/awaiting-review"
              className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
            >
              Open queue
            </Link>
          </div>

          {awaitingReviewJobs.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheck size={28} className="mx-auto text-emerald-600" />
              <p className="mt-2 text-sm font-semibold text-slate-900">
                No reports awaiting inspection
              </p>
              <p className="mt-1 text-xs text-slate-500">
                When assigned field staff submit completion reports or an admin
                returns a job, it will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {awaitingReviewJobs.slice(0, 6).map((job) => {
                const sMeta = formatSupervisionStatus(job.supervisionStatus);
                return (
                  <div
                    key={job.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {job.bookingNumber}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${sMeta.tone}`}
                        >
                          {sMeta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {job.service.name} · {job.customer.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {job.assignments.length} assigned staff ·{" "}
                        {formatDate(job.preferredDate)} at {job.preferredTime}
                      </p>
                      {job.supervisionStatus === "RETURNED_BY_ADMIN" &&
                        job.finalApprovalNote && (
                          <p className="mt-1.5 rounded-md bg-rose-50 px-2.5 py-1 text-xs text-rose-900">
                            Admin note: {job.finalApprovalNote}
                          </p>
                        )}
                    </div>

                    <Link
                      href={`/supervisor/jobs/${job.id}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#031c43] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-950 whitespace-nowrap"
                    >
                      <span>Inspect</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Active Supervised Schedule */}
        <section
          aria-label="Active supervised jobs"
          className="rounded-xl border border-slate-200 bg-white lg:col-span-5"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Active Supervised Jobs
              </h2>
              <p className="text-xs text-slate-500">
                Upcoming and ongoing bookings assigned to you
              </p>
            </div>
            <Link
              href="/supervisor/jobs"
              className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap"
            >
              All jobs
            </Link>
          </div>

          {upcomingJobs.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase size={26} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-900">
                No active supervised jobs
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Bookings assigned to you as lead supervisor will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingJobs.map((job) => {
                const bMeta = formatBookingStatus(job.status);
                const submittedCount = job.assignments.filter(
                  (a) =>
                    a.status === "SUBMITTED_FOR_REVIEW" ||
                    a.status === "APPROVED"
                ).length;

                return (
                  <Link
                    key={job.id}
                    href={`/supervisor/jobs/${job.id}`}
                    className="block px-5 py-3.5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {job.bookingNumber}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${bMeta.tone}`}
                      >
                        {bMeta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {job.service.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <CalendarDays size={12} />
                        {formatDate(job.preferredDate)}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Users size={12} />
                        {submittedCount}/{job.assignments.length} submitted
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
