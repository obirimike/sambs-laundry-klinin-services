"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  RotateCcw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";
import type { SupervisedBookingDTO } from "@/lib/supervisor-data";
import {
  formatAssignmentStatus,
  formatBookingStatus,
  formatSupervisionStatus,
} from "@/lib/workflow";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

export default function SupervisorJobReviewClient({
  booking,
}: {
  booking: SupervisedBookingDTO;
}) {
  const router = useRouter();
  const [approvalComment, setApprovalComment] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);

  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesComment, setChangesComment] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<string[]>(() =>
    booking.assignments
      .filter((a) =>
        ["SUBMITTED_FOR_REVIEW", "APPROVED", "IN_PROGRESS"].includes(a.status)
      )
      .map((a) => a.id)
  );

  const [busy, setBusy] = useState(false);
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

  const bMeta = formatBookingStatus(booking.status);
  const sMeta = formatSupervisionStatus(booking.supervisionStatus);

  const isClosed =
    booking.status === "COMPLETED" || booking.status === "CANCELLED";
  const pendingStaff = booking.assignments.filter(
    (a) => a.status !== "SUBMITTED_FOR_REVIEW" && a.status !== "APPROVED"
  );
  const canApprove =
    !isClosed &&
    booking.assignments.length > 0 &&
    pendingStaff.length === 0 &&
    booking.supervisionStatus !== "SUPERVISOR_APPROVED";

  const returnableAssignments = booking.assignments.filter((a) =>
    ["SUBMITTED_FOR_REVIEW", "APPROVED", "IN_PROGRESS"].includes(a.status)
  );

  function toggleTarget(id: string) {
    setSelectedTargets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function submitDecision(decision: "APPROVE" | "REQUEST_CHANGES") {
    setBusy(true);
    try {
      const response = await fetch(
        `/api/supervisor/bookings/${booking.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            decision === "APPROVE"
              ? {
                  decision: "APPROVE",
                  comment: approvalComment.trim() || undefined,
                }
              : {
                  decision: "REQUEST_CHANGES",
                  comment: changesComment.trim(),
                  targetAssignmentIds:
                    selectedTargets.length > 0 ? selectedTargets : undefined,
                }
          ),
        }
      );

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setShowApproveModal(false);
        setShowChangesModal(false);
        setFeedback({
          isOpen: true,
          variant: "error",
          title:
            decision === "APPROVE"
              ? "Approval Blocked"
              : "Correction Request Failed",
          message: data.message || "Unable to complete supervisor review.",
        });
        return;
      }

      setShowApproveModal(false);
      setShowChangesModal(false);
      setChangesComment("");
      setApprovalComment("");

      setFeedback({
        isOpen: true,
        variant: "success",
        title:
          decision === "APPROVE"
            ? "Approved for Admin Final Sign-Off"
            : "Corrections Requested",
        message:
          data.message ||
          (decision === "APPROVE"
            ? "Booking approved and escalated to administrators."
            : "Affected staff have been notified to submit corrections."),
        referenceNumber: booking.bookingNumber,
      });

      router.refresh();
    } catch {
      setShowApproveModal(false);
      setShowChangesModal(false);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "Failed to reach the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/supervisor/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} /> Back to Supervised Jobs
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${sMeta.tone}`}
          >
            {sMeta.label}
          </span>
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${bMeta.tone}`}
          >
            {bMeta.label}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
          Job Supervision &amp; Inspection
        </p>
        <h1 className="mt-1 font-mono text-2xl font-bold text-slate-900 sm:text-3xl">
          {booking.bookingNumber}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-700">
          {booking.service.name} ·{" "}
          {booking.service.category.replaceAll("_", " ")}
        </p>

        {booking.supervisionStatus === "RETURNED_BY_ADMIN" &&
          booking.finalApprovalNote && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
              <p className="flex items-center gap-2 font-semibold text-rose-900">
                <AlertTriangle size={16} />
                Returned by Administrator for Further Action
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed">
                {booking.finalApprovalNote}
              </p>
            </div>
          )}

        {booking.supervisionStatus === "SUPERVISOR_APPROVED" &&
          !isClosed && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-900">
              <ShieldCheck size={17} className="shrink-0 text-emerald-700" />
              <span>
                You approved this job. It is now in the Administrator Final
                Approval queue for customer release.
              </span>
            </div>
          )}

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-2.5">
            <UserRound size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-500">Customer</p>
              <p className="font-medium text-slate-900">
                {booking.customer.name}
              </p>
              {booking.customer.phone && (
                <p className="text-xs text-slate-500">
                  {booking.customer.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CalendarDays
              size={16}
              className="mt-0.5 shrink-0 text-slate-400"
            />
            <div>
              <p className="text-xs font-semibold text-slate-500">Schedule</p>
              <p className="font-medium text-slate-900">
                {formatDate(booking.preferredDate)}
              </p>
              <p className="text-xs text-slate-500">{booking.preferredTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Service Location
              </p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                {booking.address}
              </p>
            </div>
          </div>
        </div>

        {booking.specialInstructions && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3.5 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">
              Customer special instructions
            </p>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">
              {booking.specialInstructions}
            </p>
          </div>
        )}
      </header>

      {/* Assigned Staff & Reports */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Users size={19} className="text-indigo-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Assigned Staff &amp; Completion Reports (
              {booking.assignments.length})
            </h2>
          </div>
          {pendingStaff.length > 0 && !isClosed && (
            <span className="text-xs font-medium text-amber-800">
              Waiting on reports from:{" "}
              {pendingStaff.map((p) => p.staff.name).join(", ")}
            </span>
          )}
        </div>

        {booking.assignments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No field staff are currently assigned to this booking.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {booking.assignments.map((assignment) => {
              const aMeta = formatAssignmentStatus(assignment.status);
              const latest = assignment.submissions[0];

              return (
                <div
                  key={assignment.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {assignment.staff.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {assignment.staff.email}
                        {assignment.staff.phone
                          ? ` · ${assignment.staff.phone}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${aMeta.tone}`}
                    >
                      {aMeta.label}
                    </span>
                  </div>

                  {assignment.notes && (
                    <p className="mt-2 rounded-md bg-blue-50/70 px-3 py-2 text-xs text-blue-900">
                      <strong>Admin notes:</strong> {assignment.notes}
                    </p>
                  )}

                  {latest ? (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {latest.summary}
                        </p>
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {formatDateTime(latest.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                        {latest.workPerformed}
                      </p>
                      {latest.issuesNoted && (
                        <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                          <strong>Issues noted:</strong> {latest.issuesNoted}
                        </p>
                      )}
                      {latest.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {latest.photos.map((photo) => (
                            <a
                              key={photo.storagePath}
                              href={`/api/evidence?bookingId=${encodeURIComponent(booking.id)}&path=${encodeURIComponent(photo.storagePath)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 hover:bg-slate-100"
                            >
                              {photo.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">
                      No completion report submitted yet.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Supervisor Decision Actions */}
      {!isClosed && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Supervisor Inspection Decision
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Approve work to escalate for final administrator release, or request
            corrections from field staff. Only administrators can mark a booking
            completed for the customer.
          </p>

          <div className="mt-4">
            <label
              htmlFor="supervisor-note"
              className="block text-xs font-semibold text-slate-700"
            >
              Inspection note for Administrator (optional on approval)
            </label>
            <textarea
              id="supervisor-note"
              rows={2}
              maxLength={2000}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="Summarize inspection quality or observations..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {pendingStaff.length > 0
                ? "Approval unlocks once all active staff submit completion reports."
                : booking.supervisionStatus === "SUPERVISOR_APPROVED"
                  ? "Already approved and waiting on Administrator final sign-off."
                  : "All assigned staff have submitted. Ready for your review."}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy || returnableAssignments.length === 0}
                onClick={() => setShowChangesModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} />
                <span>Request Corrections</span>
              </button>

              <button
                type="button"
                disabled={busy || !canApprove}
                onClick={() => setShowApproveModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>Approve for Admin Sign-off</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Review Timeline */}
      {booking.workflowReviews.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">
            Review &amp; Inspection History
          </h2>
          <div className="mt-3 space-y-2.5">
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
                    <p className="mt-1 text-slate-700">{review.comment}</p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                  {formatDateTime(review.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirm Approve */}
      {showApproveModal && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setShowApproveModal(false)}
          onConfirm={() => submitDecision("APPROVE")}
          title="Approve work for Administrator Final Sign-Off?"
          description={`Confirm that all work for ${booking.bookingNumber} meets SAMB's quality standards. Administrators will be notified to issue final approval and notify the customer.`}
          recordName={booking.bookingNumber}
          confirmText="Approve & Escalate"
          isLoading={busy}
        />
      )}

      {/* Request Corrections Modal */}
      {showChangesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setShowChangesModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Request Staff Corrections
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Select affected staff members and explain what must be corrected
              before re-submission.
            </p>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Staff needing corrections
              </p>
              {returnableAssignments.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedTargets.includes(a.id)}
                    onChange={() => toggleTarget(a.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700"
                  />
                  <span className="font-medium text-slate-900">
                    {a.staff.name}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700">
                Correction instructions <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                maxLength={2000}
                value={changesComment}
                onChange={(e) => setChangesComment(e.target.value)}
                placeholder="Describe specific areas or items that require rework..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowChangesModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  changesComment.trim().length < 5 ||
                  selectedTargets.length === 0
                }
                onClick={() => submitDecision("REQUEST_CHANGES")}
                className="rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {busy ? "Sending..." : "Send Correction Request"}
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
    </main>
  );
}
