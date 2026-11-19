-- Additive migration for multi-level staff, supervisor, and admin approval workflow.
-- Safe for existing production data: preserves BookingStatus and adds nullable/defaulted columns and new tables.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERVISOR';

DO $$ BEGIN
  CREATE TYPE "AssignmentStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'SUBMITTED_FOR_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupervisionStatus" AS ENUM (
    'NOT_REQUIRED',
    'ASSIGNED',
    'IN_PROGRESS',
    'AWAITING_SUPERVISOR_REVIEW',
    'CHANGES_REQUESTED',
    'SUPERVISOR_APPROVED',
    'RETURNED_BY_ADMIN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkflowReviewDecision" AS ENUM (
    'APPROVED',
    'CHANGES_REQUESTED',
    'RETURNED_TO_SUPERVISOR'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkflowReviewerRole" AS ENUM (
    'SUPERVISOR',
    'ADMIN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "supervisorId" TEXT,
  ADD COLUMN IF NOT EXISTS "supervisorAssignedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "supervisionStatus" "SupervisionStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN IF NOT EXISTS "finalApprovedById" TEXT,
  ADD COLUMN IF NOT EXISTS "finalApprovedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "finalApprovalNote" TEXT;

ALTER TABLE "BookingAssignment"
  ADD COLUMN IF NOT EXISTS "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "AssignmentSubmission" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "submittedById" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "workPerformed" TEXT NOT NULL,
  "issuesNoted" TEXT,
  "photos" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkflowReview" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "assignmentId" TEXT,
  "reviewerId" TEXT NOT NULL,
  "reviewerRole" "WorkflowReviewerRole" NOT NULL,
  "decision" "WorkflowReviewDecision" NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Booking_supervisorId_idx" ON "Booking"("supervisorId");
CREATE INDEX IF NOT EXISTS "Booking_supervisionStatus_idx" ON "Booking"("supervisionStatus");
CREATE INDEX IF NOT EXISTS "Booking_finalApprovedById_idx" ON "Booking"("finalApprovedById");
CREATE INDEX IF NOT EXISTS "BookingAssignment_bookingId_status_idx" ON "BookingAssignment"("bookingId", "status");
CREATE INDEX IF NOT EXISTS "AssignmentSubmission_assignmentId_createdAt_idx" ON "AssignmentSubmission"("assignmentId", "createdAt");
CREATE INDEX IF NOT EXISTS "AssignmentSubmission_bookingId_createdAt_idx" ON "AssignmentSubmission"("bookingId", "createdAt");
CREATE INDEX IF NOT EXISTS "AssignmentSubmission_submittedById_idx" ON "AssignmentSubmission"("submittedById");
CREATE INDEX IF NOT EXISTS "WorkflowReview_bookingId_createdAt_idx" ON "WorkflowReview"("bookingId", "createdAt");
CREATE INDEX IF NOT EXISTS "WorkflowReview_assignmentId_createdAt_idx" ON "WorkflowReview"("assignmentId", "createdAt");
CREATE INDEX IF NOT EXISTS "WorkflowReview_reviewerId_idx" ON "WorkflowReview"("reviewerId");

DO $$ BEGIN
  ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_supervisorId_fkey"
    FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_finalApprovedById_fkey"
    FOREIGN KEY ("finalApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "BookingAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowReview"
    ADD CONSTRAINT "WorkflowReview_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowReview"
    ADD CONSTRAINT "WorkflowReview_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "BookingAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "WorkflowReview"
    ADD CONSTRAINT "WorkflowReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
