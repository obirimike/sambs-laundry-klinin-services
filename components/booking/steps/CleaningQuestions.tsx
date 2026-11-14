"use client";

import React, { useEffect } from "react";
import { CleaningDetails } from "@/lib/booking-types";

interface CleaningQuestionsProps {
  serviceName?: string;
  data: CleaningDetails;
  onChange: (updates: Partial<CleaningDetails>) => void;
}

export default function CleaningQuestions({
  serviceName,
  data,
  onChange,
}: CleaningQuestionsProps) {
  // Infer internal cleaningType from serviceName if not yet set
  useEffect(() => {
    if (!data.cleaningType && serviceName) {
      const lower = serviceName.toLowerCase();
      if (lower.includes("deep")) {
        onChange({ cleaningType: "deep_clean" });
      } else if (lower.includes("post-construction")) {
        onChange({ cleaningType: "post_construction" });
      } else if (lower.includes("move-in") || lower.includes("move-out")) {
        onChange({ cleaningType: "move_in_out" });
      } else if (lower.includes("office") || lower.includes("commercial")) {
        onChange({ cleaningType: "office_commercial" });
      } else {
        onChange({ cleaningType: "standard" });
      }
    }
  }, [serviceName, data.cleaningType, onChange]);

  const frequencies = [
    { id: "one_time", label: "One-Off Service", desc: "Single comprehensive session" },
    { id: "weekly", label: "Weekly Regular", desc: "Discounted recurring visit" },
    { id: "bi_weekly", label: "Bi-Weekly", desc: "Every two weeks" },
    { id: "monthly", label: "Monthly Maintenance", desc: "Once a month deep refresh" },
  ];

  const propertyTypes = [
    "Residential Apartment / Flat",
    "Self-contained House / Villa",
    "Office / Commercial Suite",
    "Retail Store / Showroom",
    "Event Venue / Hall",
    "Warehouse / Compound",
    "Other",
  ];

  const sizeOptions = [
    "Compact (Under 70 sqm / 750 sqft)",
    "Medium (70 – 150 sqm / 750 – 1,600 sqft)",
    "Large (150 – 300 sqm / 1,600 – 3,200 sqft)",
    "Extensive / Multi-Floor Estate (300+ sqm / 3,200+ sqft)",
  ];

  const focusAreaOptions = [
    "Kitchen, grease extraction & oven scrub",
    "Bathrooms, limescale & tile descaling",
    "Interior & exterior window glass",
    "Upholstery, sofas, & mattresses",
    "Balcony, terrace, & patio pressure wash",
    "Refrigerator & microwave interior sanitization",
    "Baseboards, door frames, & light fixtures",
    "Wardrobes & cupboard interior wiping",
  ];

  const toggleFocusArea = (area: string) => {
    const current = data.focusAreas || [];
    if (current.includes(area)) {
      onChange({ focusAreas: current.filter((a) => a !== area) });
    } else {
      onChange({ focusAreas: [...current, area] });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Service Frequency */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Service Frequency
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          How often do you require this cleaning service?
        </p>
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {frequencies.map((f) => {
            const isSelected = data.frequency === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ frequency: f.id as any })}
                className={`rounded-xl border-2 py-3 px-3 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-xs font-black text-slate-900">{f.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 font-medium hidden sm:block">{f.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Property Type & Number of Rooms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
            Property Type
          </label>
          <select
            value={data.propertyType || ""}
            onChange={(e) => onChange({ propertyType: e.target.value })}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select property type</option>
            {propertyTypes.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
            Number of Rooms / Offices
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={data.numberOfRooms ?? ""}
            onChange={(e) =>
              onChange({
                numberOfRooms: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="e.g. 3 bedrooms + living room"
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* 3. Estimated Property Size */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Estimated Floor Area / Property Size
        </label>
        <select
          value={data.estimatedSize || ""}
          onChange={(e) => onChange({ estimatedSize: e.target.value })}
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select approximate floor area</option>
          {sizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Priority Focus Areas */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Priority Focus Areas &amp; Special Attention (Select all that apply)
        </label>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {focusAreaOptions.map((area) => {
            const checked = (data.focusAreas || []).includes(area);
            return (
              <label
                key={area}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-medium cursor-pointer transition ${
                  checked
                    ? "border-blue-900 bg-blue-50/70 text-blue-950 font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFocusArea(area)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <span>{area}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
