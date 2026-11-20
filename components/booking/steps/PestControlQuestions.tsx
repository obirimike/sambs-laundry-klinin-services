"use client";

import React from "react";
import { PestControlDetails } from "@/lib/booking-types";

interface PestControlQuestionsProps {
  serviceName?: string;
  data: PestControlDetails;
  onChange: (updates: Partial<PestControlDetails>) => void;
}

const COMMON_PESTS = [
  "Cockroaches",
  "Termites & Wood Borers",
  "Bed Bugs",
  "Rodents (Mice / Rats)",
  "Mosquitoes",
  "Ants & Crawling Insects",
  "Fleas & Ticks",
  "Flies & Flying Insects",
] as const;

const SEVERITY_LEVELS = [
  {
    id: "early_preventive",
    label: "Preventive / Early Stage",
    desc: "Routine fumigation or minor occasional sightings",
  },
  {
    id: "moderate",
    label: "Noticeable Infestation",
    desc: "Frequent sightings in kitchen, drains, or rooms",
  },
  {
    id: "severe_urgent",
    label: "Severe / Urgent Outbreak",
    desc: "Heavy infestation requiring intense eradication",
  },
] as const;

const TREATMENT_SCOPES = [
  { id: "indoor_only", label: "Indoor Only" },
  { id: "outdoor_only", label: "Compound / Yard Only" },
  { id: "indoor_and_outdoor", label: "Indoor & Outdoor" },
] as const;

const TREATMENT_HISTORY = [
  { id: "never", label: "Never Fumigated" },
  { id: "within_6_months", label: "Within Last 6 Months" },
  { id: "over_6_months_ago", label: "Over 6 Months Ago" },
] as const;

export default function PestControlQuestions({
  data,
  onChange,
}: PestControlQuestionsProps) {
  const togglePest = (pest: string) => {
    const current = data.pestType || [];
    if (current.includes(pest)) {
      onChange({ pestType: current.filter((p) => p !== pest) });
    } else {
      onChange({ pestType: [...current, pest] });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Target pests */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Target Pests Observed (Select all that apply){" "}
          <span className="text-rose-500">*</span>
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Helps our fumigation team prepare the correct active formulations.
        </p>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {COMMON_PESTS.map((pest) => {
            const checked = (data.pestType || []).includes(pest);
            return (
              <label
                key={pest}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-medium cursor-pointer transition ${
                  checked
                    ? "border-blue-900 bg-blue-50/70 text-blue-950 font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePest(pest)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <span>{pest}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Infestation Severity */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Infestation Severity Level
        </label>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
          {SEVERITY_LEVELS.map((lvl) => {
            const isSelected = data.infestationLevel === lvl.id;
            return (
              <div
                key={lvl.id}
                onClick={() => onChange({ infestationLevel: lvl.id })}
                className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-150 ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-bold text-slate-900">{lvl.label}</p>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  {lvl.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Treatment Area Scope */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Treatment Area Scope
        </label>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {TREATMENT_SCOPES.map((scope) => {
            const isSelected = data.treatmentArea === scope.id;
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => onChange({ treatmentArea: scope.id })}
                className={`rounded-xl border-2 py-2.5 px-3 text-xs font-bold text-center transition-all duration-150 ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/70 text-blue-950 shadow-xs ring-2 ring-blue-900/10"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {scope.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Safety Considerations: Pets / Children */}
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(data.hasPetsOrChildren)}
            onChange={(e) => onChange({ hasPetsOrChildren: e.target.checked })}
            className="mt-0.5 rounded border-amber-400 text-blue-900 focus:ring-blue-900"
          />
          <div>
            <p className="text-xs font-black text-amber-950">
              There are infants, children, or household pets at the premises
            </p>
            <p className="mt-0.5 text-[11px] text-amber-800 font-medium leading-relaxed">
              Our specialists will deploy odorless, non-toxic, or low-toxicity
              botanical solutions where required.
            </p>
          </div>
        </label>
      </div>

      {/* 5. Previous Treatment History */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Previous Fumigation / Treatment History
        </label>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {TREATMENT_HISTORY.map((hist) => {
            const isSelected = data.previousTreatment === hist.id;
            return (
              <button
                key={hist.id}
                type="button"
                onClick={() => onChange({ previousTreatment: hist.id })}
                className={`rounded-xl border-2 py-2.5 px-3 text-xs font-bold text-center transition-all duration-150 ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/70 text-blue-950 shadow-xs ring-2 ring-blue-900/10"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {hist.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
