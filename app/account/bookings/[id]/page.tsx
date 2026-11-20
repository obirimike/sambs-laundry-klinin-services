
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAssignmentStatus } from "@/lib/workflow";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import ServiceDetailsViewer from "@/components/booking/ServiceDetailsViewer";
import CustomerBookingActions from "@/components/account/CustomerBookingActions";



type BookingDetailsPageProps = {
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
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "IN_PROGRESS":
      return "bg-violet-100 text-violet-800";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function getStatusMessage(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "Your booking has been confirmed. Please contact our team if you need to discuss the arrangements.";
    case "IN_PROGRESS":
      return "Your service is marked as in progress.";
    case "COMPLETED":
      return "This service has been marked as completed. Thank you for choosing SAMB's.";
    case "CANCELLED":
      return "This booking has been cancelled. Please contact our team if you have questions.";
    default:
      return "Your request has been received and is awaiting review. The team will discuss availability, service details, and pricing before confirmation.";
  }
}

export default async function BookingDetailsPage({
  params,
}: BookingDetailsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "CUSTOMER") {
    redirect("/account");
  }

  const { id } = await params;

  const booking = await db.booking.findFirst({
    where: {
      id,
      customerId: session.user.id,
    },
    include: {
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
          phone: true,
        },
      },
      assignments: {
        where: {
          isActive: true,
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          assignedAt: "asc",
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const isLaundry = booking.service.category === "LAUNDRY";

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/account/bookings"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to my bookings
          </Link>

          <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                  Booking details
                </p>
                <h1 className="mt-2 break-words text-2xl font-black text-slate-900 sm:text-3xl">
                  {booking.service.name}
                </h1>
                <p className="mt-3 text-sm text-slate-500">
                  Reference number
                </p>
                <p className="mt-1 break-all font-bold text-slate-800">
                  {booking.bookingNumber}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-bold ${getStatusStyle(booking.status)}`}
              >
                {formatStatus(booking.status)}
              </span>
            </div>

            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-blue-700" size={21} />
                <div>
                  <h2 className="font-bold text-slate-900">
                    Current booking status
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {getStatusMessage(booking.status)}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Booking Management Actions */}
            <div className="mt-6">
              <CustomerBookingActions
                bookingId={booking.id}
                bookingNumber={booking.bookingNumber}
                status={booking.status}
                serviceName={booking.service.name}
                currentDate={formatDate(booking.preferredDate)}
                currentTime={booking.preferredTime}
              />
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-bold text-slate-900">
                Requested schedule
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays size={17} />
                    Preferred date
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(booking.preferredDate)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 size={17} />
                    Preferred time
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">
                    {booking.preferredTime}
                  </p>
                </div>
              </div>
            </section>

            {/* Assigned Service Team Section */}
            <section className="mt-8 border-t border-slate-100 pt-7">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="text-blue-700" size={20} />
                    <h2 className="text-lg font-bold text-slate-900">
                      Assigned Service Team
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Dedicated staff and quality supervisor assigned to your booking.
                  </p>
                </div>

                {(booking.supervisor || booking.assignments.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                    {booking.supervisor && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
                        <ShieldCheck size={13} />
                        Lead Supervisor
                      </span>
                    )}
                    {booking.assignments.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                        <Users size={13} />
                        {booking.assignments.length} Field {booking.assignments.length === 1 ? "Specialist" : "Specialists"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!booking.supervisor && booking.assignments.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        Team scheduling in progress
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Our operations desk will assign your dedicated field crew and lead supervisor once your booking is confirmed. Their names and contact details will appear here.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {/* Lead Supervisor Card */}
                  {booking.supervisor && (
                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-5 shadow-2xs">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs font-bold text-base">
                            {booking.supervisor.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">
                                {booking.supervisor.name}
                              </h3>
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-900">
                                <ShieldCheck size={12} />
                                Lead Supervisor
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600">
                              Directs on-site execution, coordinates with you, and conducts final quality sign-off.
                            </p>
                          </div>
                        </div>

                        {/* Supervisor Contact Info */}
                        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                          {booking.supervisor.phone && (
                            <a
                              href={`tel:${booking.supervisor.phone}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition"
                            >
                              <Phone size={13} />
                              <span>{booking.supervisor.phone}</span>
                            </a>
                          )}
                          {booking.supervisor.email && (
                            <a
                              href={`mailto:${booking.supervisor.email}`}
                              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
                            >
                              <Mail size={13} />
                              <span className="truncate max-w-[200px]">{booking.supervisor.email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Field Staff Grid */}
                  {booking.assignments.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Field Crew ({booking.assignments.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {booking.assignments.map((assignment) => {
                          const statusInfo = formatAssignmentStatus(assignment.status);
                          return (
                            <div
                              key={assignment.id}
                              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800 font-bold text-sm">
                                      {assignment.staff.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-900 text-sm truncate">
                                        {assignment.staff.name}
                                      </p>
                                      <p className="text-[11px] text-slate-500">
                                        Field Specialist
                                      </p>
                                    </div>
                                  </div>

                                  <span
                                    className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusInfo.tone}`}
                                  >
                                    {statusInfo.label}
                                  </span>
                                </div>
                              </div>

                              {/* Contact Details */}
                              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                                {assignment.staff.phone ? (
                                  <a
                                    href={`tel:${assignment.staff.phone}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
                                  >
                                    <Phone size={12} />
                                    <span>{assignment.staff.phone}</span>
                                  </a>
                                ) : null}
                                {assignment.staff.email && (
                                  <a
                                    href={`mailto:${assignment.staff.email}`}
                                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 hover:underline truncate max-w-[180px]"
                                  >
                                    <Mail size={12} />
                                    <span className="truncate">{assignment.staff.email}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* When supervisor is assigned but staff isn't yet */}
                  {booking.supervisor && booking.assignments.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-600">
                      Field staff specialists are currently being assigned by operations to work alongside your lead supervisor.
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="mt-8 border-t border-slate-100 pt-7">
              <h2 className="text-lg font-bold text-slate-900">
                Service information
              </h2>

              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  {isLaundry ? (
                    <Package className="mt-0.5 shrink-0 text-blue-700" size={20} />
                  ) : (
                    <Sparkles className="mt-0.5 shrink-0 text-blue-700" size={20} />
                  )}
                  <div>
                    <p className="text-sm text-slate-500">Category</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {isLaundry ? "Laundry" : "Cleaning"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 shrink-0 text-blue-700" size={20} />
                  <div>
                    <p className="text-sm text-slate-500">Service address</p>
                    <p className="mt-1 whitespace-pre-wrap font-medium leading-6 text-slate-900">
                      {booking.address}
                    </p>
                  </div>
                </div>

                {booking.propertyType && (
                  <div>
                    <p className="text-sm text-slate-500">Property or venue type</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {booking.propertyType}
                    </p>
                  </div>
                )}

                {booking.numberOfRooms !== null && (
                  <div>
                    <p className="text-sm text-slate-500">Number of rooms</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {booking.numberOfRooms}
                    </p>
                  </div>
                )}

                {booking.estimatedSize && (
                  <div>
                    <p className="text-sm text-slate-500">Estimated size</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {booking.estimatedSize}
                    </p>
                  </div>
                )}

                {booking.specialInstructions && (
                  <div>
                    <p className="text-sm text-slate-500">Special instructions</p>
                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-800">
                      {booking.specialInstructions}
                    </p>
                  </div>
                )}

                <ServiceDetailsViewer
                  category={booking.service.category}
                  serviceDetails={booking.serviceDetails as Record<string, unknown> | null}
                />
              </div>
            </section>

            <section className="mt-8 border-t border-slate-100 pt-7">
              <h2 className="text-lg font-bold text-slate-900">
                Request timeline
              </h2>

              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#031c43]" />
                  <div>
                    <p className="font-medium text-slate-900">
                      Request submitted
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                </div>

                {booking.confirmedAt && (
                  <div className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#031c43]" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Booking confirmed
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(booking.confirmedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {booking.completedAt && (
                  <div className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Service completed
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(booking.completedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {booking.cancelledAt && (
                  <div className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Booking cancelled
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(booking.cancelledAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="mt-8 rounded-2xl bg-blue-50 p-5">
              <h2 className="font-bold text-blue-950">
                Pricing and confirmation
              </h2>
              <p className="mt-2 text-sm leading-6 text-blue-900">
                Your service price is discussed based on the scope of work.
                The preferred date and time are requests and are not confirmed
                until the team approves the booking.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="rounded-xl bg-[#031c43] px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Browse services
              </Link>
              <Link
                href="/account/bookings"
                className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                All my bookings
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
