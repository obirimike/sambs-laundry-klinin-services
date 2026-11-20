import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── POST  /api/cron/audit-retention ─────────────────────────────────────────
//
// Automated retention purge job.
//
// Security model:
//   • Vercel Cron / external scheduler calls this with
//     Authorization: Bearer <CRON_SECRET>
//   • If CRON_SECRET is not set, the route is disabled (safe default).
//
// What it does:
//   1. Reads the AuditRetentionPolicy singleton.
//   2. If enabled, deletes AuditLog rows older than retentionDays.
//   3. Updates lastRunAt + lastRunCount on the policy row.
//   4. Writes a system audit entry recording what was purged.
//
// The system uses the first ADMIN user's id as the actor for the
// system-generated audit entry so the actor FK is always satisfied.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── Auth: Bearer token check ────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured — job disabled" },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Load retention policy ───────────────────────────────────────────────────
  const policy = await db.auditRetentionPolicy.upsert({
    where: { id: "default" },
    create: { id: "default", retentionDays: 90, enabled: true },
    update: {},
  });

  if (!policy.enabled) {
    return NextResponse.json({ skipped: true, reason: "Retention policy disabled" });
  }

  // ── Cutoff date ─────────────────────────────────────────────────────────────
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - policy.retentionDays);

  // ── Delete expired logs ─────────────────────────────────────────────────────
  const { count: deletedCount } = await db.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      // Safety: never delete the system audit entries about policy changes
      // (action = UPDATE_RETENTION_POLICY or RETENTION_PURGE) so there's always
      // a lineage of who changed what.
      action: {
        notIn: ["UPDATE_RETENTION_POLICY", "RETENTION_PURGE"],
      },
    },
  });

  // ── Find a system actor (any ADMIN) for the audit entry ────────────────────
  const systemActor = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (systemActor) {
    await db.auditLog.create({
      data: {
        actorId: systemActor.id,
        action: "RETENTION_PURGE",
        entityType: "AuditLog",
        entityId: "batch",
        reason: `Automated purge: removed ${deletedCount} log(s) older than ${policy.retentionDays} days (cutoff: ${cutoff.toISOString()})`,
        changes: {
          deletedCount,
          retentionDays: policy.retentionDays,
          cutoff: cutoff.toISOString(),
        },
      },
    });
  }

  // ── Update policy metadata ──────────────────────────────────────────────────
  await db.auditRetentionPolicy.update({
    where: { id: "default" },
    data: { lastRunAt: new Date(), lastRunCount: deletedCount },
  });

  return NextResponse.json({
    success: true,
    deletedCount,
    retentionDays: policy.retentionDays,
    cutoff: cutoff.toISOString(),
  });
}

  // Vercel Cron invokes scheduled routes using GET.
export async function GET(req: NextRequest) {
  return POST(req);
}
