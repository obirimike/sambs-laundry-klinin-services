
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingStatus, SupervisionStatus } from "@prisma/client";
import { ArrowLeft, ArrowRight, ClipboardList, UserCheck, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatBookingStatus, formatSupervisionStatus } from "@/lib/workflow";

export const dynamic = "force-dynamic";

const ALLOWED_BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

const ALLOWED_SUPERVISION_STATUSES = [
  "NOT_REQUIRED",
  "ASSIGNED",
  "IN_PROGRESS",
  "AWAITING_SUPERVISOR_REVIEW",
  "CHANGES_REQUESTED",
  "SUPERVISOR_APPROVED",
  "RETURNED_BY_ADMIN",
] as const;

type BookingsPageProps = {
  searchParams: Promise<{ status?: string; supervision?: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminBookingsPage({
  searchParams,
}: BookingsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fbookings");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const { status, supervision } = await searchParams;
  const statusFilter = ALLOWED_BOOKING_STATUSES.includes(
    status as (typeof ALLOWED_BOOKING_STATUSES)[number]
  )
    ? (status as BookingStatus)
    : undefined;
  const supervisionFilter = ALLOWED_SUPERVISION_STATUSES.includes(
    supervision as (typeof ALLOWED_SUPERVISION_STATUSES)[number]
  )
    ? (supervision as SupervisionStatus)
    : undefined;

  const bookings = await db.booking.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(supervisionFilter ? { supervisionStatus: supervisionFilter } : {}),
    },
    include: {
      customer: {
        select: { name: true, email: true, phone: true },
      },
      service: {
        select: { name: true, category: true },
      },
      supervisor: {
        select: { name: true },
      },
      assignments: {
        where: { isActive: true },
        select: { id: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const filterChips = [
    { label: "All bookings", href: "/admin/bookings", active: !statusFilter && !supervisionFilter },
    { label: "Pending", href: "/admin/bookings?status=PENDING", active: statusFilter === "PENDING" },
    { label: "Confirmed", href: "/admin/bookings?status=CONFIRMED", active: statusFilter === "CONFIRMED" },
    { label: "In Progress", href: "/admin/bookings?status=IN_PROGRESS", active: statusFilter === "IN_PROGRESS" },
    {
      label: "Supervisor Review",
      href: "/admin/bookings?supervision=AWAITING_SUPERVISOR_REVIEW",
      active: supervisionFilter === "AWAITING_SUPERVISOR_REVIEW",
    },
    { label: "Completed", href: "/admin/bookings?status=COMPLETED", active: statusFilter === "COMPLETED" },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} /> Dashboard
      </Link>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Booking management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            All bookings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review customer requests, track team and supervisor progress, and open
            a booking to manage its lifecycle.
          </p>
        </div>

        <Link
          href="/admin/approvals"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Final Approval Queue <ArrowRight size={14} />
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {filterChips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              chip.active
                ? "border-[#031c43] bg-[#031c43] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {chip.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <ClipboardList size={32} className="mx-auto text-slate-400" />
          <h2 className="mt-3 font-bold text-slate-900">
            No bookings match this view
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Customer requests matching this filter will appear here once submitted.
          </p>
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 text-xs font-medium text-slate-600">
            <span>
              Showing <span className="tabular-nums font-semibold text-slate-900">{bookings.length}</span>{" "}
              booking{bookings.length === 1 ? "" : "s"}.
            </span>
            {(statusFilter || supervisionFilter) && (
              <Link
                href="/admin/bookings"
                className="font-semibold text-blue-700 hover:underline"
              >
                Clear filter
              </Link>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {(
              bookings as Array<{
                id: string;
                bookingNumber: string;
                status: string;
                supervisionStatus: string;
                preferredDate: Date;
                preferredTime: string;
                createdAt: Date;
                customer: { name: string; email: string };
                service: { name: string; category: string };
                supervisor: { name: string } | null;
                assignments: Array<{ id: string }>;
              }>
            ).map((booking) => {
              const bMeta = formatBookingStatus(booking.status);
              const sMeta = formatSupervisionStatus(booking.supervisionStatus);

              return (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-all font-mono font-bold text-slate-900">
                        {booking.bookingNumber}
                      </p>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${bMeta.tone}`}
                      >
                        {bMeta.label}
                      </span>
                      {booking.supervisionStatus !== "NOT_REQUIRED" && (
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${sMeta.tone}`}
                        >
                          {sMeta.label}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-sm font-medium text-slate-800">
                      {booking.service.name} ·{" "}
                      {booking.service.category === "LAUNDRY"
                        ? "Laundry"
                        : booking.service.category === "DOMESTIC_SUPPORT"
                          ? "Domestic Support"
                          : booking.service.category === "PEST_CONTROL"
                            ? "Pest Control"
                            : "Cleaning"}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {booking.customer.name} · {booking.customer.email}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Submitted {formatDate(booking.createdAt)}</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Users size={13} />
                        {booking.assignments.length} staff
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserCheck size={13} />
                        {booking.supervisor?.name
                          ? `Supervisor: ${booking.supervisor.name}`
                          : "No supervisor"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 tabular-nums">
                      {formatDate(booking.preferredDate)} · {booking.preferredTime}
                    </span>
                    <ArrowRight size={17} className="text-slate-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
