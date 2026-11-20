-- Migration: 20261120000000_add_audit_retention_policy
-- Adds AuditRetentionPolicy singleton table that drives the automatic
-- log retention / purge job.

CREATE TABLE "AuditRetentionPolicy" (
    "id"            TEXT         NOT NULL DEFAULT 'default',
    "retentionDays" INTEGER      NOT NULL DEFAULT 90,
    "enabled"       BOOLEAN      NOT NULL DEFAULT true,
    "updatedById"   TEXT,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRunAt"     TIMESTAMP(3),
    "lastRunCount"  INTEGER,

    CONSTRAINT "AuditRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- FK → User (nullable — policy row survives if updater is deleted)
ALTER TABLE "AuditRetentionPolicy"
    ADD CONSTRAINT "AuditRetentionPolicy_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Index on updatedAt for the admin UI sort
CREATE INDEX "AuditRetentionPolicy_updatedAt_idx"
    ON "AuditRetentionPolicy"("updatedAt");

-- Seed the singleton row so the app always has a row to read
INSERT INTO "AuditRetentionPolicy" ("id", "retentionDays", "enabled", "updatedAt")
VALUES ('default', 90, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
