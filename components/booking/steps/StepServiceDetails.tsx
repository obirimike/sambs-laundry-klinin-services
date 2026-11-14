"use client";

import React, { useState, useEffect } from "react";
import { ServiceCategory } from "@/types/service";
import { ServiceOption } from "./StepServiceSelect";
import {
  LaundryDetails,
  CleaningDetails,
  DomesticSupportDetails,
  PestControlDetails,
} from "@/lib/booking-types";
import LaundryQuestions from "./LaundryQuestions";
import CleaningQuestions from "./CleaningQuestions";
import DomesticSupportQuestions from "./DomesticSupportQuestions";
import PestControlQuestions from "./PestControlQuestions";
import {
  WashingMachine,
  Sparkles,
  Home,
  Bug,
  Check,
  Search,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface StepServiceDetailsProps {
  services: ServiceOption[];
  selectedCategory: ServiceCategory;
  selectedServiceId: string;
  onSelectService: (service: ServiceOption) => void;
  laundryData: LaundryDetails;
  cleaningData: CleaningDetails;
  domesticData: DomesticSupportDetails;
  pestData: PestControlDetails;
  onUpdateLaundry: (updates: Partial<LaundryDetails>) => void;
  onUpdateCleaning: (updates: Partial<CleaningDetails>) => void;
  onUpdateDomestic: (updates: Partial<DomesticSupportDetails>) => void;
  onUpdatePest: (updates: Partial<PestControlDetails>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepServiceDetails({
  services,
  selectedCategory,
  selectedServiceId,
  onSelectService,
  laundryData,
  cleaningData,
  domesticData,
  pestData,
  onUpdateLaundry,
  onUpdateCleaning,
  onUpdateDomestic,
  onUpdatePest,
  onNext,
  onBack,
}: StepServiceDetailsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Services matching selected category
  const servicesInCategory = services.filter((s) => s.category === selectedCategory);

  // Auto-select first service in category if current selectedService does not belong to this category
  useEffect(() => {
    const isCurrentlyInCategory = servicesInCategory.some((s) => s.id === selectedServiceId);
    if (!isCurrentlyInCategory && servicesInCategory.length > 0) {
      onSelectService(servicesInCategory[0]);
    }
  }, [selectedCategory, servicesInCategory, selectedServiceId, onSelectService]);

  const filteredServices = servicesInCategory.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
  });

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const getCategoryMeta = () => {
    switch (selectedCategory) {
      case "LAUNDRY":
        return {
          title: "Laundry & Fabric Care",
          badge: "Laundry Service",
          icon: <WashingMachine size={24} className="text-sky-700" />,
          colorBadge: "bg-sky-100 text-sky-900 border-sky-300",
        };
      case "DOMESTIC_SUPPORT":
        return {
          title: "Domestic & House Help",
          badge: "Domestic Support",
          icon: <Home size={24} className="text-emerald-700" />,
          colorBadge: "bg-emerald-100 text-emerald-900 border-emerald-300",
        };
      case "PEST_CONTROL":
        return {
          title: "Pest Control & Fumigation",
          badge: "Pest Control",
          icon: <Bug size={24} className="text-amber-700" />,
          colorBadge: "bg-amber-100 text-amber-900 border-amber-300",
        };
      case "CLEANING":
      default:
        return {
          title: "Cleaning Services",
          badge: "Cleaning Service",
          icon: <Sparkles size={24} className="text-blue-800" />,
          colorBadge: "bg-blue-100 text-blue-900 border-blue-300",
        };
    }
  };

  const meta = getCategoryMeta();

  return (
    <div className="space-y-8">
      {/* Category Banner with Quick Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
            {meta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Selected Service Category
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${meta.colorBadge}`}>
                {meta.badge}
              </span>
            </div>
            <h3 className="mt-0.5 text-lg font-black text-slate-900 sm:text-xl">
              {meta.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
        >
          <RotateCcw size={13} />
          <span>Change Service Type</span>
        </button>
      </div>

      {/* SECTION 1: Select Specific Service Package */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#031c43] px-3 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                Step 2.1
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Package Selection
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-black text-slate-900 sm:text-2xl">
              Select Your Specific Package
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-600">
              Choose the package that matches your scope of work under {meta.title}.
            </p>
          </div>

          {servicesInCategory.length > 4 && (
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}
        </div>

        {/* Packages Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredServices.length === 0 ? (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No packages match your search query.
            </div>
          ) : (
            filteredServices.map((service) => {
              const isSelected = service.id === selectedServiceId;

              return (
                <div
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className={`relative flex flex-col justify-between rounded-2xl border-2 p-4.5 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "border-[#031c43] bg-blue-50/70 shadow-md ring-2 ring-[#031c43]/15"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {service.name}
                      </h4>
                      {isSelected ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#031c43] text-white shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 bg-white" />
                      )}
                    </div>

                    {service.description && (
                      <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: Service Specifications & Questions (No duplicate question) */}
      {selectedService && (
        <div className="space-y-4 pt-6 border-t-2 border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-white">
                Step 2.2
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Service Specifications
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-black text-slate-900 sm:text-2xl">
              Customize Details for {selectedService.name}
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-600">
              Provide necessary parameters so we can accurately estimate the team and preparation needed.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            {selectedCategory === "LAUNDRY" && (
              <LaundryQuestions
                serviceName={selectedService.name}
                data={laundryData}
                onChange={onUpdateLaundry}
              />
            )}
            {selectedCategory === "CLEANING" && (
              <CleaningQuestions
                serviceName={selectedService.name}
                data={cleaningData}
                onChange={onUpdateCleaning}
              />
            )}
            {selectedCategory === "DOMESTIC_SUPPORT" && (
              <DomesticSupportQuestions
                serviceName={selectedService.name}
                data={domesticData}
                onChange={onUpdateDomestic}
              />
            )}
            {selectedCategory === "PEST_CONTROL" && (
              <PestControlQuestions
                serviceName={selectedService.name}
                data={pestData}
                onChange={onUpdatePest}
              />
            )}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-6 border-t-2 border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition shadow-2xs"
        >
          <ArrowLeft size={16} />
          <span>Back to Service Types</span>
        </button>

        <button
          type="button"
          disabled={!selectedService}
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-[#031c43] px-6 sm:px-7 py-3 text-xs sm:text-sm font-black text-white shadow-sm transition hover:bg-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continue to Schedule</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
