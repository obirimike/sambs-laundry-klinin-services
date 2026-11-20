"use client";

import React, { useEffect } from "react";
import { DomesticSupportDetails } from "@/lib/booking-types";

interface DomesticSupportQuestionsProps {
  serviceName?: string;
  data: DomesticSupportDetails;
  onChange: (updates: Partial<DomesticSupportDetails>) => void;
}

const FREQUENCIES = [
  { id: "one_off", label: "One-Off Assistance", desc: "Single day or event helper" },
  { id: "daily", label: "Daily (Mon – Fri)", desc: "Consistent weekday domestic support" },
  { id: "weekly_recurring", label: "Part-Time (2–3 days/wk)", desc: "Selected days each week" },
  { id: "live_in", label: "Live-In Housekeeper", desc: "Permanent residing assistant" },
] as const;

const SCHEDULES = [
  { id: "morning", label: "Morning Shift (8:00 AM – 12:00 PM)" },
  { id: "afternoon", label: "Afternoon Shift (12:00 PM – 4:00 PM)" },
  { id: "full_day", label: "Full Day Shift (8:00 AM – 5:00 PM)" },
  { id: "flexible", label: "Flexible / Custom Hours" },
] as const;

export default function DomesticSupportQuestions({
  serviceName,
  data,
  onChange,
}: DomesticSupportQuestionsProps) {
  // Infer internal supportType from serviceName if not yet set
  useEffect(() => {
    if (!data.supportType && serviceName) {
      const lower = serviceName.toLowerCase();
      if (lower.includes("cook") || lower.includes("meal")) {
        onChange({ supportType: "meal_prep_cooking" });
      } else {
        onChange({ supportType: "general_housekeeping" });
      }
    }
  }, [serviceName, data.supportType, onChange]);

  return (
    <div className="space-y-6">
      {/* 1. Frequency & Schedule */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
            Engagement Frequency
          </label>
          <select
            value={data.frequency || ""}
            onChange={(e) =>
              onChange({
                frequency: (e.target.value ||
                  undefined) as DomesticSupportDetails["frequency"],
              })
            }
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select frequency</option>
            {FREQUENCIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} — {f.desc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
            Preferred Working Shift / Schedule
          </label>
          <select
            value={data.schedulePreference || ""}
            onChange={(e) =>
              onChange({
                schedulePreference: (e.target.value ||
                  undefined) as DomesticSupportDetails["schedulePreference"],
              })
            }
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select shift schedule</option>
            {SCHEDULES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Estimated hours needed */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Estimated Hours per Visit / Session{" "}
          <span className="text-xs font-normal text-slate-500">(Optional)</span>
        </label>
        <input
          type="number"
          min={1}
          max={24}
          value={data.estimatedHours ?? ""}
          onChange={(e) =>
            onChange({
              estimatedHours: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="e.g. 5 hours"
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* 3. Specific household requirements */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Specific Household Requirements &amp; Routines{" "}
          <span className="text-xs font-normal text-slate-500">(Optional)</span>
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Note any dietary preferences, children or pets in the home, special
          laundry care, or compound duties.
        </p>
        <textarea
          rows={4}
          value={data.specificRequirements || ""}
          onChange={(e) => onChange({ specificRequirements: e.target.value })}
          placeholder="e.g. Need help with daily cooking for family of 4 (low sodium), general kitchen cleaning, and child supervision after 3 PM..."
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}
