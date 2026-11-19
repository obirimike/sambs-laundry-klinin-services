"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Search,
  Users,
} from "lucide-react";
import type { SupervisedBookingDTO } from "@/lib/supervisor-data";
import {
  formatAssignmentStatus,
  formatBookingStatus,
  formatSupervisionStatus,
} from "@/lib/workflow";

type Props = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  bookings: SupervisedBookingDTO[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SupervisorJobsView({
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  bookings,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.bookingNumber.toLowerCase().includes(q) ||
        b.customer.name.toLowerCase().includes(q) ||
        b.service.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.assignments.some((a) => a.staff.name.toLowerCase().includes(q))
    );
  }, [bookings, search]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Supervisor Inspection Queue
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking, customer, staff..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <ClipboardCheck size={30} className="mx-auto text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-900">
            {emptyTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
        </section>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const bMeta = formatBookingStatus(booking.status);
            const sMeta = formatSupervisionStatus(booking.supervisionStatus);
            const submittedCount = booking.assignments.filter(
              (a) =>
                a.status === "SUBMITTED_FOR_REVIEW" || a.status === "APPROVED"
            ).length;

            return (
              <section
                key={booking.id}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-base font-bold text-slate-900">
                        {booking.bookingNumber}
                      </h2>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${sMeta.tone}`}
                      >
                        {sMeta.label}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${bMeta.tone}`}
                      >
                        {bMeta.label}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm font-medium text-slate-800">
                      {booking.service.name} · {booking.customer.name}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <CalendarDays size={13} />
                        {formatDate(booking.preferredDate)} at{" "}
                        {booking.preferredTime}
                      </span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Users size={13} />
                        {submittedCount}/{booking.assignments.length} staff
                        submitted
                      </span>
                      <span className="truncate">{booking.address}</span>
                    </div>

                    {booking.supervisionStatus === "RETURNED_BY_ADMIN" &&
                      booking.finalApprovalNote && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                          <AlertTriangle
                            size={14}
                            className="mt-0.5 shrink-0 text-rose-700"
                          />
                          <span>
                            <strong>Returned by Admin:</strong>{" "}
                            {booking.finalApprovalNote}
                          </span>
                        </div>
                      )}

                    {booking.assignments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {booking.assignments.map((a) => {
                          const aMeta = formatAssignmentStatus(a.status);
                          return (
                            <span
                              key={a.id}
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium ${aMeta.tone}`}
                            >
                              <span>{a.staff.name}</span>
                              <span>·</span>
                              <span>{aMeta.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/supervisor/jobs/${booking.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#031c43] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-950 whitespace-nowrap"
                  >
                    <span>Inspect &amp; Review</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
