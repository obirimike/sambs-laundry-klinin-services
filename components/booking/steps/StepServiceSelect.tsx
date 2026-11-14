"use client";

import React from "react";
import { ServiceCategory } from "@/types/service";
import { WashingMachine, Sparkles, Home, Bug, Check, ArrowRight, ShieldCheck } from "lucide-react";

export type ServiceOption = {
  id: string;
  name: string;
  category: ServiceCategory;
  slug?: string;
  description?: string;
};

interface StepServiceSelectProps {
  services: ServiceOption[];
  selectedCategory: ServiceCategory | null;
  onSelectCategory: (category: ServiceCategory) => void;
  onNext: () => void;
}

export default function StepServiceSelect({
  services,
  selectedCategory,
  onSelectCategory,
  onNext,
}: StepServiceSelectProps) {
  const categories: {
    id: ServiceCategory;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    colorBadge: string;
    highlights: string[];
  }[] = [
    {
      id: "LAUNDRY",
      title: "Laundry & Fabric Care",
      subtitle: "Professional washing, precise steam ironing, dry cleaning, and delicate fabric care",
      icon: <WashingMachine size={26} className="text-sky-700" />,
      colorBadge: "bg-sky-100 text-sky-900 border-sky-300",
      highlights: ["Wash & Fold", "Wash & Iron", "Delicate Dry Cleaning", "Pickup & Delivery"],
    },
    {
      id: "CLEANING",
      title: "Cleaning Services",
      subtitle: "Comprehensive deep cleaning, routine sanitation, move-in/out, and commercial properties",
      icon: <Sparkles size={26} className="text-blue-800" />,
      colorBadge: "bg-blue-100 text-blue-900 border-blue-300",
      highlights: ["Deep Cleaning", "Move-In / Move-Out", "Post-Construction", "Offices & Homes"],
    },
    {
      id: "DOMESTIC_SUPPORT",
      title: "Domestic & House Help",
      subtitle: "Vetted household helpers, housekeeping, cooking, meal prep, and daily assistance",
      icon: <Home size={26} className="text-emerald-800" />,
      colorBadge: "bg-emerald-100 text-emerald-900 border-emerald-300",
      highlights: ["Domestic Helpers", "Cooking & Meal Prep", "Housekeeping", "Flexible Shifts"],
    },
    {
      id: "PEST_CONTROL",
      title: "Pest Control & Fumigation",
      subtitle: "Targeted eradication for crawling insects, rodents, termites, and preventive treatments",
      icon: <Bug size={26} className="text-amber-800" />,
      colorBadge: "bg-amber-100 text-amber-900 border-amber-300",
      highlights: ["Crawling Insects", "Termite Control", "Rodent Eradication", "Safe Formulations"],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#031c43] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white">
            Step 1 of 4
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Service Categorization
          </span>
        </div>
        <h2 className="mt-2.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Choose Your Type of Service
        </h2>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-600">
          Select the service category you need. In the next step, you will choose your exact service package and tailor its specifications.
        </p>
      </div>

      {/* Category Selection Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = services.filter((s) => s.category === cat.id).length;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 sm:p-6 cursor-pointer transition-all duration-150 ${
                isSelected
                  ? "border-[#031c43] bg-blue-50/70 shadow-md ring-2 ring-[#031c43]/15"
                  : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition ${
                      isSelected
                        ? "border-[#031c43] bg-white shadow-xs"
                        : "border-slate-200 bg-slate-50 group-hover:bg-white"
                    }`}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cat.colorBadge}`}
                    >
                      {count} {count === 1 ? "service" : "services"}
                    </span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                        isSelected
                          ? "bg-[#031c43] text-white shadow-xs"
                          : "border-2 border-slate-300 bg-white text-transparent group-hover:border-slate-400"
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-black text-slate-900">
                    {cat.title}
                  </h3>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              {/* Highlights pills */}
              <div className="mt-5 border-t border-slate-200/80 pt-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Popular in this category
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-lg bg-slate-100/90 px-2 py-0.5 text-[11px] font-bold text-slate-700"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs font-medium text-slate-600">
        <ShieldCheck size={20} className="shrink-0 text-emerald-700" />
        <span>
          All SAMB services are covered by our customer satisfaction guarantee, verified staff, and transparent upfront pricing.
        </span>
      </div>

      {/* Continue Action */}
      <div className="flex justify-end pt-4 border-t-2 border-slate-200">
        <button
          type="button"
          disabled={!selectedCategory}
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-[#031c43] px-7 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>
            {selectedCategory
              ? `Continue with ${categories.find((c) => c.id === selectedCategory)?.title}`
              : "Select a Category to Continue"}
          </span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
