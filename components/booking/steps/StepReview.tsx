"use client";

import React from "react";
import { ServiceOption } from "./StepServiceSelect";
import {
  LaundryDetails,
  CleaningDetails,
  DomesticSupportDetails,
  PestControlDetails,
} from "@/lib/booking-types";
import { Calendar, MapPin, LoaderCircle, Send, ArrowLeft } from "lucide-react";

interface StepReviewProps {
  selectedService: ServiceOption;
  laundryData: LaundryDetails;
  cleaningData: CleaningDetails;
  domesticData: DomesticSupportDetails;
  pestData: PestControlDetails;
  preferredDate: string;
  preferredTime: string;
  address: string;
  specialInstructions: string;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onEditStep: (stepNumber: 1 | 2 | 3) => void;
}

export default function StepReview({
  selectedService,
  laundryData,
  cleaningData,
  domesticData,
  pestData,
  preferredDate,
  preferredTime,
  address,
  specialInstructions,
  isSubmitting,
  onBack,
  onSubmit,
  onEditStep,
}: StepReviewProps) {
  const renderCategorySummary = () => {
    switch (selectedService.category) {
      case "LAUNDRY":
        return (
          <div className="space-y-2 text-sm text-slate-700">
            {laundryData.laundryServiceType && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service Type:</span>
                <span className="font-semibold capitalize">
                  {laundryData.laundryServiceType.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {laundryData.quantityEstimated && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Load Quantity:</span>
                <span className="font-semibold capitalize">
                  {laundryData.quantityEstimated.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {laundryData.collectionPreference && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Logistics:</span>
                <span className="font-semibold capitalize">
                  {laundryData.collectionPreference.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {laundryData.itemTypes && laundryData.itemTypes.length > 0 && (
              <div className="py-1 border-b border-slate-100">
                <span className="text-slate-500 block mb-1">Items Included:</span>
                <div className="flex flex-wrap gap-1">
                  {laundryData.itemTypes.map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-blue-50 text-blue-800 px-2 py-0.5 text-xs font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {laundryData.fabricOrStainNotes && (
              <div className="py-1">
                <span className="text-slate-500 block">Stain / Fabric Care:</span>
                <p className="mt-1 text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg">
                  &ldquo;{laundryData.fabricOrStainNotes}&rdquo;
                </p>
              </div>
            )}
          </div>
        );

      case "CLEANING":
        return (
          <div className="space-y-2 text-sm text-slate-700">
            {cleaningData.cleaningType && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cleaning Type:</span>
                <span className="font-semibold capitalize">
                  {cleaningData.cleaningType.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {cleaningData.frequency && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Frequency:</span>
                <span className="font-semibold capitalize">
                  {cleaningData.frequency.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {cleaningData.propertyType && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Property Type:</span>
                <span className="font-semibold">{cleaningData.propertyType}</span>
              </div>
            )}
            {cleaningData.numberOfRooms !== undefined && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Number of Rooms:</span>
                <span className="font-semibold">{cleaningData.numberOfRooms}</span>
              </div>
            )}
            {cleaningData.estimatedSize && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Estimated Size:</span>
                <span className="font-semibold">{cleaningData.estimatedSize}</span>
              </div>
            )}
            {cleaningData.focusAreas && cleaningData.focusAreas.length > 0 && (
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Focus Areas:</span>
                <div className="flex flex-wrap gap-1">
                  {cleaningData.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-md bg-blue-50 text-blue-800 px-2 py-0.5 text-xs font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "DOMESTIC_SUPPORT":
        return (
          <div className="space-y-2 text-sm text-slate-700">
            {domesticData.supportType && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Support Type:</span>
                <span className="font-semibold capitalize">
                  {domesticData.supportType.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {domesticData.frequency && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Frequency:</span>
                <span className="font-semibold capitalize">
                  {domesticData.frequency.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {domesticData.schedulePreference && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Working Schedule:</span>
                <span className="font-semibold capitalize">
                  {domesticData.schedulePreference.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {domesticData.estimatedHours !== undefined && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Estimated Duration:</span>
                <span className="font-semibold">{domesticData.estimatedHours} hrs / session</span>
              </div>
            )}
            {domesticData.specificRequirements && (
              <div className="py-1">
                <span className="text-slate-500 block">Household Instructions:</span>
                <p className="mt-1 text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg">
                  &ldquo;{domesticData.specificRequirements}&rdquo;
                </p>
              </div>
            )}
          </div>
        );

      case "PEST_CONTROL":
        return (
          <div className="space-y-2 text-sm text-slate-700">
            {pestData.pestType && pestData.pestType.length > 0 && (
              <div className="py-1 border-b border-slate-100">
                <span className="text-slate-500 block mb-1">Target Pests:</span>
                <div className="flex flex-wrap gap-1">
                  {pestData.pestType.map((pest) => (
                    <span
                      key={pest}
                      className="rounded-md bg-amber-50 text-amber-800 px-2 py-0.5 text-xs font-semibold"
                    >
                      {pest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {pestData.infestationLevel && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Infestation Level:</span>
                <span className="font-semibold capitalize">
                  {pestData.infestationLevel.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {pestData.treatmentArea && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Treatment Area:</span>
                <span className="font-semibold capitalize">
                  {pestData.treatmentArea.replace(/_/g, " ")}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Children / Pets Present:</span>
              <span className="font-semibold">{pestData.hasPetsOrChildren ? "Yes" : "No"}</span>
            </div>
            {pestData.previousTreatment && (
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Previous Treatment:</span>
                <span className="font-semibold capitalize">
                  {pestData.previousTreatment.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Step 4: Review &amp; Confirm Request</h2>
        <p className="mt-1 text-sm text-slate-500">
          Please review the summary of your request before submitting.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Service & Details Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Service &amp; Scope
              </span>
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Change
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">{selectedService.name}</h3>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mt-0.5">
                {selectedService.category.replace(/_/g, " ")}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Custom Answers:</span>
                <button
                  type="button"
                  onClick={() => onEditStep(2)}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Edit Answers
                </button>
              </div>
              {renderCategorySummary()}
            </div>
          </div>
        </div>

        {/* Schedule & Address Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Schedule &amp; Address
              </span>
              <button
                type="button"
                onClick={() => onEditStep(3)}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-2.5">
                <Calendar size={18} className="text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">Preferred Date &amp; Time</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {preferredDate} at {preferredTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin size={18} className="text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">Service Location</p>
                  <p className="mt-0.5 whitespace-pre-wrap font-medium text-slate-800">
                    {address}
                  </p>
                </div>
              </div>

              {specialInstructions && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500">Special Instructions:</p>
                  <p className="mt-1 text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg whitespace-pre-wrap">
                    {specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing / Process Disclaimer */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-relaxed text-blue-900">
        <p className="font-bold">Next Steps upon submission:</p>
        <p className="mt-1 text-blue-800">
          Submitting this booking request notifies our dispatch team. We will review your service details, confirm schedule availability, and discuss exact pricing / quote with you prior to assignment.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t-2 border-slate-200">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-extrabold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs active:scale-[0.99] disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#031c43] px-7 py-3.5 sm:py-3 text-sm font-black text-white shadow-md transition hover:bg-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              <span>Submitting Booking Request...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Confirm &amp; Submit Request</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
