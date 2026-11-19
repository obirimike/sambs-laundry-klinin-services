import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  MapPin,
  UserCheck,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import CoworkersBadgeButton from "@/components/staff/CoworkersBadgeButton";
import {
  formatAssignmentStatus,
  formatBookingStatus,
  formatSupervisionStatus,
} from "@/lib/workflow";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return value.toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Accra",
  });
}

function formatDateTime(value: Date) {
  return value.toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });
}

export default async function StaffAssignmentDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fstaff");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "SUPERVISOR") redirect("/supervisor");
  if (session.user.role !== "STAFF") redirect("/account");

  const { id } = await params;

  const assignment = await db.bookingAssignment.findFirst({
    where: {
      id,
      staffId: session.user.id,
      isActive: true,
    },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
      },
      booking: {
        include: {
          customer: { select: { name: true, phone: true } },
          service: { select: { name: true, category: true, description: true } },
          supervisor: { select: { id: true, name: true } },
          assignments: {
            where: { isActive: true },
            select: {
              id: true,
              staffId: true,
              status: true,
              staff: { select: { id: true, name: true } },
            },
          },
          workflowReviews: {
            orderBy: { createdAt: "desc" },
            include: { reviewer: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  const { booking } = assignment;
  type BookingCoworker = {
    id: string;
    staffId: string;
    status: string;
    staff: { id: string; name: string } | null;
  };
  type ReviewItem = {
    decision: string;
    assignmentId: string | null;
    comment: string | null;
    reviewer: { name: string };
  };

  const coworkers = ((booking.assignments ?? []) as BookingCoworker[])
    .filter((other) => other.staffId !== session.user.id)
    .map((other) => ({
      assignmentId: other.id,
      staffId: other.staffId,
      name: other.staff?.name || "Team Member",
      status: other.status,
    }));

  const aMeta = formatAssignmentStatus(assignment.status);
  const bMeta = formatBookingStatus(booking.status);
  const sMeta = formatSupervisionStatus(booking.supervisionStatus);

  const changeRequest = ((booking.workflowReviews ?? []) as ReviewItem[]).find(
    (r) =>
      r.decision === "CHANGES_REQUESTED" &&
      (!r.assignmentId || r.assignmentId === assignment.id)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/staff"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} /> Back to My Assignments
          </Link>

          {/* Top-right coworker indicator on detail page */}
          <CoworkersBadgeButton
            bookingNumber={booking.bookingNumber}
            coworkers={coworkers}
            supervisor={booking.supervisor}
          />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-2xl font-bold text-slate-900">
                  {booking.bookingNumber}
                </h1>
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${aMeta.tone}`}
                >
                  {aMeta.label}
                </span>
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${bMeta.tone}`}
                >
                  {bMeta.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-slate-700">
                {booking.service.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Supervision stage: {sMeta.label}
              </p>
            </div>
          </div>

          {assignment.status === "CHANGES_REQUESTED" && changeRequest?.comment && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={16} />
                Supervisor requested corrections ({changeRequest.reviewer.name})
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed">
                {changeRequest.comment}
              </p>
            </div>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays size={16} className="text-slate-400" />
                <span>
                  {formatDate(booking.preferredDate)} · {booking.preferredTime}
                </span>
              </div>
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="whitespace-pre-wrap">{booking.address}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Customer:</span>{" "}
                {booking.customer.name}
                {booking.customer.phone ? ` (${booking.customer.phone})` : ""}
              </p>
              {booking.supervisor && (
                <p className="inline-flex items-center gap-1.5 text-indigo-800">
                  <UserCheck size={15} />
                  <span>Lead Supervisor: {booking.supervisor.name}</span>
                </p>
              )}
            </div>
          </div>

          {booking.specialInstructions && (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
              <p className="font-semibold text-slate-900">
                Customer instructions
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {booking.specialInstructions}
              </p>
            </div>
          )}

          {assignment.notes && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900">
              <p className="font-semibold">Administrator assignment notes</p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {assignment.notes}
              </p>
            </div>
          )}
        </section>

        {/* Submission History */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Your Completion Report History ({assignment.submissions.length})
            </h2>
            <Link
              href="/staff"
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Return to workspace actions
            </Link>
          </div>

          {assignment.submissions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              You have not submitted a completion report for this assignment yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {(
                assignment.submissions as Array<{
                  id: string;
                  summary: string;
                  workPerformed: string;
                  issuesNoted: string | null;
                  photos: unknown;
                  createdAt: Date;
                }>
              ).map((sub) => {
                const photos = Array.isArray(sub.photos)
                  ? (sub.photos as Array<{
                      storagePath: string;
                      fileName: string;
                    }>)
                  : [];
                return (
                  <div
                    key={sub.id}
                    className="rounded-lg border border-slate-200 p-4 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {sub.summary}
                      </p>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {formatDateTime(sub.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                      {sub.workPerformed}
                    </p>
                    {sub.issuesNoted && (
                      <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <strong>Issues noted:</strong> {sub.issuesNoted}
                      </p>
                    )}
                    {photos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {photos.map((photo) => (
                          <a
                            key={photo.storagePath}
                            href={`/api/evidence?bookingId=${encodeURIComponent(booking.id)}&path=${encodeURIComponent(photo.storagePath)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-slate-100"
                          >
                            {photo.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
