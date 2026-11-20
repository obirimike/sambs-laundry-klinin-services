"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Trash2,
  Check,
  Calendar,
  AlertCircle,
  FileText,
  Inbox,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string | Date;
};

export default function NotificationsList({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "booking":
      case "booking_update":
      case "booking_confirmed":
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case "quote":
      case "quote_received":
      case "quote_sent":
      case "quote_revised":
      case "quote_withdrawn":
      case "quote_expired":
      case "quote_response":
        return <FileText className="h-5 w-5 text-indigo-600" />;
      case "completed":
      case "service_completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "alert":
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case "cancelled":
      case "booking_cancelled":
        return <AlertCircle className="h-5 w-5 text-rose-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  async function markAsRead(id: string) {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update notification.");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setSuccess("Notification marked as read.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNotification(id: string) {
    setBusyId(`del-${id}`);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not clear notification.");
      }

      setNotifications((current) =>
        current.filter((notification) => notification.id !== id)
      );

      setSuccess("Notification cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    setBusyId("all-read");
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not update notifications.");
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setSuccess("All notifications marked as read.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  async function clearAllNotifications(scope: "all" | "read-only" = "all") {
    const confirmationPrompt =
      scope === "read-only"
        ? "Clear all read notifications?"
        : "Clear all notifications? This cannot be undone.";

    if (!window.confirm(confirmationPrompt)) {
      return;
    }

    setBusyId(scope === "read-only" ? "clear-read" : "clear-all");
    setError("");
    setSuccess("");

    try {
      const url =
        scope === "read-only"
          ? "/api/notifications?scope=read-only"
          : "/api/notifications?scope=all";

      const response = await fetch(url, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not clear notifications.");
      }

      setNotifications((current) =>
        scope === "read-only"
          ? current.filter((n) => !n.isRead)
          : []
      );

      setSuccess(
        scope === "read-only"
          ? "Read notifications cleared."
          : "All notifications cleared."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time updates about your service bookings, status changes, and quotes.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={busyId !== null}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check size={14} className="text-blue-600" />
              <span>{busyId === "all-read" ? "Updating..." : "Mark all read"}</span>
            </button>
          )}

          {readCount > 0 && (
            <button
              type="button"
              onClick={() => clearAllNotifications("read-only")}
              disabled={busyId !== null}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={13} className="text-slate-400" />
              <span>Clear read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => clearAllNotifications("all")}
              disabled={busyId !== null}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-xs transition hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={13} />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "all"
              ? "bg-[#031c43] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "unread"
              ? "bg-[#031c43] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("read")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            filter === "read"
              ? "bg-[#031c43] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Read ({readCount})
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
        >
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800"
        >
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Notifications Listing */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-inner">
            <Inbox size={26} />
          </div>
          <h3 className="mt-4 font-bold text-slate-900 text-lg">
            {filter === "unread"
              ? "No unread notifications"
              : filter === "read"
              ? "No read notifications"
              : "Your inbox is clear"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {filter === "all"
              ? "When our dispatch team updates your booking, prepares quotes, or completes services, alerts will appear here."
              : "Switch filters to view all your alerts."}
          </p>
          <div className="mt-6">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const isBusy = busyId === notification.id || busyId === `del-${notification.id}`;
            const timeAgo = new Date(notification.createdAt).toLocaleDateString("en-GH", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const isQuoteNotification =
              notification.type.toLowerCase().includes("quote") ||
              notification.title.toLowerCase().includes("quote");

            const isBookingNotification =
              notification.type.toLowerCase().includes("booking") ||
              notification.title.toLowerCase().includes("booking");

            return (
              <article
                key={notification.id}
                className={`group relative flex flex-col sm:flex-row items-start justify-between gap-4 rounded-2xl border p-5 transition-all duration-150 ${
                  notification.isRead
                    ? "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
                    : "border-blue-200 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/10"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner ${
                      notification.isRead
                        ? "bg-slate-100 text-slate-500"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-bold ${
                          notification.isRead ? "text-slate-800" : "text-slate-950"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
                      {notification.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {isQuoteNotification && (
                        <Link
                          href="/account/quotes"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          <span>View Quote</span>
                          <ArrowRight size={12} />
                        </Link>
                      )}
                      {isBookingNotification && !isQuoteNotification && (
                        <Link
                          href="/account/bookings"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          <span>View Booking</span>
                          <ArrowRight size={12} />
                        </Link>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock size={12} />
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Action Controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-1">
                  {!notification.isRead && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                      aria-label="Mark as read"
                      className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition disabled:opacity-50"
                    >
                      <Check size={13} strokeWidth={2.5} />
                      <span>Read</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => deleteNotification(notification.id)}
                    title="Clear notification"
                    aria-label="Clear notification"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
