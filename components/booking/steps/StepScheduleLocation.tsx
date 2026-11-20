"use client";

import React from "react";
import { Calendar, MapPin, ArrowLeft, ArrowRight } from "lucide-react";

interface StepScheduleLocationProps {
  preferredDate: string;
  preferredTime: string;
  address: string;
  specialInstructions: string;
  onChangeDate: (val: string) => void;
  onChangeTime: (val: string) => void;
  onChangeAddress: (val: string) => void;
  onChangeSpecialInstructions: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  minimumDate: string;
}

export default function StepScheduleLocation({
  preferredDate,
  preferredTime,
  address,
  specialInstructions,
  onChangeDate,
  onChangeTime,
  onChangeAddress,
  onChangeSpecialInstructions,
  onNext,
  onBack,
  minimumDate,
}: StepScheduleLocationProps) {
  const isFormValid =
    preferredDate.trim().length > 0 &&
    preferredTime.trim().length > 0 &&
    address.trim().length >= 5;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Step 3: Schedule &amp; Service Location</h2>
        <p className="mt-1 text-sm text-slate-500">
          When and where would you like the service performed or collected?
        </p>
      </div>

      {/* Date & Time Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          <Calendar size={18} className="text-blue-700 shrink-0" />
          <span>Preferred Service Time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="w-full min-w-0">
            <label
              htmlFor="preferredDate"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Preferred Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="preferredDate"
              type="date"
              required
              min={minimumDate}
              value={preferredDate}
              onChange={(e) => onChangeDate(e.target.value)}
              className="mt-2 block w-full max-w-full min-w-0 box-border rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 sm:px-4 py-3 text-sm text-slate-900 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="w-full min-w-0">
            <label
              htmlFor="preferredTime"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700"
            >
              Preferred Time <span className="text-rose-500">*</span>
            </label>
            <input
              id="preferredTime"
              type="time"
              required
              value={preferredTime}
              onChange={(e) => onChangeTime(e.target.value)}
              className="mt-2 block w-full max-w-full min-w-0 box-border rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 sm:px-4 py-3 text-sm text-slate-900 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Note: This is your desired window. Our operations desk will confirm exact crew availability upon reviewing your request.
        </p>
      </div>

      {/* Location / Address */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          <MapPin size={18} className="text-blue-700 shrink-0" />
          <span>Service Address &amp; Directions</span>
        </div>

        <div className="w-full min-w-0">
          <label
            htmlFor="address"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Physical Address / Landmark <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="address"
            required
            rows={3}
            minLength={5}
            maxLength={500}
            value={address}
            onChange={(e) => onChangeAddress(e.target.value)}
            placeholder="e.g. House No. 24, Kofi Annan Street, Airport Residential Area, Accra (Near Nyaho Clinic)..."
            className="mt-2 block w-full max-w-full min-w-0 box-border rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 sm:px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-xs text-slate-400">
            Include neighbourhood, prominent landmark, or GhanaPost GPS digital address if available.
          </p>
        </div>

        <div className="w-full min-w-0">
          <label
            htmlFor="specialInstructions"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Access or Special Instructions <span className="text-xs font-normal text-slate-400">(Optional)</span>
          </label>
          <textarea
            id="specialInstructions"
            rows={2}
            maxLength={2000}
            value={specialInstructions}
            onChange={(e) => onChangeSpecialInstructions(e.target.value)}
            placeholder="e.g. Ring the gate bell, security clearance needed at estate gate, water supply available on-site..."
            className="mt-2 block w-full max-w-full min-w-0 box-border rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 sm:px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t-2 border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-extrabold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs active:scale-[0.99]"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button
          type="button"
          disabled={!isFormValid}
          onClick={onNext}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#031c43] px-6 sm:px-7 py-3.5 sm:py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          <span>Review Booking Request</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
