"use client";

import React from "react";
import { Check } from "lucide-react";

export type StepId = 1 | 2 | 3 | 4;

interface StepIndicatorProps {
  currentStep: StepId;
  categoryLabel?: string;
}

export default function StepIndicator({ currentStep, categoryLabel }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "Service Type" },
    { number: 2, label: categoryLabel ? `${categoryLabel} Package` : "Service Package" },
    { number: 3, label: "Schedule & Location" },
    { number: 4, label: "Review & Confirm" },
  ];

  return (
    <div className="w-full mb-8">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#031c43] transition-all duration-300 z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isDone = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 shadow-sm ${
                  isDone
                    ? "bg-[#031c43] text-white"
                    : isCurrent
                    ? "bg-[#031c43] text-white ring-4 ring-blue-100"
                    : "bg-white border-2 border-slate-300 text-slate-500"
                }`}
              >
                {isDone ? <Check size={16} strokeWidth={3} /> : step.number}
              </div>
              <span
                className={`mt-2 text-xs font-semibold max-w-[80px] sm:max-w-none text-center truncate ${
                  isCurrent ? "text-slate-900 font-extrabold" : isDone ? "text-blue-900 font-bold" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
