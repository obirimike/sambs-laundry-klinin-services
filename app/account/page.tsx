import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  Sparkles,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  MapPin,
  Calendar,
  PhoneCall,
  MessageSquare,
  Users,
  WashingMachine,
  Home,
  Bug,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import SignOutButton from "@/components/auth/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session.user.role === "SUPERVISOR") {
    redirect("/supervisor");
  }

  if (session.user.role === "STAFF") {
    redirect("/staff");
  }

  const [
    bookings,
    totalBookings,
    pendingBookings,
    inProgressBookings,
    completedBookings,
    pendingQuotesCount,
    unreadNotifications,
  ] = await Promise.all([
    db.booking.findMany({
      where: {
        customerId: session.user.id,
      },
      include: {
        service: {
          select: {
            name: true,
            category: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          where: { isActive: true },
          include: {
            staff: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),
    db.booking.count({ where: { customerId: session.user.id } }),
    db.booking.count({
      where: { customerId: session.user.id, status: "PENDING" },
    }),
    db.booking.count({
      where: {
        customerId: session.user.id,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
    }),
    db.booking.count({
      where: { customerId: session.user.id, status: "COMPLETED" },
    }),
    db.quote.count({
      where: {
        booking: {
          customerId: session.user.id,
        },
        status: "SENT",
      },
    }),
    db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    }),
  ]);

  const firstName = session.user.name?.split(" ")[0] || "Customer";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Awaiting Review",
          badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
          dotClass: "bg-amber-600",
        };
      case "CONFIRMED":
        return {
          label: "Confirmed",
          badgeClass: "bg-blue-100 text-blue-900 border-blue-300 font-bold",
          dotClass: "bg-blue-700",
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          badgeClass: "bg-purple-100 text-purple-900 border-purple-300 font-bold",
          dotClass: "bg-purple-700",
        };
      case "COMPLETED":
        return {
          label: "Completed",
          badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
          dotClass: "bg-emerald-700",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
          dotClass: "bg-rose-600",
        };
      default:
        return {
          label: status.replace(/_/g, " "),
          badgeClass: "bg-slate-200 text-slate-800 border-slate-300 font-bold",
          dotClass: "bg-slate-600",
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "LAUNDRY":
        return <WashingMachine size={22} className="text-blue-800" />;
      case "DOMESTIC_SUPPORT":
        return <Home size={22} className="text-emerald-800" />;
      case "PEST_CONTROL":
        return <Bug size={22} className="text-amber-800" />;
      case "CLEANING":
      default:
        return <Sparkles size={22} className="text-blue-800" />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      {/* Top Application Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-300 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo & Compact Title */}
          <Link
            href="/"
            className="flex items-center gap-3 transition hover:opacity-90"
            aria-label="SAMB's Laundry & Klinin Services Home"
          >
            <span className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-blue-900 bg-blue-950 shadow-sm">
              <Image
                src="/images/logo/samb-logo.jpeg"
                alt="SAMB's Logo"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                SAMB&apos;s Laundry
              </span>
              <span className="text-xs font-bold text-blue-900 tracking-wide sm:text-sm">
                &amp; Klinin Services
              </span>
            </div>
          </Link>

          {/* User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/account/notifications"
              aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ""}`}
              className="relative inline-flex h-10 w-10 sm:w-auto sm:px-4 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold transition hover:bg-slate-50 hover:text-blue-950 shadow-2xs"
            >
              <Bell size={20} className="text-slate-700" aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-600 ring-2 ring-white" />
                </span>
              )}
              <span className="ml-2 hidden text-xs font-bold sm:inline text-slate-800">Alerts</span>
              {unreadNotifications > 0 && (
                <span className="ml-1.5 hidden rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white sm:inline">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/account/profile"
              aria-label="Profile"
              className="inline-flex h-10 w-10 sm:w-auto sm:px-4 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold transition hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
            >
              <User size={18} className="text-slate-700" />
              <span className="hidden text-xs font-bold sm:inline">Profile</span>
            </Link>

            <SignOutButton className="h-10 px-3.5 text-xs font-bold rounded-xl border-slate-300" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-[#031c43] p-6 sm:p-9 text-white shadow-xl">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-8">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-600/30 px-3.5 py-1 text-xs font-bold text-white">
                <ShieldCheck size={16} className="text-blue-300" />
                <span>Verified Customer Portal</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
                Welcome back, {firstName}!
              </h1>
              <p className="text-sm font-medium leading-relaxed text-slate-200 sm:text-base sm:max-w-xl">
                Manage your active laundry pickups, cleaning schedules, pest fumigation, and review price quotations.
              </p>
            </div>

            {/* Quick Hero Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                href="/book"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-extrabold text-[#031c43] shadow-md transition hover:bg-slate-100 active:scale-[0.99]"
              >
                <Sparkles size={18} className="text-blue-900" />
                <span>Book a Service</span>
              </Link>
              <Link
                href="/account/bookings"
                className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <span>My Bookings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Prompt if Quotes are Pending */}
        {pendingQuotesCount > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-amber-950 shadow-inner">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  Price Quotation Awaiting Response
                </p>
                <p className="text-sm font-bold text-amber-950 sm:text-base">
                  You have {pendingQuotesCount} price {pendingQuotesCount === 1 ? "quotation" : "quotations"} ready for review.
                </p>
              </div>
            </div>
            <Link
              href="/account/quotes"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-800 px-5 text-xs font-extrabold text-white shadow-xs hover:bg-amber-900 transition"
            >
              <span>Review Quotations</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {/* 4-Stat Metric Row */}
        <section aria-label="Booking statistics">
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-300 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Total Bookings
                </span>
                <div className="rounded-xl bg-blue-100 p-2 text-blue-900">
                  <ClipboardList size={20} />
                </div>
              </div>
              <p className="mt-2.5 text-2xl font-black text-slate-900 sm:text-3xl">
                {totalBookings}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">All lifetime requests</p>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Awaiting Review
                </span>
                <div className="rounded-xl bg-amber-100 p-2 text-amber-900">
                  <Clock size={20} />
                </div>
              </div>
              <p className="mt-2.5 text-2xl font-black text-slate-900 sm:text-3xl">
                {pendingBookings}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">Pending review</p>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Active &amp; Assigned
                </span>
                <div className="rounded-xl bg-purple-100 p-2 text-purple-900">
                  <CalendarDays size={20} />
                </div>
              </div>
              <p className="mt-2.5 text-2xl font-black text-slate-900 sm:text-3xl">
                {inProgressBookings}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">Confirmed &amp; in-progress</p>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Completed
                </span>
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-900">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <p className="mt-2.5 text-2xl font-black text-slate-900 sm:text-3xl">
                {completedBookings}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">Fulfilled services</p>
            </div>
          </div>
        </section>

        {/* Account Portals */}
        <section aria-label="Quick navigation portals" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
              Account Portals
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Portal 1: Quotes */}
            <Link
              href="/account/quotes"
              className="group relative flex items-center justify-between rounded-2xl border border-slate-300 bg-white p-4.5 sm:p-5 shadow-sm transition hover:border-blue-700 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 shadow-inner">
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-900 transition">
                    Service Quotations
                  </h3>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    Review and accept price estimates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pendingQuotesCount > 0 && (
                  <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-extrabold text-amber-950">
                    {pendingQuotesCount} pending
                  </span>
                )}
                <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 group-hover:text-blue-900 transition" />
              </div>
            </Link>

            {/* Portal 2: Notifications */}
            <Link
              href="/account/notifications"
              className="group relative flex items-center justify-between rounded-2xl border border-slate-300 bg-white p-4.5 sm:p-5 shadow-sm transition hover:border-purple-700 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-900 shadow-inner">
                  <Bell size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-900 transition">
                    Notification Inbox
                  </h3>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    Clear alerts &amp; booking updates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadNotifications > 0 && (
                  <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-extrabold text-white">
                    {unreadNotifications} new
                  </span>
                )}
                <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 group-hover:text-purple-900 transition" />
              </div>
            </Link>

            {/* Portal 3: Services Catalog */}
            <Link
              href="/services"
              className="group relative flex items-center justify-between rounded-2xl border border-slate-300 bg-white p-4.5 sm:p-5 shadow-sm transition hover:border-emerald-700 hover:shadow-md sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 shadow-inner">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-900 transition">
                    Browse All Services
                  </h3>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    Laundry, cleaning, &amp; pest control
                  </p>
                </div>
              </div>

              <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-900 transition" />
            </Link>
          </div>
        </section>

        {/* Recent Service Requests Section */}
        <section aria-label="Recent service bookings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                Recent Service Requests
              </h2>
              <p className="text-xs font-semibold text-slate-600">
                Detailed overview of your current and previous service requests
              </p>
            </div>

            <Link
              href="/account/bookings"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-950 transition"
            >
              <span>View all ({totalBookings})</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-400 bg-white p-8 sm:p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 shadow-inner">
                <Sparkles size={28} />
              </div>
              <h3 className="mt-4 text-base font-extrabold text-slate-900">
                No service bookings yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-relaxed text-slate-600">
                Choose from laundry care, office and home cleaning, pest control, or domestic assistance.
              </p>
              <div className="mt-5">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#031c43] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-950 transition"
                >
                  <PlusCircle size={16} />
                  <span>Request a Service</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => {
                const badge = getStatusBadge(booking.status);
                const formattedDate = new Date(booking.preferredDate).toLocaleDateString("en-GH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <Link
                    key={booking.id}
                    href={`/account/bookings/${booking.id}`}
                    className="group flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-900 hover:shadow-md"
                  >
                    <div>
                      {/* Top Bar: Service Category Icon & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
                          {getCategoryIcon(booking.service.category)}
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${badge.badgeClass}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${badge.dotClass}`} />
                          {badge.label}
                        </span>
                      </div>

                      {/* Service Name & Booking # */}
                      <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-900 transition line-clamp-1">
                        {booking.service.name}
                      </h3>
                      <p className="font-mono text-xs font-bold text-slate-700 mt-0.5">
                        #{booking.bookingNumber}
                      </p>

                      {/* Schedule & Address info */}
                      <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-blue-900 shrink-0 font-bold" />
                          <span className="font-bold text-slate-900">
                            {formattedDate} at {booking.preferredTime}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin size={15} className="text-slate-700 shrink-0 mt-0.5 font-bold" />
                          <span className="line-clamp-2 font-medium leading-relaxed text-slate-700">
                            {booking.address}
                          </span>
                        </div>

                        {((booking.supervisor || (booking.assignments && booking.assignments.length > 0)) && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {booking.supervisor && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                                <ShieldCheck size={11} />
                                Lead: {booking.supervisor.name}
                              </span>
                            )}
                            {booking.assignments?.length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                <Users size={11} />
                                {booking.assignments.length} staff
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs font-extrabold text-blue-900">
                      <span>View details</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Customer Assistance Banner */}
        <section aria-label="Customer support assistance">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-slate-300 bg-white p-5 sm:p-7 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-900 shadow-inner">
                <HelpCircle size={26} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Need help with your booking?
                </h3>
                <p className="text-xs font-medium leading-relaxed text-slate-600 sm:max-w-xl">
                  Have questions about your service request, pricing, or scheduling? Our customer support team is ready to assist you.
                </p>
              </div>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-2.5 shrink-0">
              <a
                href="tel:+233540240754"
                className="flex-1 sm:flex-initial inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 text-xs font-extrabold text-slate-900 hover:bg-slate-100 transition shadow-2xs"
              >
                <PhoneCall size={15} className="text-blue-900" />
                <span>Call Desk</span>
              </a>
              <Link
                href="/contact"
                className="flex-1 sm:flex-initial inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#031c43] px-5 text-xs font-extrabold text-white hover:bg-blue-950 transition shadow-xs"
              >
                <MessageSquare size={15} />
                <span>Send Message</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
