import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

// ─── GET  /api/admin/audit-logs/retention ────────────────────────────────────
// Returns the current retention policy (singleton row).
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const policy = await db.auditRetentionPolicy.upsert({
    where: { id: "default" },
    create: { id: "default", retentionDays: 90, enabled: true },
    update: {},
    include: {
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ policy });
}

// ─── PUT  /api/admin/audit-logs/retention ────────────────────────────────────
// Updates the retention policy. Body: { retentionDays: number; enabled: boolean }
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

 const body = await req.json().catch(() => null);

if (
  !body ||
  typeof body.retentionDays !== "number" ||
  !Number.isInteger(body.retentionDays) ||
  typeof body.enabled !== "boolean"
) {
  return NextResponse.json(
    { error: "Invalid retention policy data" },
    { status: 422 }
  );
}

const retentionDays = body.retentionDays;
const enabled = body.enabled;

  if (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3650) {
    return NextResponse.json(
      { error: "retentionDays must be an integer between 30 and 3650" },
      { status: 422 }
    );
  }

  const policy = await db.auditRetentionPolicy.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      retentionDays,
      enabled,
      updatedById: session.user.id,
    },
    update: {
      retentionDays,
      enabled,
      updatedById: session.user.id,
    },
    include: {
      updatedBy: { select: { id: true, name: true, email: true } },
    },
  });

  // Write an audit entry for this config change
  await writeAudit(db, {
    actorId: session.user.id,
    action: "UPDATE_RETENTION_POLICY",
    entityType: "AuditRetentionPolicy",
    entityId: "default",
    reason: `Set retention to ${retentionDays} days, enabled=${enabled}`,
    changes: { retentionDays, enabled },
  });

  return NextResponse.json({ policy });
}
