"use client";

import { useEffect, useState } from "react";
import { UserCheck, Users, X } from "lucide-react";
import { formatAssignmentStatus, getInitials } from "@/lib/workflow";

export type CoworkerSummary = {
  assignmentId: string;
  staffId: string;
  name: string;
  status: string;
};

type Props = {
  bookingNumber: string;
  coworkers: CoworkerSummary[];
  supervisor?: { id: string; name: string } | null;
};

export default function CoworkersBadgeButton({
  bookingNumber,
  coworkers,
  supervisor,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Strict requirement: hidden when 0 other workers are assigned
  if (coworkers.length === 0) {
    return null;
  }

  const label =
    coworkers.length === 1
      ? "1 other worker"
      : `${coworkers.length} other workers`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="coworkers-badge"
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600 whitespace-nowrap tabular-nums"
      >
        <Users size={13} className="shrink-0" />
        <span>{label}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Assigned team for ${bookingNumber}`}
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  Team Roster · {bookingNumber}
                </p>
                <h3 className="mt-0.5 text-base font-bold text-slate-900">
                  Assigned Workers ({coworkers.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close team roster"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {supervisor && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white">
                      {getInitials(supervisor.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {supervisor.name}
                      </p>
                      <p className="inline-flex items-center gap-1 text-xs font-medium text-indigo-800">
                        <UserCheck size={12} />
                        Lead Supervisor
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {coworkers.map((worker) => {
                const statusMeta = formatAssignmentStatus(worker.status);
                return (
                  <div
                    key={worker.assignmentId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                        {getInitials(worker.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {worker.name}
                        </p>
                        <p className="text-xs text-slate-500">Staff</p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.tone}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
