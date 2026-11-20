"use client";

import React from "react";
import { LaundryDetails } from "@/lib/booking-types";

interface LaundryQuestionsProps {
  serviceName?: string;
  data: LaundryDetails;
  onChange: (updates: Partial<LaundryDetails>) => void;
}

const SERVICE_TYPES = [
  {
    id: "wash_and_fold",
    label: "Wash & Fold",
    desc: "Washed, tumble-dried, and neatly folded",
  },
  {
    id: "wash_and_iron",
    label: "Wash & Iron",
    desc: "Full wash, tumble-dry, and crisp steam ironing",
  },
  {
    id: "ironing_only",
    label: "Ironing Only",
    desc: "Professional pressing for already cleaned garments",
  },
  {
    id: "dry_cleaning",
    label: "Delicate / Dry Cleaning",
    desc: "Specialty fabric care for suits, gowns, and silks",
  },
  {
    id: "other",
    label: "Custom / Mixed",
    desc: "Mixed bundle requiring multiple garment treatments",
  },
] as const;

const QUANTITIES = [
  { id: "1_to_2_bags", label: "1 – 2 standard bags (~5-10kg)" },
  { id: "3_to_5_bags", label: "3 – 5 standard bags (~15-25kg)" },
  { id: "large_bulk", label: "Bulk / Large load (25kg+)" },
  { id: "baskets", label: "1 – 2 laundry baskets" },
  { id: "not_sure", label: "Not sure / Weigh on collection" },
] as const;

const ITEM_OPTIONS = [
  "Everyday clothing (shirts, trousers, dresses)",
  "Bed linens & sheets",
  "Towels & bath mats",
  "Heavy blankets & duvets",
  "Curtains & drapes",
  "Delicate fabrics (wool, silk, linen)",
] as const;

const COLLECTION_OPTIONS = [
  {
    id: "pickup_and_delivery",
    title: "Doorstep Pickup & Return Delivery",
    desc: "We collect from your address and return clean, crisp clothes",
  },
  {
    id: "drop_off_at_hub",
    title: "Drop-off at SAMB's Office / Laundry Hub",
    desc: "You bring the laundry to our local facility directly",
  },
] as const;

export default function LaundryQuestions({
  data,
  onChange,
}: LaundryQuestionsProps) {
  const toggleItem = (item: string) => {
    const current = data.itemTypes || [];
    if (current.includes(item)) {
      onChange({ itemTypes: current.filter((i) => i !== item) });
    } else {
      onChange({ itemTypes: [...current, item] });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Laundry Treatment Mode */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Garment Care &amp; Pressing Preference
        </label>
        <p className="mt-0.5 text-xs text-slate-500">
          Choose the primary treatment for your garments in this booking.
        </p>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          {SERVICE_TYPES.map((type) => {
            const isSelected = data.laundryServiceType === type.id;
            return (
              <div
                key={type.id}
                onClick={() => onChange({ laundryServiceType: type.id })}
                className={`cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-150 ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-bold text-slate-900">{type.label}</p>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  {type.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Estimated quantity */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Estimated Laundry Volume / Weight
        </label>
        <select
          value={data.quantityEstimated || ""}
          onChange={(e) =>
            onChange({
              quantityEstimated: (e.target.value ||
                undefined) as LaundryDetails["quantityEstimated"],
            })
          }
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select approximate quantity</option>
          {QUANTITIES.map((q) => (
            <option key={q.id} value={q.id}>
              {q.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Types of items */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Types of Items Included (Select all that apply)
        </label>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {ITEM_OPTIONS.map((item) => {
            const checked = (data.itemTypes || []).includes(item);
            return (
              <label
                key={item}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-medium cursor-pointer transition ${
                  checked
                    ? "border-blue-900 bg-blue-50/70 text-blue-950 font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(item)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                />
                <span>{item}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Collection / Delivery preference */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Collection &amp; Delivery Logistics
        </label>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          {COLLECTION_OPTIONS.map((opt) => {
            const isSelected = data.collectionPreference === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => onChange({ collectionPreference: opt.id })}
                className={`cursor-pointer rounded-xl border-2 p-3.5 transition ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-bold text-slate-900">{opt.title}</p>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                  {opt.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Fabric care or stain notes */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
          Special Stains or Fabric Care Instructions{" "}
          <span className="text-xs font-normal text-slate-500">(Optional)</span>
        </label>
        <textarea
          rows={3}
          value={data.fabricOrStainNotes || ""}
          onChange={(e) => onChange({ fabricOrStainNotes: e.target.value })}
          placeholder="e.g. Red wine on linen shirt, oil stain on collar, delicate silk requires cold cycle only..."
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal transition focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}
