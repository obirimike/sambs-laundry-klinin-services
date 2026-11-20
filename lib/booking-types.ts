

export type LaundryDetails = {
  laundryServiceType?: "wash_and_fold" | "wash_and_iron" | "ironing_only" | "dry_cleaning" | "other";
  quantityEstimated?: "1_to_2_bags" | "3_to_5_bags" | "large_bulk" | "baskets" | "not_sure";
  itemTypes?: string[];
  fabricOrStainNotes?: string;
  collectionPreference?: "pickup_and_delivery" | "drop_off_at_hub";
};

export type CleaningDetails = {
  cleaningType?: "standard" | "deep_clean" | "move_in_out" | "post_construction" | "office_commercial";
  frequency?: "one_time" | "weekly" | "bi_weekly" | "monthly";
  propertyType?: string;
  numberOfRooms?: number;
  estimatedSize?: string;
  focusAreas?: string[];
};

export type DomesticSupportDetails = {
  supportType?: "general_housekeeping" | "meal_prep_cooking" | "elderly_assistance" | "childcare_support" | "compound_care";
  frequency?: "one_off" | "daily" | "weekly_recurring" | "live_in";
  schedulePreference?: "morning" | "afternoon" | "full_day" | "flexible";
  estimatedHours?: number;
  specificRequirements?: string;
};

export type PestControlDetails = {
  pestType?: string[];
  infestationLevel?: "early_preventive" | "moderate" | "severe_urgent";
  treatmentArea?: "indoor_only" | "outdoor_only" | "indoor_and_outdoor";
  propertyType?: string;
  estimatedSize?: string;
  hasPetsOrChildren?: boolean;
  previousTreatment?: "never" | "within_6_months" | "over_6_months_ago";
};

export type ServiceDetails =
  | { category: "LAUNDRY"; data: LaundryDetails }
  | { category: "CLEANING"; data: CleaningDetails }
  | { category: "DOMESTIC_SUPPORT"; data: DomesticSupportDetails }
  | { category: "PEST_CONTROL"; data: PestControlDetails };

export type BookingSubmissionPayload = {
  serviceId: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  propertyType?: string;
  numberOfRooms?: number;
  estimatedSize?: string;
  specialInstructions?: string;
  serviceDetails?: Record<string, unknown>;
};
