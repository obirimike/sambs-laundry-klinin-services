import React from "react";
import { ServiceCategory } from "@/types/service";
import {
  LaundryDetails,
  CleaningDetails,
  DomesticSupportDetails,
  PestControlDetails,
} from "@/lib/booking-types";
import { WashingMachine, Sparkles, Home, Bug, Layers } from "lucide-react";

interface ServiceDetailsViewerProps {
  category: ServiceCategory;
  serviceDetails?: Record<string, unknown> | null;
}

export default function ServiceDetailsViewer({
  category,
  serviceDetails,
}: ServiceDetailsViewerProps) {
  if (!serviceDetails || Object.keys(serviceDetails).length === 0) {
    return null;
  }

  const getHeader = () => {
    switch (category) {
      case "LAUNDRY":
        return {
          title: "Laundry Preferences & Garments",
          icon: <WashingMachine size={18} className="text-sky-600" />,
          containerClass: "border-sky-200 bg-sky-50/50",
        };
      case "DOMESTIC_SUPPORT":
        return {
          title: "Domestic Support Specifications",
          icon: <Home size={18} className="text-emerald-600" />,
          containerClass: "border-emerald-200 bg-emerald-50/50",
        };
      case "PEST_CONTROL":
        return {
          title: "Pest & Fumigation Information",
          icon: <Bug size={18} className="text-amber-600" />,
          containerClass: "border-amber-200 bg-amber-50/50",
        };
      case "CLEANING":
      default:
        return {
          title: "Cleaning Scope & Space Details",
          icon: <Sparkles size={18} className="text-blue-600" />,
          containerClass: "border-blue-200 bg-blue-50/50",
        };
    }
  };

  const header = getHeader();

  const renderContent = () => {
    switch (category) {
      case "LAUNDRY": {
        const d = serviceDetails as LaundryDetails;
        return (
          <div className="space-y-2.5 text-xs text-slate-700">
            {d.laundryServiceType && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Care Type:</span>
                <span className="font-bold capitalize">{d.laundryServiceType.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.quantityEstimated && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Estimated Load:</span>
                <span className="font-bold capitalize">{d.quantityEstimated.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.collectionPreference && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Pickup/Delivery:</span>
                <span className="font-bold capitalize">{d.collectionPreference.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.itemTypes && Array.isArray(d.itemTypes) && d.itemTypes.length > 0 && (
              <div className="py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium block mb-1">Item Breakdown:</span>
                <div className="flex flex-wrap gap-1">
                  {d.itemTypes.map((item) => (
                    <span key={item} className="rounded-md bg-white border border-sky-200 text-sky-800 px-2 py-0.5 text-[11px] font-semibold">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {d.fabricOrStainNotes && (
              <div className="py-1">
                <span className="text-slate-500 font-medium block mb-1">Stain / Fabric Care Notes:</span>
                <p className="rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 italic leading-relaxed">
                  &ldquo;{d.fabricOrStainNotes}&rdquo;
                </p>
              </div>
            )}
          </div>
        );
      }

      case "CLEANING": {
        const d = serviceDetails as CleaningDetails;
        return (
          <div className="space-y-2.5 text-xs text-slate-700">
            {d.cleaningType && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Cleaning Type:</span>
                <span className="font-bold capitalize">{d.cleaningType.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.frequency && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Frequency:</span>
                <span className="font-bold capitalize">{d.frequency.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.propertyType && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Property:</span>
                <span className="font-bold">{d.propertyType}</span>
              </div>
            )}
            {d.numberOfRooms !== undefined && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Rooms:</span>
                <span className="font-bold">{d.numberOfRooms}</span>
              </div>
            )}
            {d.estimatedSize && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Approx Size:</span>
                <span className="font-bold">{d.estimatedSize}</span>
              </div>
            )}
            {d.focusAreas && Array.isArray(d.focusAreas) && d.focusAreas.length > 0 && (
              <div className="py-1">
                <span className="text-slate-500 font-medium block mb-1">Priority Focus Areas:</span>
                <div className="flex flex-wrap gap-1">
                  {d.focusAreas.map((area) => (
                    <span key={area} className="rounded-md bg-white border border-blue-200 text-blue-800 px-2 py-0.5 text-[11px] font-semibold">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "DOMESTIC_SUPPORT": {
        const d = serviceDetails as DomesticSupportDetails;
        return (
          <div className="space-y-2.5 text-xs text-slate-700">
            {d.supportType && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Assistance Type:</span>
                <span className="font-bold capitalize">{d.supportType.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.frequency && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Engagement:</span>
                <span className="font-bold capitalize">{d.frequency.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.schedulePreference && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Shift / Schedule:</span>
                <span className="font-bold capitalize">{d.schedulePreference.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.estimatedHours !== undefined && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Daily Hours:</span>
                <span className="font-bold">{d.estimatedHours} hrs</span>
              </div>
            )}
            {d.specificRequirements && (
              <div className="py-1">
                <span className="text-slate-500 font-medium block mb-1">Household Instructions:</span>
                <p className="rounded-xl bg-white border border-slate-200 p-2.5 text-slate-800 italic leading-relaxed">
                  &ldquo;{d.specificRequirements}&rdquo;
                </p>
              </div>
            )}
          </div>
        );
      }

      case "PEST_CONTROL": {
        const d = serviceDetails as PestControlDetails;
        return (
          <div className="space-y-2.5 text-xs text-slate-700">
            {d.pestType && Array.isArray(d.pestType) && d.pestType.length > 0 && (
              <div className="py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium block mb-1">Target Pests:</span>
                <div className="flex flex-wrap gap-1">
                  {d.pestType.map((pest) => (
                    <span key={pest} className="rounded-md bg-white border border-amber-300 text-amber-900 px-2 py-0.5 text-[11px] font-bold">
                      {pest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {d.infestationLevel && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Infestation Level:</span>
                <span className="font-bold capitalize">{d.infestationLevel.replace(/_/g, " ")}</span>
              </div>
            )}
            {d.treatmentArea && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Treatment Area:</span>
                <span className="font-bold capitalize">{d.treatmentArea.replace(/_/g, " ")}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Children / Pets Present:</span>
              <span className="font-bold">{d.hasPetsOrChildren ? "Yes (Safe formula required)" : "No"}</span>
            </div>
            {d.previousTreatment && (
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Prior Treatment:</span>
                <span className="font-bold capitalize">{d.previousTreatment.replace(/_/g, " ")}</span>
              </div>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className={`mt-5 rounded-2xl border p-4.5 ${header.containerClass}`}>
      <div className="flex items-center gap-2 mb-3 border-b border-slate-200/60 pb-2">
        {header.icon}
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          {header.title}
        </h4>
      </div>
      {renderContent()}
    </div>
  );
}
