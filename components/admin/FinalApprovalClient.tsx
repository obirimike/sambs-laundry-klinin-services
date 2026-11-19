"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";
import { formatAssignmentStatus, formatSupervisionStatus } from "@/lib/workflow";

export type ApprovalBookingRecord = {
  id: string;
  bookingNumber: string;
  status: string;
  supervisionStatus: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  finalApprovedAt: string | null;
  finalApprovalNote: string | null;
  customer: { name: string; email: string; phone: string | null };
  service: { name: string; category: string };
  supervisor: { id: string; name: string; email: string } | null;
  finalApprovedBy: { name: string } | null;
  assignments: Array<{
    id: string;
    status: string;
    staff: { id: string; name: string; email: string };
    submittedAt: string | null;
    approvedAt: string | null;
    submissions: Array<{
      id: string;
      summary: string;
      workPerformed: string;
      issuesNoted: string | null;
      photos: Array<{
        storagePath: string;
        fileName: string;
      }>;
      createdAt: string;
    }>;
  }>;
  workflowReviews: Array<{
    id: string;
    reviewerRole: string;
    decision: string;
    comment: string | null;
    createdAt: string;
    reviewer: { name: string };
  }>;
};

type Props = {
  awaitingBookings: ApprovalBookingRecord[];
  returnedBookings: ApprovalBookingRecord[];
  completedBookings: ApprovalBookingRecord[];
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

export default function FinalApprovalClient({
  awaitingBookings,
  returnedBookings,
  completedBookings,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"awaiting" | "returned" | "completed">(
    "awaiting"
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const [approveTarget, setApproveTarget] =
    useState<ApprovalBookingRecord | null>(null);
  const [returnTarget, setReturnTarget] =
    useState<ApprovalBookingRecord | null>(null);
  const [returnReason, setReturnReason] = useState("");

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

  const activeList =
    tab === "awaiting"
      ? awaitingBookings
      : tab === "returned"
        ? returnedBookings
        : completedBookings;

  async function submitDecision(
    booking: ApprovalBookingRecord,
    decision: "APPROVE" | "RETURN",
    noteText: string
  ) {
    setBusyId(booking.id);
    try {
      const response = await fetch(
        `/api/admin/bookings/${booking.id}/final-approval`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            note: noteText.trim() || undefined,
          }),
        }
      );

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title:
            decision === "APPROVE"
              ? "Final Approval Failed"
              : "Return Failed",
          message: result.message || "Unable to complete your request.",
        });
        return;
      }

      setApproveTarget(null);
      setReturnTarget(null);
      setReturnReason("");
      setFeedback({
        isOpen: true,
        variant: "success",
        title:
          decision === "APPROVE"
            ? "Completion Approved"
            : "Returned to Supervisor",
        message:
          result.message ||
          (decision === "APPROVE"
            ? "Booking completed and customer notified."
            : "Booking returned to supervisor for further action."),
        referenceNumber: booking.bookingNumber,
      });

      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "Unable to reach the server. Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-blue-700">
            Admin Final Sign-Off
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Final Approval Queue
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Inspect completed staff reports and supervisor approvals before
            releasing completion notices to customers.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab("awaiting")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              tab === "awaiting"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Awaiting Approval ({awaitingBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("returned")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              tab === "returned"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Returned ({returnedBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("completed")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              tab === "completed"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Finalized ({completedBookings.length})
          </button>
        </div>
      </header>

      {activeList.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <ClipboardCheck size={30} className="mx-auto text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-900">
            {tab === "awaiting"
              ? "No bookings awaiting final approval"
              : tab === "returned"
                ? "No bookings currently returned to supervisors"
                : "No finalized supervised bookings yet"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {tab === "awaiting"
              ? "Bookings approved by a supervisor will appear here for final release."
              : "Check the other tabs or review active bookings."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {activeList.map((booking) => {
            const supMeta = formatSupervisionStatus(booking.supervisionStatus);

            return (
              <section
                key={booking.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-base font-bold text-slate-900">
                        {booking.bookingNumber}
                      </h2>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${supMeta.tone}`}
                      >
                        {supMeta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {booking.service.name} · {booking.customer.name} ·{" "}
                      {formatDate(booking.preferredDate)} at{" "}
                      {booking.preferredTime}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {booking.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      <span>Booking Details</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  {/* Lead Supervisor Summary */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2.5">
                      <UserCheck size={17} className="text-blue-700" />
                      <span className="font-medium text-slate-700">
                        Lead Supervisor:
                      </span>
                      <span className="font-semibold text-slate-900">
                        {booking.supervisor?.name || "Unassigned"}
                      </span>
                    </div>
                    {booking.finalApprovedBy && booking.finalApprovedAt && (
                      <span className="text-xs text-emerald-800">
                        Finalized by {booking.finalApprovedBy.name} on{" "}
                        {formatDateTime(booking.finalApprovedAt)}
                      </span>
                    )}
                  </div>

                  {/* Assigned Workers & Completion Reports */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Staff Completion Reports ({booking.assignments.length})
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      {booking.assignments.map((assignment) => {
                        const aMeta = formatAssignmentStatus(assignment.status);
                        const latestReport = assignment.submissions[0];

                        return (
                          <div
                            key={assignment.id}
                            className="rounded-lg border border-slate-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {assignment.staff.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {assignment.staff.email}
                                </p>
                              </div>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${aMeta.tone}`}
                              >
                                {aMeta.label}
                              </span>
                            </div>

                            {latestReport ? (
                              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
                                <p className="font-semibold text-slate-800">
                                  {latestReport.summary}
                                </p>
                                <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
                                  {latestReport.workPerformed}
                                </p>
                                {latestReport.issuesNoted && (
                                  <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-amber-900">
                                    <strong>Issues noted:</strong>{" "}
                                    {latestReport.issuesNoted}
                                  </p>
                                )}
                                {Array.isArray(latestReport.photos) &&
                                  latestReport.photos.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {latestReport.photos.map((photo) => (
                                        <a
                                          key={photo.storagePath}
                                          href={`/api/evidence?bookingId=${encodeURIComponent(booking.id)}&path=${encodeURIComponent(photo.storagePath)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-slate-100"
                                        >
                                          {photo.fileName}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                <p className="text-[11px] text-slate-400">
                                  Submitted{" "}
                                  {formatDateTime(latestReport.createdAt)}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-3 text-xs text-slate-500">
                                No report submitted yet.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review History */}
                  {booking.workflowReviews.length > 0 && (
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Review History
                      </h3>
                      <div className="space-y-2">
                        {booking.workflowReviews.map((review) => (
                          <div
                            key={review.id}
                            className="flex flex-col gap-1 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <span className="font-semibold text-slate-900">
                                {review.reviewer.name} ({review.reviewerRole})
                              </span>{" "}
                              <span className="text-slate-600">
                                — {review.decision.replaceAll("_", " ")}
                              </span>
                              {review.comment && (
                                <p className="mt-1 text-slate-700">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                              {formatDateTime(review.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Action Controls */}
                  {tab === "awaiting" && (
                    <div className="space-y-3 border-t border-slate-200 pt-4">
                      <div>
                        <label
                          htmlFor={`approval-note-${booking.id}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Administrator final approval note (optional)
                        </label>
                        <textarea
                          id={`approval-note-${booking.id}`}
                          rows={2}
                          maxLength={2000}
                          value={notes[booking.id] ?? ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [booking.id]: e.target.value,
                            }))
                          }
                          placeholder="Add an internal sign-off note before completing this booking..."
                          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => {
                            setReturnTarget(booking);
                            setReturnReason("");
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          <RotateCcw size={15} />
                          <span>Return to Supervisor</span>
                        </button>

                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => setApproveTarget(booking)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          <span>Approve Completion &amp; Notify Customer</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Confirm Final Approval */}
      {approveTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setApproveTarget(null)}
          onConfirm={() =>
            submitDecision(
              approveTarget,
              "APPROVE",
              notes[approveTarget.id] ?? ""
            )
          }
          title="Approve final completion?"
          description={`Mark booking ${approveTarget.bookingNumber} as COMPLETED? This will record your final approval and send the completion email and in-app alert to ${approveTarget.customer.name}.`}
          recordName={approveTarget.bookingNumber}
          confirmText="Approve & Complete"
          isLoading={busyId === approveTarget.id}
        />
      )}

      {/* Return to Supervisor Modal */}
      {returnTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setReturnTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Return {returnTarget.bookingNumber} to Supervisor
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Provide a clear explanation for{" "}
              {returnTarget.supervisor?.name || "the supervisor"}. The customer
              will not be notified.
            </p>

            <textarea
              rows={4}
              maxLength={2000}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Explain what needs re-inspection or additional action..."
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  busyId === returnTarget.id || returnReason.trim().length < 5
                }
                onClick={() =>
                  submitDecision(returnTarget, "RETURN", returnReason)
                }
                className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
              >
                {busyId === returnTarget.id
                  ? "Returning..."
                  : "Return for Further Action"}
              </button>
            </div>
          </div>
        </div>
      )}

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
