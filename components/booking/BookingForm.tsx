"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceCategory } from "@/types/service";
import FeedbackModal from "@/components/ui/FeedbackModal";
import StepIndicator, { StepId } from "./steps/StepIndicator";
import StepServiceSelect, { ServiceOption } from "./steps/StepServiceSelect";
import StepServiceDetails from "./steps/StepServiceDetails";
import StepScheduleLocation from "./steps/StepScheduleLocation";
import StepReview from "./steps/StepReview";
import {
  LaundryDetails,
  CleaningDetails,
  DomesticSupportDetails,
  PestControlDetails,
} from "@/lib/booking-types";
import { AlertCircle, RotateCcw } from "lucide-react";

export type RepeatBookingData = {
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  bookingNumber: string;
  address: string;
  propertyType?: string;
  numberOfRooms?: number;
  estimatedSize?: string;
  specialInstructions?: string;
  serviceDetails?: Record<string, unknown>;
};

type BookingFormProps = {
  services: ServiceOption[];
  initialServiceId?: string;
  repeatData?: RepeatBookingData;
};

export default function BookingForm({
  services,
  initialServiceId = "",
  repeatData,
}: BookingFormProps) {
  const router = useRouter();

  // Find initial service if provided
  const targetServiceId = repeatData?.serviceId || initialServiceId;
  const initialService = targetServiceId
    ? services.find((s) => s.id === targetServiceId)
    : undefined;

  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(
    () => repeatData?.category || initialService?.category || null
  );

  // Selected package state
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    () => repeatData?.serviceId || initialService?.id || ""
  );

  // Wizard state: Step 1 = Category, Step 2 = Package & Details, Step 3 = Schedule & Address, Step 4 = Review
  // If repeating, start on Step 3 (Schedule & Location) since package and details are already preloaded
  const [currentStep, setCurrentStep] = useState<StepId>(() => {
    if (repeatData) return 3;
    return initialService ? 2 : 1;
  });
  // Category specific question answers with repeat prefill
  const [laundryData, setLaundryData] = useState<LaundryDetails>(() => ({
    laundryServiceType: "wash_and_fold",
    quantityEstimated: "1_to_2_bags",
    collectionPreference: "pickup_and_delivery",
    ...(repeatData?.category === "LAUNDRY" && repeatData.serviceDetails
      ? (repeatData.serviceDetails as Partial<LaundryDetails>)
      : {}),
  }));

  const [cleaningData, setCleaningData] = useState<CleaningDetails>(() => ({
    cleaningType: "standard",
    frequency: "one_time",
    propertyType: repeatData?.propertyType || "Residential Apartment / Flat",
    numberOfRooms: repeatData?.numberOfRooms ?? 3,
    estimatedSize: repeatData?.estimatedSize,
    ...(repeatData?.category === "CLEANING" && repeatData.serviceDetails
      ? (repeatData.serviceDetails as Partial<CleaningDetails>)
      : {}),
  }));

  const [domesticData, setDomesticData] = useState<DomesticSupportDetails>(() => ({
    supportType: "general_housekeeping",
    frequency: "one_off",
    schedulePreference: "full_day",
    ...(repeatData?.category === "DOMESTIC_SUPPORT" && repeatData.serviceDetails
      ? (repeatData.serviceDetails as Partial<DomesticSupportDetails>)
      : {}),
  }));

  const [pestData, setPestData] = useState<PestControlDetails>(() => ({
    pestType: ["Cockroaches"],
    infestationLevel: "moderate",
    treatmentArea: "indoor_and_outdoor",
    hasPetsOrChildren: false,
    previousTreatment: "never",
    propertyType: repeatData?.propertyType,
    estimatedSize: repeatData?.estimatedSize,
    ...(repeatData?.category === "PEST_CONTROL" && repeatData.serviceDetails
      ? (repeatData.serviceDetails as Partial<PestControlDetails>)
      : {}),
  }));

  // Schedule & Location
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [address, setAddress] = useState(() => repeatData?.address || "");
  const [specialInstructions, setSpecialInstructions] = useState(
    () => repeatData?.specialInstructions || ""
  );

  // Submission feedback
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  const today = new Date();
  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const handleSelectCategory = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    const servicesInCat = services.filter((s) => s.category === cat);
    if (!servicesInCat.some((s) => s.id === selectedServiceId) && servicesInCat.length > 0) {
      setSelectedServiceId(servicesInCat[0].id);
    }
  };

  const handleSelectService = (srv: ServiceOption) => {
    setSelectedServiceId(srv.id);
    setSelectedCategory(srv.category);
  };

  const getCategoryLabel = () => {
    const cat = selectedCategory || selectedService?.category;
    if (!cat) return undefined;
    switch (cat) {
      case "LAUNDRY":
        return "Laundry";
      case "DOMESTIC_SUPPORT":
        return "Domestic";
      case "PEST_CONTROL":
        return "Pest Control";
      case "CLEANING":
      default:
        return "Cleaning";
    }
  };

  // Compile full submission payload
  const handleSubmitBooking = async () => {
    if (!selectedService) {
      setError("Please select a service package.");
      setCurrentStep(2);
      return;
    }

    if (!preferredDate || !preferredTime || !address) {
      setError("Please fill in preferred date, time, and address.");
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let categoryDetails: Record<string, unknown> = {};
      let topPropertyType: string | undefined = undefined;
      let topRooms: number | undefined = undefined;
      let topSize: string | undefined = undefined;

      switch (selectedService.category) {
        case "LAUNDRY":
          categoryDetails = { ...laundryData };
          break;
        case "CLEANING":
          categoryDetails = { ...cleaningData };
          topPropertyType = cleaningData.propertyType;
          topRooms = cleaningData.numberOfRooms;
          topSize = cleaningData.estimatedSize;
          break;
        case "DOMESTIC_SUPPORT":
          categoryDetails = { ...domesticData };
          break;
        case "PEST_CONTROL":
          categoryDetails = { ...pestData };
          topPropertyType = pestData.propertyType;
          topSize = pestData.estimatedSize;
          break;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          preferredDate,
          preferredTime,
          address,
          propertyType: topPropertyType,
          numberOfRooms: topRooms,
          estimatedSize: topSize,
          specialInstructions: specialInstructions || undefined,
          serviceDetails: categoryDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to submit your service request.");
        return;
      }

      setBookingNumber(data.booking.bookingNumber);
      setShowSuccessModal(true);
      router.refresh();
    } catch {
      setError("A connection error occurred. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-950 font-semibold">
        There are currently no active services configured in the system. Please contact our support team.
      </div>
    );
  }

  return (
    <div>
      <StepIndicator currentStep={currentStep} categoryLabel={getCategoryLabel()} />

      {/* Repeat Booking Notice */}
      {repeatData && (
        <div className="mb-6 flex items-start gap-3.5 rounded-2xl border-2 border-blue-200 bg-blue-50/90 p-4.5 text-blue-950 shadow-2xs">
          <RotateCcw size={20} className="mt-0.5 shrink-0 text-blue-900" />
          <div className="flex-1 text-xs">
            <p className="font-extrabold text-blue-950 text-sm">
              Re-booking {repeatData.serviceName}
            </p>
            <p className="mt-0.5 text-blue-900 font-medium leading-relaxed">
              We&apos;ve pre-filled your preferences and address from booking #{repeatData.bookingNumber}. Please choose your new preferred date and time below. You can also step back to edit service options at any time.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50/90 p-4 text-sm font-semibold text-rose-900 shadow-2xs"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Choose Type of Service (Category) */}
      {currentStep === 1 && (
        <StepServiceSelect
          services={services}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onNext={() => {
            if (selectedCategory) setCurrentStep(2);
          }}
        />
      )}

      {/* Step 2: Open Available Services under Type & Configure Specifications */}
      {currentStep === 2 && selectedCategory && (
        <StepServiceDetails
          services={services}
          selectedCategory={selectedCategory}
          selectedServiceId={selectedServiceId}
          onSelectService={handleSelectService}
          laundryData={laundryData}
          cleaningData={cleaningData}
          domesticData={domesticData}
          pestData={pestData}
          onUpdateLaundry={(u) => setLaundryData((p) => ({ ...p, ...u }))}
          onUpdateCleaning={(u) => setCleaningData((p) => ({ ...p, ...u }))}
          onUpdateDomestic={(u) => setDomesticData((p) => ({ ...p, ...u }))}
          onUpdatePest={(u) => setPestData((p) => ({ ...p, ...u }))}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {/* Step 3: Schedule & Address */}
      {currentStep === 3 && (
        <StepScheduleLocation
          preferredDate={preferredDate}
          preferredTime={preferredTime}
          address={address}
          specialInstructions={specialInstructions}
          onChangeDate={setPreferredDate}
          onChangeTime={setPreferredTime}
          onChangeAddress={setAddress}
          onChangeSpecialInstructions={setSpecialInstructions}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
          minimumDate={minimumDate}
        />
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && selectedService && (
        <StepReview
          selectedService={selectedService}
          laundryData={laundryData}
          cleaningData={cleaningData}
          domesticData={domesticData}
          pestData={pestData}
          preferredDate={preferredDate}
          preferredTime={preferredTime}
          address={address}
          specialInstructions={specialInstructions}
          isSubmitting={isSubmitting}
          onBack={() => setCurrentStep(3)}
          onSubmit={handleSubmitBooking}
          onEditStep={(step) => setCurrentStep(step)}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        variant="success"
        title="Booking Request Submitted"
        message="Your request has been received. Our team will review your service-specific preferences and contact you shortly to confirm the appointment and pricing."
        referenceNumber={bookingNumber}
        referenceLabel="Booking Reference"
        primaryAction={{
          label: "View My Bookings",
          onClick: () => router.push("/account/bookings"),
        }}
        secondaryAction={{
          label: "Book Another Service",
          onClick: () => {
            setShowSuccessModal(false);
            setCurrentStep(1);
          },
        }}
      />
    </div>
  );
}
