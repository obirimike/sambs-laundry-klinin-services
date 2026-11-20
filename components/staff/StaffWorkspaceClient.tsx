"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Play,
  Send,
  Trash2,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import CoworkersBadgeButton, {
  type CoworkerSummary,
} from "@/components/staff/CoworkersBadgeButton";
import SignOutButton from "@/components/auth/SignOutButton";
import FeedbackModal from "@/components/ui/FeedbackModal";
import {
  formatAssignmentStatus,
  formatBookingStatus,
  formatSupervisionStatus,
} from "@/lib/workflow";

export type StaffAssignmentItem = {
  id: string;
  status: string;
  notes: string | null;
  assignedAt: string;
  startedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  booking: {
    id: string;
    bookingNumber: string;
    status: string;
    supervisionStatus: string;
    preferredDate: string;
    preferredTime: string;
    address: string;
    specialInstructions: string | null;
    customer: {
      name: string;
      phone: string | null;
    };
    service: {
      name: string;
      category: string;
    };
    supervisor: {
      id: string;
      name: string;
    } | null;
  };
  coworkers: CoworkerSummary[];
  latestSubmission: {
    id: string;
    summary: string;
    workPerformed: string;
    issuesNoted: string | null;
    photos: Array<{ storagePath: string; fileName: string }>;
    createdAt: string;
  } | null;
  supervisorFeedback: {
    comment: string;
    reviewerName: string;
    createdAt: string;
  } | null;
};

type Props = {
  staffName: string;
  unreadNotifications: number;
  assignments: StaffAssignmentItem[];
};

type FilterKey =
  | "ALL_ACTIVE"
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED_FOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "COMPLETED";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Accra",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });
}

export default function StaffWorkspaceClient({
  staffName,
  unreadNotifications,
  assignments,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("ALL_ACTIVE");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Completion report modal state
  const [reportTarget, setReportTarget] = useState<StaffAssignmentItem | null>(
    null
  );
  const [summary, setSummary] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [issuesNoted, setIssuesNoted] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState("");

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

  const activeItems = useMemo(
    () =>
      assignments.filter(
        (a) =>
          a.booking.status === "CONFIRMED" || a.booking.status === "IN_PROGRESS"
      ),
    [assignments]
  );

  const counts = useMemo(
    () => ({
      allActive: activeItems.length,
      pending: activeItems.filter((a) => a.status === "PENDING").length,
      inProgress: activeItems.filter((a) => a.status === "IN_PROGRESS").length,
      submitted: activeItems.filter(
        (a) => a.status === "SUBMITTED_FOR_REVIEW"
      ).length,
      changes: activeItems.filter((a) => a.status === "CHANGES_REQUESTED")
        .length,
      completed: assignments.filter(
        (a) => a.status === "APPROVED" || a.booking.status === "COMPLETED"
      ).length,
    }),
    [activeItems, assignments]
  );

  const visibleAssignments = useMemo(() => {
    switch (filter) {
      case "PENDING":
        return activeItems.filter((a) => a.status === "PENDING");
      case "IN_PROGRESS":
        return activeItems.filter((a) => a.status === "IN_PROGRESS");
      case "SUBMITTED_FOR_REVIEW":
        return activeItems.filter((a) => a.status === "SUBMITTED_FOR_REVIEW");
      case "CHANGES_REQUESTED":
        return activeItems.filter((a) => a.status === "CHANGES_REQUESTED");
      case "COMPLETED":
        return assignments.filter(
          (a) => a.status === "APPROVED" || a.booking.status === "COMPLETED"
        );
      case "ALL_ACTIVE":
      default:
        return activeItems;
    }
  }, [activeItems, assignments, filter]);

  async function handleStartWork(assignment: StaffAssignmentItem) {
    setBusyId(`start-${assignment.id}`);
    try {
      const response = await fetch(
        `/api/staff/assignments/${assignment.id}/start`,
        {
          method: "POST",
        }
      );

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Unable to Start Work",
          message: data.message || "Could not start this assignment.",
        });
        return;
      }

      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Work Started",
        message:
          data.message ||
          `You have started work on ${assignment.booking.bookingNumber}.`,
        referenceNumber: assignment.booking.bookingNumber,
      });
      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to reach the server. Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  }

  function openReportModal(assignment: StaffAssignmentItem) {
    setReportTarget(assignment);
    setSummary(assignment.latestSubmission?.summary ?? "");
    setWorkPerformed(assignment.latestSubmission?.workPerformed ?? "");
    setIssuesNoted(assignment.latestSubmission?.issuesNoted ?? "");
    setSelectedFiles([]);
    setFormError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFormError("");
    const incoming = Array.from(event.target.files ?? []);
    if (incoming.length === 0) return;

    const combined = [...selectedFiles, ...incoming].slice(0, 4);
    for (const file of combined) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError(`${file.name} exceeds the 5 MB file size limit.`);
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setFormError(
          `${file.name} must be a JPEG, PNG, or WebP image file.`
        );
        return;
      }
    }

    setSelectedFiles(combined);
    event.target.value = "";
  }

  async function handleSubmitReport(event: FormEvent) {
    event.preventDefault();
    if (!reportTarget) return;

    setFormError("");
    if (summary.trim().length < 5) {
      setFormError("Provide a completion summary (at least 5 characters).");
      return;
    }
    if (workPerformed.trim().length < 10) {
      setFormError("Describe the work performed (at least 10 characters).");
      return;
    }

    setBusyId(`submit-${reportTarget.id}`);

    try {
      const formData = new FormData();
      formData.append("summary", summary.trim());
      formData.append("workPerformed", workPerformed.trim());
      if (issuesNoted.trim()) {
        formData.append("issuesNoted", issuesNoted.trim());
      }
      for (const file of selectedFiles) {
        formData.append("photos", file);
      }

      const response = await fetch(
        `/api/staff/assignments/${reportTarget.id}/submit`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFormError(data.message || "Unable to submit completion report.");
        return;
      }

      const bookingNumber = reportTarget.booking.bookingNumber;
      setReportTarget(null);
      setSelectedFiles([]);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Completion Report Submitted",
        message:
          data.message ||
          `Completion report submitted for ${bookingNumber}.`,
        referenceNumber: bookingNumber,
      });

      router.refresh();
    } catch {
      setFormError("A network error occurred while submitting your report.");
    } finally {
      setBusyId(null);
    }
  }

  const filterTabs: Array<{ key: FilterKey; label: string; count: number }> = [
    { key: "ALL_ACTIVE", label: "All Active", count: counts.allActive },
    { key: "PENDING", label: "Pending Start", count: counts.pending },
    { key: "IN_PROGRESS", label: "In Progress", count: counts.inProgress },
    {
      key: "CHANGES_REQUESTED",
      label: "Changes Requested",
      count: counts.changes,
    },
    {
      key: "SUBMITTED_FOR_REVIEW",
      label: "Under Review",
      count: counts.submitted,
    },
    { key: "COMPLETED", label: "Approved / Done", count: counts.completed },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Staff Workspace Header Bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#031c43] text-sm font-bold text-white">
              S
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                SAMB&apos;s Field Staff
              </p>
              <p className="truncate text-xs text-slate-500">{staffName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/account/notifications"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Bell size={14} />
              <span className="hidden sm:inline">Notifications</span>
              {unreadNotifications > 0 && (
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-blue-800 tabular-nums">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/account/profile"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <UserRound size={14} />
              <span className="hidden sm:inline">Profile</span>
            </Link>

            <SignOutButton className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome & Metrics */}
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Staff Workspace
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome, {staffName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Start assigned bookings, view team coworkers, and submit completion
              reports for supervisor inspection.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Active Assignments
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {counts.allActive}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">In Progress</p>
            <p className="mt-2 font-mono text-2xl font-bold text-blue-700 tabular-nums">
              {counts.inProgress}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Changes Requested
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-amber-700 tabular-nums">
              {counts.changes}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Submitted / Approved
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {counts.submitted + counts.completed}
            </p>
          </div>
        </section>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                filter === t.key
                  ? "border-[#031c43] bg-[#031c43] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                  filter === t.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Assignment Cards */}
        {visibleAssignments.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <ClipboardCheck size={30} className="mx-auto text-slate-400" />
            <h2 className="mt-3 text-base font-semibold text-slate-900">
              No assignments in this view
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Assignments appear here when an administrator assigns you to a
              confirmed booking.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {visibleAssignments.map((assignment) => {
              const { booking } = assignment;
              const aMeta = formatAssignmentStatus(assignment.status);
              const bMeta = formatBookingStatus(booking.status);
              const supMeta = formatSupervisionStatus(
                booking.supervisionStatus
              );

              return (
                <article
                  key={assignment.id}
                  data-testid={`staff-assignment-${booking.bookingNumber}`}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div>
                    {/* Top row with Booking Ref on left and Top-Right Coworkers Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-mono text-base font-bold text-slate-900">
                            {booking.bookingNumber}
                          </h2>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${aMeta.tone}`}
                          >
                            {aMeta.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {booking.service.name}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <CoworkersBadgeButton
                          bookingNumber={booking.bookingNumber}
                          coworkers={assignment.coworkers}
                          supervisor={booking.supervisor}
                        />
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${bMeta.tone}`}
                        >
                          {bMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* Supervisor Changes Alert */}
                    {assignment.status === "CHANGES_REQUESTED" &&
                      assignment.supervisorFeedback && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                          <p className="flex items-center gap-1.5 font-semibold text-amber-900">
                            <AlertTriangle size={14} />
                            Corrections requested by{" "}
                            {assignment.supervisorFeedback.reviewerName}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                            {assignment.supervisorFeedback.comment}
                          </p>
                        </div>
                      )}

                    {/* Booking Details */}
                    <div className="mt-4 space-y-2.5 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <CalendarDays
                          size={15}
                          className="shrink-0 text-slate-400"
                        />
                        <span className="tabular-nums">
                          {formatDate(booking.preferredDate)} ·{" "}
                          {booking.preferredTime}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-700">
                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <span className="whitespace-pre-wrap">
                          {booking.address}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>
                          Customer:{" "}
                          <strong className="text-slate-800">
                            {booking.customer.name}
                          </strong>
                          {booking.customer.phone
                            ? ` (${booking.customer.phone})`
                            : ""}
                        </span>

                        {booking.supervisor && (
                          <span className="inline-flex items-center gap-1 text-indigo-800">
                            <UserCheck size={13} />
                            Supervisor: {booking.supervisor.name}
                          </span>
                        )}
                      </div>

                      {booking.specialInstructions && (
                        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                          <p className="font-semibold text-slate-800">
                            Customer instructions
                          </p>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                            {booking.specialInstructions}
                          </p>
                        </div>
                      )}

                      {assignment.notes && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900">
                          <p className="font-semibold">Assignment notes</p>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                            {assignment.notes}
                          </p>
                        </div>
                      )}

                      {assignment.latestSubmission && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-800">
                              Your latest submission
                            </p>
                            <span className="text-[11px] text-slate-500">
                              {formatDateTime(
                                assignment.latestSubmission.createdAt
                              )}
                            </span>
                          </div>
                          <p className="mt-1 font-medium text-slate-900">
                            {assignment.latestSubmission.summary}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-600">
                            {assignment.latestSubmission.workPerformed}
                          </p>
                          {assignment.latestSubmission.photos.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {assignment.latestSubmission.photos.map(
                                (photo) => (
                                  <a
                                    key={photo.storagePath}
                                    href={`/api/evidence?bookingId=${encodeURIComponent(booking.id)}&path=${encodeURIComponent(photo.storagePath)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-slate-50"
                                  >
                                    {photo.fileName}
                                  </a>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <Link
                      href={`/staff/assignments/${assignment.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700"
                    >
                      <span>View details</span>
                      <ExternalLink size={13} />
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                      {assignment.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => handleStartWork(assignment)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50"
                        >
                          {busyId === `start-${assignment.id}` ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Play size={14} />
                          )}
                          <span>Start Work</span>
                        </button>
                      )}

                      {["PENDING", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(
                        assignment.status
                      ) && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() => openReportModal(assignment)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#031c43] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-950 disabled:opacity-50"
                        >
                          <Send size={14} />
                          <span>
                            {assignment.status === "CHANGES_REQUESTED"
                              ? "Resubmit Corrections"
                              : "Submit Completion Report"}
                          </span>
                        </button>
                      )}

                      {assignment.status === "SUBMITTED_FOR_REVIEW" && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800">
                          <CheckCircle2 size={14} />
                          {supMeta.label}
                        </span>
                      )}

                      {assignment.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 size={14} />
                          Approved by Supervisor
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Completion Report Modal */}
      {reportTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Submit completion report for ${reportTarget.booking.bookingNumber}`}
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setReportTarget(null)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  {reportTarget.booking.bookingNumber} ·{" "}
                  {reportTarget.booking.service.name}
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                  {reportTarget.status === "CHANGES_REQUESTED"
                    ? "Resubmit Corrected Completion Report"
                    : "Submit Completion Report"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                aria-label="Close modal"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="report-summary"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Completion summary <span className="text-rose-600">*</span>
                </label>
                <input
                  id="report-summary"
                  required
                  minLength={5}
                  maxLength={1000}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Completed deep living room and kitchen sanitization"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="report-work"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Work performed <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="report-work"
                  required
                  rows={4}
                  minLength={10}
                  maxLength={4000}
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  placeholder="Detail all rooms/items serviced, equipment used, and final inspection steps."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="report-issues"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Issues or concerns noted (optional)
                </label>
                <textarea
                  id="report-issues"
                  rows={2}
                  maxLength={2000}
                  value={issuesNoted}
                  onChange={(e) => setIssuesNoted(e.target.value)}
                  placeholder="Report any pre-existing damage, missing access, or follow-up recommendations."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Supporting photos (optional, max 4 JPEG/PNG/WebP up to 5 MB
                  each)
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-100">
                  <ImagePlus size={16} className="text-blue-700" />
                  <span>
                    {selectedFiles.length >= 4
                      ? "Maximum 4 photos attached"
                      : "Select photos to attach"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={selectedFiles.length >= 4}
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>

                {selectedFiles.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {selectedFiles.map((file, idx) => (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFiles((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          aria-label={`Remove ${file.name}`}
                          className="ml-2 text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyId === `submit-${reportTarget.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#031c43] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
                >
                  {busyId === `submit-${reportTarget.id}` ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>
                    {busyId === `submit-${reportTarget.id}`
                      ? "Submitting..."
                      : "Submit Report for Review"}
                  </span>
                </button>
              </div>
            </form>
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
