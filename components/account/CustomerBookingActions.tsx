"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  Trash2,
  CalendarClock,
  RotateCcw,
  AlertTriangle,
  LoaderCircle,
  Lock,
  PhoneCall,
  Calendar,
  Clock,
  X,
  CheckCircle2,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal, { FeedbackVariant } from "@/components/ui/FeedbackModal";

interface CustomerBookingActionsProps {
  bookingId: string;
  bookingNumber: string;
  status: string;
  serviceName: string;
  currentDate?: string;
  currentTime?: string;
  compact?: boolean;
  onDeleted?: () => void;
}

export default function CustomerBookingActions({
  bookingId,
  bookingNumber,
  status,
  serviceName,
  currentDate,
  currentTime,
  compact = false,
  onDeleted,
}: CustomerBookingActionsProps) {
  const router = useRouter();

  // Modals state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [cancelReason, setCancelReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState(currentTime || "10:00");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Feedback modal state
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: FeedbackVariant;
    title: string;
    message: string;
    redirectTo?: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  const isBeforeWorkStarts = status === "PENDING" || status === "CONFIRMED";
  const isInProgress = status === "IN_PROGRESS";
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";

  // Compute minimum selectable date (today in YYYY-MM-DD)
  const today = new Date();
  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const popularTimes = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  // Handle Cancel Booking
  const handleConfirmCancel = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: cancelReason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Cancellation Failed",
          message: data.message || "Unable to cancel booking.",
        });
        return;
      }

      setShowCancelModal(false);
      setCancelReason("");
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Booking Cancelled",
        message:
          data.message ||
          `Your booking #${bookingNumber} (${serviceName}) has been cancelled.`,
      });
      router.refresh();
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Network Error",
        message: "A network issue occurred. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reschedule Booking
  const handleConfirmReschedule = async () => {
    if (!newDate || !newTime) {
      setFormError("Please select both a new preferred date and time.");
      return;
    }

    if (newDate < minimumDate) {
      setFormError("The selected date cannot be in the past.");
      return;
    }

    setFormError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          preferredDate: newDate,
          preferredTime: newTime,
          reason: rescheduleReason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.message || "Unable to reschedule booking.");
        return;
      }

      setShowRescheduleModal(false);
      setNewDate("");
      setRescheduleReason("");
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Booking Rescheduled",
        message:
          data.message ||
          `Your booking #${bookingNumber} has been successfully rescheduled.`,
      });
      router.refresh();
    } catch {
      setFormError("A network issue occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Booking
  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setShowDeleteModal(false);
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Deletion Failed",
          message: data.message || "Unable to delete booking.",
        });
        return;
      }

      setShowDeleteModal(false);
      if (onDeleted) {
        onDeleted();
      }
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Booking Record Deleted",
        message:
          data.message ||
          `Booking #${bookingNumber} was permanently removed from your account history.`,
        redirectTo: "/account/bookings",
      });
      router.refresh();
    } catch {
      setShowDeleteModal(false);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Network Error",
        message: "A network issue occurred. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 1. IN PROGRESS STATE: Actions locked
  if (isInProgress) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
          <Lock size={12} className="text-amber-700" />
          <span>In Progress (Locked)</span>
        </span>
      );
    }

    return (
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-4.5 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
            <Lock size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-amber-950">
              Service Work In Progress
            </h4>
            <p className="mt-1 text-xs font-medium leading-relaxed text-amber-900">
              This service is actively being carried out by our team. For safety, billing, and scheduling continuity, online rescheduling, cancellations, and deletions are locked once work has started.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <a
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-950 transition"
              >
                <PhoneCall size={13} />
                <span>Contact Customer Care</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPACT VIEW (For list cards on /account/bookings)
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Book Again (For completed or cancelled bookings) */}
        {(isCompleted || isCancelled) && (
          <Link
            href={`/book?repeat=${bookingId}`}
            title="Book This Service Again"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#031c43] px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-950 transition shadow-2xs"
          >
            <RotateCcw size={12} />
            <span>Book Again</span>
          </Link>
        )}

        {/* Reschedule button before work starts */}
        {isBeforeWorkStarts && (
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowRescheduleModal(true);
            }}
            title="Reschedule Appointment Date/Time"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50/80 px-2.5 py-1.5 text-xs font-bold text-blue-950 hover:bg-blue-100 transition shadow-2xs"
          >
            <CalendarClock size={13} className="text-blue-800" />
            <span>Reschedule</span>
          </button>
        )}

        {/* Cancel button before work starts */}
        {isBeforeWorkStarts && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            title="Cancel Booking"
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50/70 px-2.5 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition shadow-2xs"
          >
            <Ban size={12} />
            <span>Cancel</span>
          </button>
        )}

        {/* Delete button (available before work starts, when completed, or when cancelled) */}
        {(isBeforeWorkStarts || isCompleted || isCancelled) && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            title="Delete Booking Record"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800 transition shadow-2xs"
          >
            <Trash2 size={12} />
            <span className="sr-only sm:not-sr-only">Delete</span>
          </button>
        )}

        {/* Modals */}
        {renderModals()}
      </div>
    );
  }

  // 3. FULL VIEW (For details page /account/bookings/[id])
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            Booking Actions &amp; Options
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-600">
            {isBeforeWorkStarts &&
              "Need to change the date or cancel? You can reschedule, cancel, or delete this request before work starts."}
            {isCompleted &&
              "Loved this service? You can quickly re-book with the same preferences, or delete this record from your history."}
            {isCancelled &&
              "This booking is cancelled. You can re-order with the same details, or delete this record permanently."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Book Again button (Feature 1) */}
          {(isCompleted || isCancelled) && (
            <Link
              href={`/book?repeat=${bookingId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#031c43] px-4.5 py-2.5 text-xs font-black text-white hover:bg-blue-950 transition shadow-xs"
            >
              <RotateCcw size={15} />
              <span>Book This Service Again</span>
            </Link>
          )}

          {/* Reschedule Button (Feature 2) */}
          {isBeforeWorkStarts && (
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setShowRescheduleModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-blue-900 bg-blue-50/70 px-4 py-2.5 text-xs font-black text-blue-950 hover:bg-blue-100 transition shadow-2xs"
            >
              <CalendarClock size={15} className="text-blue-900" />
              <span>Reschedule Date &amp; Time</span>
            </button>
          )}

          {/* Cancel Booking Button */}
          {isBeforeWorkStarts && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-black text-rose-900 hover:bg-rose-100 hover:border-rose-400 transition shadow-2xs"
            >
              <Ban size={15} />
              <span>Cancel Booking</span>
            </button>
          )}

          {/* Delete Booking Button */}
          {(isBeforeWorkStarts || isCompleted || isCancelled) && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-900 transition shadow-2xs"
            >
              <Trash2 size={15} />
              <span>
                {isCompleted || isCancelled ? "Delete Record" : "Delete Request"}
              </span>
            </button>
          )}
        </div>
      </div>

      {renderModals()}
    </div>
  );

  // Helper to render Reschedule, Cancel, Delete, and Feedback Modals
  function renderModals() {
    return (
      <>
        {/* RESCHEDULE MODAL */}
        {showRescheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-900">
                  <CalendarClock size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoading) {
                      setShowRescheduleModal(false);
                      setFormError("");
                    }
                  }}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-black text-slate-900">
                  Reschedule Appointment
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-600 leading-relaxed">
                  Choose your new preferred service date and time for booking{" "}
                  <span className="font-mono font-bold text-slate-900">
                    #{bookingNumber}
                  </span>{" "}
                  ({serviceName}).
                </p>

                {currentDate && currentTime && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <span className="font-bold text-slate-500">Current schedule:</span>
                    <span className="font-semibold text-slate-900">
                      {currentDate} at {currentTime}
                    </span>
                  </div>
                )}
              </div>

              {formError && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                  {formError}
                </div>
              )}

              <div className="mt-4 space-y-3.5">
                {/* Date Input */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    New Preferred Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={minimumDate}
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Time Input / Dropdown */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    New Preferred Time <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-900 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {popularTimes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                    Rescheduling Note <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="e.g. Schedule conflict on original day, postponed event..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowRescheduleModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirmReschedule}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#031c43] px-5 py-2.5 text-xs font-black text-white hover:bg-blue-950 transition shadow-sm disabled:opacity-50"
                >
                  {isLoading && <LoaderCircle size={14} className="animate-spin" />}
                  <span>Confirm Reschedule</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL MODAL */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <AlertTriangle size={24} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoading) {
                      setShowCancelModal(false);
                      setCancelReason("");
                    }
                  }}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-black text-slate-900">
                  Cancel Booking?
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-600 leading-relaxed">
                  Are you sure you want to cancel booking{" "}
                  <span className="font-mono font-bold text-slate-900">
                    #{bookingNumber}
                  </span>{" "}
                  for <span className="font-bold text-slate-900">{serviceName}</span>?
                  Our operations team will be notified immediately.
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Reason for Cancellation <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, booked by mistake, requested date needs to change..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirmCancel}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
                >
                  {isLoading && <LoaderCircle size={14} className="animate-spin" />}
                  <span>Yes, Cancel Booking</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Booking Record"
          description={`Are you sure you want to permanently delete booking #${bookingNumber} (${serviceName}) from your account history?`}
          consequences="This action cannot be undone. All details, notes, and records associated with this booking will be removed."
          confirmText="Yes, Delete Permanently"
          cancelText="Keep Record"
          isDestructive={true}
          isLoading={isLoading}
        />

        {/* FEEDBACK MODAL */}
        <FeedbackModal
          isOpen={feedback.isOpen}
          onClose={() => {
            setFeedback((p) => ({ ...p, isOpen: false }));
            if (feedback.redirectTo) {
              router.push(feedback.redirectTo);
            }
          }}
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          referenceNumber={bookingNumber}
          referenceLabel="Booking Reference"
          primaryAction={{
            label: feedback.redirectTo ? "View My Bookings" : "Dismiss",
            onClick: () => {
              setFeedback((p) => ({ ...p, isOpen: false }));
              if (feedback.redirectTo) {
                router.push(feedback.redirectTo);
              }
            },
          }}
        />
      </>
    );
  }
}
