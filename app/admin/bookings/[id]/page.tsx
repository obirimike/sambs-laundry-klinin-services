import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  MapPin,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import BookingManager from "@/components/admin/booking-manager";
import WhatsAppButton from "@/components/admin/WhatsAppButton";
import { buildBookingWhatsAppMessage } from "@/lib/whatsapp";
import ServiceDetailsViewer from "@/components/booking/ServiceDetailsViewer";
import {
  formatAssignmentStatus,
  formatBookingStatus,
  formatSupervisionStatus,
} from "@/lib/workflow";

export const dynamic = "force-dynamic";

type AdminBookingPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  }).format(date);
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  if (value === null || value === "") return null;

  return (
    <div className="border-b border-slate-100 py-3.5 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
        {value}
      </p>
    </div>
  );
}

export default async function AdminBookingDetailPage({
  params,
}: AdminBookingPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      service: {
        select: {
          name: true,
          category: true,
          description: true,
        },
      },
      supervisor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      finalApprovedBy: {
        select: {
          name: true,
        },
      },
      assignments: {
        where: { isActive: true },
        orderBy: { assignedAt: "asc" },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      workflowReviews: {
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const bookingWhatsAppMessage = buildBookingWhatsAppMessage({
    customerName: booking.customer.name,
    bookingNumber: booking.bookingNumber,
    serviceName: booking.service.name,
    preferredDate: booking.preferredDate,
    preferredTime: booking.preferredTime,
  });

  const bStatus = formatBookingStatus(booking.status);
  const sStatus = formatSupervisionStatus(booking.supervisionStatus);
  const hasWorkflowTeam =
    Boolean(booking.supervisorId) || booking.assignments.length > 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} />
        Back to all bookings
      </Link>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Admin booking management
          </p>
          <h1 className="mt-1 break-all font-mono text-2xl font-bold text-slate-900 sm:text-3xl">
            {booking.bookingNumber}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Submitted {formatDate(booking.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${bStatus.tone}`}
          >
            {bStatus.label}
          </span>
          {booking.supervisionStatus !== "NOT_REQUIRED" && (
            <span
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${sStatus.tone}`}
            >
              {sStatus.label}
            </span>
          )}
        </div>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <UserRound size={20} className="text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">
                Customer information
              </h2>
            </div>

            <div className="mt-3">
              <Detail label="Customer name" value={booking.customer.name} />
              <Detail label="Email" value={booking.customer.email} />
              <Detail label="Phone" value={booking.customer.phone} />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Direct communication
              </p>
              <WhatsAppButton
                phone={booking.customer.phone}
                message={bookingWhatsAppMessage}
                showHelperText
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <CalendarDays size={20} className="text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">
                Requested service
              </h2>
            </div>

            <div className="mt-3">
              <Detail label="Service" value={booking.service.name} />
              <Detail
                label="Category"
                value={
                  booking.service.category === "LAUNDRY"
                    ? "Laundry"
                    : booking.service.category === "DOMESTIC_SUPPORT"
                      ? "Domestic Support"
                      : booking.service.category === "PEST_CONTROL"
                        ? "Pest Control"
                        : "Cleaning"
                }
              />
              <Detail
                label="Description"
                value={booking.service.description}
              />
              <Detail
                label="Preferred date"
                value={formatDate(booking.preferredDate)}
              />
              <Detail label="Preferred time" value={booking.preferredTime} />
              <Detail label="Property type" value={booking.propertyType} />
              <Detail label="Number of rooms" value={booking.numberOfRooms} />
              <Detail label="Estimated size" value={booking.estimatedSize} />
              <Detail
                label="Special instructions"
                value={booking.specialInstructions}
              />
            </div>

            <ServiceDetailsViewer
              category={booking.service.category}
              serviceDetails={
                booking.serviceDetails as Record<string, unknown> | null
              }
            />

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-4">
              <MapPin size={18} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Service address
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {booking.address}
                </p>
              </div>
            </div>
          </section>

          {/* Assigned Team, Completion Reports & Supervision Timeline */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Users size={20} className="text-blue-700" />
                <h2 className="text-lg font-bold text-slate-900">
                  Team &amp; Supervision Progress
                </h2>
              </div>
              <Link
                href="/admin/assignments"
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Manage assignments
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-blue-700" />
                <span className="text-slate-600">Lead Supervisor:</span>
                <span className="font-semibold text-slate-900">
                  {booking.supervisor?.name || "Unassigned"}
                </span>
              </div>
              {booking.finalApprovedBy && booking.finalApprovedAt && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                  <ShieldCheck size={14} />
                  Final approved by {booking.finalApprovedBy.name} on{" "}
                  {formatDateTime(booking.finalApprovedAt)}
                </span>
              )}
            </div>

            {booking.assignments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No field staff currently assigned to this booking.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {(
                  booking.assignments as Array<{
                    id: string;
                    status: string;
                    staff: { name: string; email: string };
                    submissions?: Array<{
                      summary: string;
                      workPerformed: string;
                      issuesNoted: string | null;
                      photos: unknown;
                    }>;
                  }>
                ).map((assignment) => {
                  const aMeta = formatAssignmentStatus(assignment.status);
                  const latest = assignment.submissions?.[0];
                  const photos =
                    latest && Array.isArray(latest.photos)
                      ? (latest.photos as Array<{
                          storagePath: string;
                          fileName: string;
                        }>)
                      : [];

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {assignment.staff.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {assignment.staff.email}
                          </p>
                        </div>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${aMeta.tone}`}
                        >
                          {aMeta.label}
                        </span>
                      </div>

                      {latest && (
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                          <p className="font-semibold text-slate-800">
                            {latest.summary}
                          </p>
                          <p className="whitespace-pre-wrap text-slate-600">
                            {latest.workPerformed}
                          </p>
                          {latest.issuesNoted && (
                            <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-amber-900">
                              <strong>Issues:</strong> {latest.issuesNoted}
                            </p>
                          )}
                          {photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {photos.map((photo) => (
                                <a
                                  key={photo.storagePath}
                                  href={`/api/evidence?bookingId=${encodeURIComponent(booking.id)}&path=${encodeURIComponent(photo.storagePath)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-slate-100"
                                >
                                  {photo.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {booking.workflowReviews.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Review Timeline
                </h3>
                <div className="mt-2.5 space-y-2">
                  {(
                    booking.workflowReviews as Array<{
                      id: string;
                      reviewerRole: string;
                      decision: string;
                      comment: string | null;
                      createdAt: Date;
                      reviewer: { name: string };
                    }>
                  ).map((review) => (
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
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold text-slate-500">
              Current status
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {booking.status.replaceAll("_", " ")}
            </p>
            {booking.supervisionStatus === "SUPERVISOR_APPROVED" &&
              booking.status !== "COMPLETED" && (
                <Link
                  href="/admin/approvals"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  <CheckCheck size={15} />
                  Open Final Approval Queue
                </Link>
              )}
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Pricing is negotiable and should be discussed with the customer
              based on the scope of work before confirming service arrangements.
            </p>
          </section>

          <BookingManager
            bookingId={booking.id}
            bookingNumber={booking.bookingNumber}
            currentStatus={booking.status}
            initialNotes={booking.adminNotes || ""}
            hasWorkflowTeam={hasWorkflowTeam}
            supervisionStatus={booking.supervisionStatus}
          />
        </div>
      </div>
    </main>
  );
}
