"use client";

import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type RetentionPolicy = {
  id: string;
  retentionDays: number;
  enabled: boolean;
  updatedAt: string;
  lastRunAt: string | null;
  lastRunCount: number | null;
  updatedBy: { id: string; name: string; email: string } | null;
};

type Props = {
  initialPolicy: RetentionPolicy;
};

const PRESET_OPTIONS = [
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
  { label: "180 days", days: 180 },
  { label: "1 year", days: 365 },
  { label: "2 years", days: 730 },
];

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AuditRetentionPanel({ initialPolicy }: Props) {
  const [policy, setPolicy] = useState<RetentionPolicy>(initialPolicy);
  const [retentionDays, setRetentionDays] = useState(initialPolicy.retentionDays);
  const [enabled, setEnabled] = useState(initialPolicy.enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    retentionDays !== policy.retentionDays || enabled !== policy.enabled;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/audit-logs/retention", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionDays, enabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save policy");
      }

      const data = await res.json();
      setPolicy(data.policy);
      setRetentionDays(data.policy.retentionDays);
      setEnabled(data.policy.enabled);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setRetentionDays(policy.retentionDays);
    setEnabled(policy.enabled);
    setError(null);
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Archive size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-900">
            Log Retention Policy
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Audit logs older than the configured window are automatically
            removed by a nightly job. Policy changes and purge events are
            always preserved.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Automatic purge
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {enabled
                ? "Logs are purged automatically on a nightly schedule."
                : "Purge is paused — logs accumulate until re-enabled."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className="shrink-0 text-slate-400 transition hover:text-slate-700"
            aria-label={enabled ? "Disable automatic purge" : "Enable automatic purge"}
          >
            {enabled ? (
              <ToggleRight size={36} className="text-blue-600" />
            ) : (
              <ToggleLeft size={36} />
            )}
          </button>
        </div>

        {/* Retention window */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Retention window
          </label>

          {/* Preset pills */}
          <div className="flex flex-wrap gap-2">
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setRetentionDays(opt.days)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  retentionDays === opt.days
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom numeric input */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={30}
              max={3650}
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="text-sm text-slate-500">days (30 – 3,650)</span>
          </div>
        </div>

        {/* Cutoff preview */}
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-slate-400" />
          <p className="text-xs leading-5 text-slate-600">
            With the current setting, logs created before{" "}
            <strong className="text-slate-800">
              {cutoffDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>{" "}
            will be removed on the next scheduled run.
          </p>
        </div>

        {/* Last run metadata */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Clock size={12} />
              Last run
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">
              {formatDate(policy.lastRunAt)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ShieldAlert size={12} />
              Logs removed (last run)
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">
              {policy.lastRunCount != null
                ? policy.lastRunCount.toLocaleString()
                : "—"}
            </p>
          </div>
        </div>

        {/* Last updated by */}
        {policy.updatedBy && (
          <p className="text-xs text-slate-400">
            Last updated by{" "}
            <span className="font-semibold text-slate-600">
              {policy.updatedBy.name}
            </span>{" "}
            on {formatDate(policy.updatedAt)}
          </p>
        )}

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <RefreshCw size={14} />
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-[#031c43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={14} className="text-green-300" />
                Saved
              </>
            ) : (
              "Save policy"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
