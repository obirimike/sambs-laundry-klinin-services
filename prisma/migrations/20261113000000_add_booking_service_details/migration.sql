-- Add service-specific details JSON column to Booking.
-- Stores category-specific answers captured during the multi-step booking flow.
-- Nullable so existing bookings are unaffected.
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "serviceDetails" JSONB;
