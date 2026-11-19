import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import AuditLogViewer from "@/components/admin/AuditLogViewer";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=%2Fadmin%2Faudit-logs");
  if (session.user.role !== "ADMIN") redirect("/account");

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
    take: 250,
  });

  const actorsMap = new Map<string, string>();
  const actionsSet = new Set<string>();
  const entitiesSet = new Set<string>();

  const serializedLogs = logs.map((log: any) => {
    actorsMap.set(log.actor.id, log.actor.name);
    actionsSet.add(log.action);
    entitiesSet.add(log.entityType);

    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      reason: log.reason,
      changes: log.changes,
      createdAt: log.createdAt.toISOString(),
      actor: {
        id: log.actor.id,
        name: log.actor.name,
        email: log.actor.email,
      },
    };
  });

  const actors = Array.from(actorsMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));
  const actionTypes = Array.from(actionsSet).sort();
  const entityTypes = Array.from(entitiesSet).sort();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} /> Dashboard
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <History size={26} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Governance &amp; Security
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Audit Logs
          </h1>
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        A comprehensive, tamper-evident audit record of operational decisions,
        staff completions, supervisor reviews, status changes, and record
        deletions across the SAMB&apos;s operations platform.
      </p>

      <div className="mt-7">
        <AuditLogViewer
          initialLogs={serializedLogs}
          actors={actors}
          actionTypes={actionTypes}
          entityTypes={entityTypes}
        />
      </div>
    </main>
  );
}
