"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, UserCheck, Users } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";
import {
  formatAssignmentStatus,
  formatBookingStatus,
  formatSupervisionStatus,
} from "@/lib/workflow";

type PersonOption = {
  id: string;
  name: string;
  email: string;
};

type Assignment = {
  id: string;
  staffId: string;
  staff: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  status: string;
  notes: string | null;
  isActive: boolean;
  assignedAt: string;
  unassignedAt: string | null;
  assignedByName: string;
  unassignedByName: string | null;
};

type BookingRecord = {
  id: string;
  bookingNumber: string;
  status: string;
  supervisionStatus: string;
  supervisorId: string | null;
  supervisor: PersonOption | null;
  preferredDate: string;
  preferredTime: string;
  address: string;
  specialInstructions: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  service: {
    name: string;
    category: string;
  };
  assignments: Assignment[];
};

type Props = {
  initialBookings: BookingRecord[];
  staff: PersonOption[];
  supervisors: PersonOption[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });
}

export default function AssignmentManagement({
  initialBookings,
  staff,
  supervisors,
}: Props) {
  const router = useRouter();

  // Multi-staff selection per booking
  const [selectedStaffMap, setSelectedStaffMap] = useState<
    Record<string, string[]>
  >({});
  const [selectedSupervisorMap, setSelectedSupervisorMap] = useState<
    Record<string, string>
  >({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Replacement modal state
  const [replaceTarget, setReplaceTarget] = useState<{
    booking: BookingRecord;
    assignment: Assignment;
  } | null>(null);
  const [replacementStaffId, setReplacementStaffId] = useState("");

  // Unassign confirm modal
  const [unassignTarget, setUnassignTarget] = useState<{
    booking: BookingRecord;
    assignment: Assignment;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
    referenceNumber?: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  function toggleStaffCheckbox(bookingId: string, staffId: string) {
    setSelectedStaffMap((prev) => {
      const current = prev[bookingId] ?? [];
      const exists = current.includes(staffId);
      return {
        ...prev,
        [bookingId]: exists
          ? current.filter((id) => id !== staffId)
          : [...current, staffId],
      };
    });
  }

  async function assignTeam(
    event: FormEvent<HTMLFormElement>,
    booking: BookingRecord
  ) {
    event.preventDefault();
    setError("");

    const chosenStaffIds = selectedStaffMap[booking.id] ?? [];
    if (chosenStaffIds.length === 0) {
      setError("Select at least one available staff member to assign.");
      return;
    }

    const assignmentNotes = (notes[booking.id] ?? "").trim();
    if (assignmentNotes.length > 2000) {
      setError("Assignment notes must be 2,000 characters or fewer.");
      return;
    }

    const supervisorId =
      selectedSupervisorMap[booking.id] !== undefined
        ? selectedSupervisorMap[booking.id] || null
        : booking.supervisorId;

    setBusyKey(`assign-${booking.id}`);

    try {
      const response = await fetch(
        `/api/admin/bookings/${booking.id}/assignments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffIds: chosenStaffIds,
            ...(supervisorId ? { supervisorId } : {}),
            ...(assignmentNotes ? { notes: assignmentNotes } : {}),
          }),
        }
      );

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Assignment Failed",
          message: result.message || "Unable to assign selected staff.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Team Assigned Successfully",
        message:
          result.message ||
          `Assigned ${chosenStaffIds.length} staff member(s) to ${booking.bookingNumber}.`,
        referenceNumber: booking.bookingNumber,
      });

      setSelectedStaffMap((prev) => ({ ...prev, [booking.id]: [] }));
      setNotes((prev) => ({ ...prev, [booking.id]: "" }));
      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function updateSupervisor(booking: BookingRecord) {
    const nextSupervisorId =
      selectedSupervisorMap[booking.id] !== undefined
        ? selectedSupervisorMap[booking.id] || null
        : booking.supervisorId;

    setBusyKey(`sup-${booking.id}`);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/bookings/${booking.id}/supervisor`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supervisorId: nextSupervisorId,
          }),
        }
      );

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Supervisor Update Failed",
          message: result.message || "Unable to update lead supervisor.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Lead Supervisor Updated",
        message:
          result.message ||
          `Updated lead supervisor for ${booking.bookingNumber}.`,
        referenceNumber: booking.bookingNumber,
      });
      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function executeReplace() {
    if (!replaceTarget || !replacementStaffId) return;
    const { booking, assignment } = replaceTarget;
    setBusyKey(`replace-${assignment.id}`);

    try {
      const response = await fetch(
        `/api/admin/bookings/${booking.id}/assignments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: replacementStaffId,
            replaceAssignmentId: assignment.id,
          }),
        }
      );

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Replacement Failed",
          message: result.message || "Unable to replace staff member.",
        });
        return;
      }

      setReplaceTarget(null);
      setReplacementStaffId("");
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Member Replaced",
        message:
          result.message ||
          `Updated assigned staff for booking ${booking.bookingNumber}.`,
        referenceNumber: booking.bookingNumber,
      });
      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function executeUnassign() {
    if (!unassignTarget) return;
    const { booking, assignment } = unassignTarget;
    setUnassignTarget(null);
    setBusyKey(assignment.id);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/bookings/${booking.id}/assignments/${assignment.id}`,
        { method: "DELETE" }
      );

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Unassign Failed",
          message: result.message || "Unable to unassign staff.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Staff Unassigned",
        message:
          result.message ||
          `${assignment.staff.name} has been unassigned from ${booking.bookingNumber}.`,
        referenceNumber: booking.bookingNumber,
      });

      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Team Dispatch &amp; Supervision
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Staff &amp; Supervisor Assignments
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
            Assign one or multiple field staff members and a lead supervisor to
            confirmed work, track individual progress, and swap workers as needed.
          </p>
        </div>

        <Link
          href="/admin/staff"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Manage Staff &amp; Supervisors
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </div>
      )}

      {(staff.length === 0 || supervisors.length === 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {staff.length === 0 && supervisors.length === 0
            ? "No active staff or supervisor accounts exist yet. Create them on the Staff & Supervisors page."
            : staff.length === 0
              ? "No active field staff accounts exist yet. Create staff accounts on the Staff & Supervisors page."
              : "No active supervisor accounts exist yet. Create a supervisor on the Staff & Supervisors page so supervised jobs can be reviewed."}
        </div>
      )}

      {initialBookings.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">
            No eligible bookings
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Only confirmed or in-progress bookings are available for assignment.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {initialBookings.map((booking) => {
            const activeAssignments = booking.assignments.filter(
              (assignment) => assignment.isActive
            );
            const activeStaffIds = new Set(
              activeAssignments.map((a) => a.staffId)
            );
            const history = booking.assignments.filter(
              (assignment) => !assignment.isActive
            );
            const chosenStaffIds = selectedStaffMap[booking.id] ?? [];
            const currentSupervisorValue =
              selectedSupervisorMap[booking.id] !== undefined
                ? selectedSupervisorMap[booking.id]
                : (booking.supervisorId ?? "");
            const supervisorChanged =
              currentSupervisorValue !== (booking.supervisorId ?? "");

            const bMeta = formatBookingStatus(booking.status);
            const sMeta = formatSupervisionStatus(booking.supervisionStatus);

            return (
              <section
                key={booking.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-lg font-bold text-slate-900">
                        {booking.bookingNumber}
                      </h2>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${bMeta.tone}`}
                      >
                        {bMeta.label}
                      </span>
                      {booking.supervisionStatus !== "NOT_REQUIRED" && (
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${sMeta.tone}`}
                        >
                          {sMeta.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-700">
                      {booking.service.name} ·{" "}
                      {booking.service.category.replaceAll("_", " ")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                      {formatDate(booking.preferredDate)} at{" "}
                      {booking.preferredTime}
                    </p>
                  </div>

                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="inline-flex w-fit items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open booking detail
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-12">
                  {/* Left: Customer + Supervisor Assignment */}
                  <div className="min-w-0 space-y-5 lg:col-span-5">
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Customer &amp; Site
                      </h3>
                      <p className="text-sm font-semibold text-slate-900">
                        {booking.customer.name}
                      </p>
                      <p className="break-all text-xs text-slate-500">
                        {booking.customer.email}
                        {booking.customer.phone
                          ? ` · ${booking.customer.phone}`
                          : ""}
                      </p>
                      <p className="pt-1 text-sm text-slate-700">
                        <span className="font-medium">Address:</span>{" "}
                        {booking.address}
                      </p>
                      {booking.specialInstructions && (
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Instructions:</span>{" "}
                          {booking.specialInstructions}
                        </p>
                      )}
                    </div>

                    {/* Lead Supervisor Selector */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck size={16} className="text-indigo-700" />
                        <h3 className="text-sm font-semibold text-slate-900">
                          Lead Supervisor
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Inspects staff completion reports before admin final
                        sign-off.
                      </p>

                      <div className="mt-3 space-y-2">
                        <select
                          value={currentSupervisorValue}
                          onChange={(e) =>
                            setSelectedSupervisorMap((prev) => ({
                              ...prev,
                              [booking.id]: e.target.value,
                            }))
                          }
                          disabled={busyKey !== null}
                          aria-label={`Lead supervisor for ${booking.bookingNumber}`}
                          className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Unassigned (no supervisor)</option>
                          {supervisors.map((sup) => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name} ({sup.email})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={busyKey !== null || !supervisorChanged}
                          onClick={() => updateSupervisor(booking)}
                          className="w-full rounded-lg bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyKey === `sup-${booking.id}`
                            ? "Saving..."
                            : booking.supervisorId
                              ? "Update Supervisor"
                              : "Assign Supervisor"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Multi-staff Assignment Form */}
                  <div className="min-w-0 lg:col-span-7">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Users size={16} className="text-blue-700" />
                        Assign Field Staff (Multi-select)
                      </h3>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {chosenStaffIds.length} selected
                      </span>
                    </div>

                    <form
                      onSubmit={(event) => assignTeam(event, booking)}
                      className="mt-3 space-y-3"
                    >
                      {staff.length === 0 ? (
                        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                          No active staff accounts available.
                        </p>
                      ) : (
                        <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-2.5 sm:grid-cols-2">
                          {staff.map((member) => {
                            const alreadyActive = activeStaffIds.has(member.id);
                            const checked = chosenStaffIds.includes(member.id);

                            return (
                              <label
                                key={member.id}
                                className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition ${
                                  alreadyActive
                                    ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                                    : checked
                                      ? "cursor-pointer border-blue-400 bg-blue-50/70"
                                      : "cursor-pointer border-slate-200 bg-white hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={alreadyActive || busyKey !== null}
                                  checked={alreadyActive || checked}
                                  onChange={() =>
                                    toggleStaffCheckbox(booking.id, member.id)
                                  }
                                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                                />
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold text-slate-900">
                                    {member.name}
                                  </span>
                                  <span className="block truncate text-[11px] text-slate-500">
                                    {alreadyActive
                                      ? "Already assigned"
                                      : member.email}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      <textarea
                        rows={2}
                        maxLength={2000}
                        value={notes[booking.id] ?? ""}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [booking.id]: event.target.value,
                          }))
                        }
                        placeholder="Team instructions / assignment notes (optional)"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="submit"
                        disabled={
                          staff.length === 0 ||
                          chosenStaffIds.length === 0 ||
                          busyKey !== null
                        }
                        className="w-full rounded-lg bg-[#031c43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyKey === `assign-${booking.id}`
                          ? "Assigning selected staff..."
                          : `Assign Selected Staff (${chosenStaffIds.length})`}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Active Assigned Workers */}
                <div className="border-t border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Active assigned staff
                    </h3>
                    <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 tabular-nums">
                      {activeAssignments.length} active
                    </span>
                  </div>

                  {activeAssignments.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No staff currently assigned.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {activeAssignments.map((assignment) => {
                        const aMeta = formatAssignmentStatus(assignment.status);
                        const replaceableChoices = staff.filter(
                          (m) => !activeStaffIds.has(m.id)
                        );

                        return (
                          <div
                            key={assignment.id}
                            className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-start"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-900">
                                  {assignment.staff.name}
                                </p>
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${aMeta.tone}`}
                                >
                                  {aMeta.label}
                                </span>
                              </div>
                              <p className="mt-1 break-all text-xs text-slate-500">
                                {assignment.staff.email}
                              </p>
                              {assignment.notes && (
                                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
                                  {assignment.notes}
                                </p>
                              )}
                              <p className="mt-2 text-[11px] text-slate-400">
                                Assigned {formatDateTime(assignment.assignedAt)}
                                {" · "}By {assignment.assignedByName}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {replaceableChoices.length > 0 && (
                                <button
                                  type="button"
                                  disabled={busyKey !== null}
                                  onClick={() => {
                                    setReplaceTarget({ booking, assignment });
                                    setReplacementStaffId(
                                      replaceableChoices[0].id
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  <RefreshCw size={12} />
                                  Replace
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={busyKey !== null}
                                onClick={() =>
                                  setUnassignTarget({ booking, assignment })
                                }
                                className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              >
                                {busyKey === assignment.id
                                  ? "Removing..."
                                  : "Unassign"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {history.length > 0 && (
                  <details className="border-t border-slate-200 p-5">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                      Assignment history ({history.length})
                    </summary>

                    <div className="mt-3 space-y-2.5">
                      {history.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="rounded-lg bg-slate-50 p-3.5 text-xs"
                        >
                          <p className="font-semibold text-slate-800">
                            {assignment.staff.name}
                          </p>
                          <p className="mt-1 text-slate-500">
                            Assigned {formatDateTime(assignment.assignedAt)}
                            {" · "}By {assignment.assignedByName}
                          </p>
                          <p className="mt-0.5 text-slate-500">
                            Unassigned{" "}
                            {assignment.unassignedAt
                              ? formatDateTime(assignment.unassignedAt)
                              : "—"}
                            {assignment.unassignedByName
                              ? ` · By ${assignment.unassignedByName}`
                              : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Replace Worker Modal */}
      {replaceTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setReplaceTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Replace {replaceTarget.assignment.staff.name}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Choose an available staff member to take over this assignment on{" "}
              <span className="font-semibold">
                {replaceTarget.booking.bookingNumber}
              </span>
              .
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700">
                Replacement staff member
              </label>
              <select
                value={replacementStaffId}
                onChange={(e) => setReplacementStaffId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {staff
                  .filter(
                    (m) =>
                      !replaceTarget.booking.assignments
                        .filter((a) => a.isActive)
                        .some((a) => a.staffId === m.id)
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplaceTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!replacementStaffId || busyKey !== null}
                onClick={executeReplace}
                className="rounded-lg bg-[#031c43] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
              >
                {busyKey?.startsWith("replace-")
                  ? "Replacing..."
                  : "Confirm Replacement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Unassign */}
      {unassignTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setUnassignTarget(null)}
          onConfirm={executeUnassign}
          title="Unassign staff member?"
          description={`Unassign ${unassignTarget.assignment.staff.name} from booking ${unassignTarget.booking.bookingNumber}?`}
          consequences="The staff member will be notified that this booking has been unassigned from their dashboard."
          recordName={unassignTarget.booking.bookingNumber}
          confirmText="Unassign Staff"
          isDestructive={true}
          isLoading={busyKey === unassignTarget.assignment.id}
        />
      )}

      {/* Reusable Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        referenceNumber={feedback.referenceNumber}
        referenceLabel="Booking Reference"
      />
    </div>
  );
}
