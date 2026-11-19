"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  PauseCircle,
  PlayCircle,
  Trash2,
  Edit2,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import FeedbackModal from "@/components/ui/FeedbackModal";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "STAFF" | "SUPERVISOR";
  accountStatus: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  activeAssignmentCount: number;
  activeSupervisionCount: number;
};

type Props = {
  initialStaff: StaffMember[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StaffManagement({ initialStaff }: Props) {
  const [staff, setStaff] = useState(initialStaff);
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STAFF" | "SUPERVISOR">(
    "ALL"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"STAFF" | "SUPERVISOR">("STAFF");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Edit team member state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"STAFF" | "SUPERVISOR">("STAFF");

  // Confirmation modal targets
  const [suspendTarget, setSuspendTarget] = useState<StaffMember | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<StaffMember | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  // Feedback modal
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    variant: "success",
    title: "",
    message: "",
  });

  const filteredStaff = useMemo(() => {
    if (roleFilter === "ALL") return staff;
    return staff.filter((m) => m.role === roleFilter);
  }, [staff, roleFilter]);

  const staffCount = staff.filter((m) => m.role === "STAFF").length;
  const supervisorCount = staff.filter((m) => m.role === "SUPERVISOR").length;

  async function refreshStaffList() {
    try {
      const refresh = await fetch("/api/admin/staff", { cache: "no-store" });
      if (refresh.ok) {
        const data = (await refresh.json()) as { staff: StaffMember[] };
        setStaff(data.staff);
      }
    } catch {
      // ignore
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          role,
          password,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Account Creation Failed",
          message: result.message || "Unable to create team account.",
        });
        return;
      }

      await refreshStaffList();
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("STAFF");

      setFeedback({
        isOpen: true,
        variant: "success",
        title:
          role === "SUPERVISOR"
            ? "Supervisor Account Created"
            : "Staff Account Created",
        message:
          result.message || "New team account has been created successfully.",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "A network error occurred. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingStaff) return;
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim() || null,
          role: editRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Update Failed",
          message: result.message || "Unable to update team member details.",
        });
        return;
      }

      await refreshStaffList();
      setEditingStaff(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Team Member Updated",
        message: result.message || "Team member updated successfully.",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeSuspend() {
    if (!suspendTarget) return;
    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/staff/${suspendTarget.id}/suspend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Administrative account suspension" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Suspension Failed",
          message: data.message || "Unable to suspend this team account.",
        });
        return;
      }

      await refreshStaffList();
      setSuspendTarget(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Account Suspended",
        message: data.message || "This team account has been suspended.",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeReactivate() {
    if (!reactivateTarget) return;
    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/staff/${reactivateTarget.id}/reactivate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Administrative account reactivation",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Reactivation Failed",
          message: data.message || "Unable to reactivate this team account.",
        });
        return;
      }

      await refreshStaffList();
      setReactivateTarget(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Account Reactivated",
        message: data.message || "This team account has been reactivated.",
      });
    } catch {
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Error",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    setBusy(true);

    try {
      const response = await fetch(`/api/admin/staff/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteTarget.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteTarget(null);
        setFeedback({
          isOpen: true,
          variant: "error",
          title: "Deletion Blocked",
          message:
            data.message ||
            "This team member has historical assignments or supervisions. Suspend the account instead.",
        });
        return;
      }

      await refreshStaffList();
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "success",
        title: "Account Deleted",
        message: `Account for ${deleteTarget.name} has been permanently deleted.`,
      });
    } catch {
      setDeleteTarget(null);
      setFeedback({
        isOpen: true,
        variant: "error",
        title: "Connection Problem",
        message: "Failed to connect to the server.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            People Operations
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Staff &amp; Supervisors
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            Create field staff and lead supervisor accounts, manage roles and
            access, and monitor active workloads.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRoleFilter("ALL")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              roleFilter === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Team ({staff.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("STAFF")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              roleFilter === "STAFF"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Staff ({staffCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("SUPERVISOR")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              roleFilter === "SUPERVISOR"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Supervisors ({supervisorCount})
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        {/* Directory */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Operations team directory
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Showing {filteredStaff.length} account
                {filteredStaff.length === 1 ? "" : "s"}
              </p>
            </div>
            <Users size={18} className="text-slate-400" />
          </div>

          {filteredStaff.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-800">
                No matching accounts yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Create a staff or supervisor account using the form.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStaff.map((member) => {
                const isSupervisor = member.role === "SUPERVISOR";
                const workloadCount = isSupervisor
                  ? member.activeSupervisionCount
                  : member.activeAssignmentCount;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">
                          {member.name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                            isSupervisor
                              ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                              : "border-blue-200 bg-blue-50 text-blue-800"
                          }`}
                        >
                          {isSupervisor && <UserCheck size={11} />}
                          {isSupervisor ? "Supervisor" : "Staff"}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            member.accountStatus === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {member.accountStatus}
                        </span>
                      </div>
                      <p className="mt-1 break-all text-sm text-slate-600">
                        {member.email}
                      </p>
                      {member.phone && (
                        <p className="mt-1 text-sm text-slate-500">
                          {member.phone}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-slate-400">
                        Created {formatDate(member.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-center border border-slate-200">
                        <p className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                          {workloadCount}
                        </p>
                        <p className="text-[10px] font-semibold uppercase text-slate-500">
                          {isSupervisor ? "Supervising" : "Assigned"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingStaff(member);
                          setEditName(member.name);
                          setEditPhone(member.phone || "");
                          setEditRole(member.role);
                        }}
                        aria-label={`Edit ${member.name}`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Edit2 size={14} />
                      </button>

                      {member.accountStatus === "ACTIVE" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setSuspendTarget(member)}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                          title="Suspend account"
                          aria-label={`Suspend ${member.name}`}
                        >
                          <PauseCircle size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setReactivateTarget(member)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                          title="Reactivate account"
                          aria-label={`Reactivate ${member.name}`}
                        >
                          <PlayCircle size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDeleteTarget(member)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                        title="Permanently delete account"
                        aria-label={`Delete ${member.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Create Form */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-base font-bold text-slate-900">
              Create team account
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Add a field staff member or a lead supervisor to the operations
              workflow.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 p-5">
            <div>
              <label
                htmlFor="staff-role"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Account role
              </label>
              <select
                id="staff-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "STAFF" | "SUPERVISOR")
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="STAFF">Field Staff (Worker)</option>
                <option value="SUPERVISOR">Lead Supervisor (Inspector)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="staff-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="staff-name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="staff-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="staff-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="staff-phone"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Phone number (optional)
              </label>
              <input
                id="staff-phone"
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="staff-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Initial password
              </label>
              <input
                id="staff-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                Use at least 10 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#031c43] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} />
              <span>
                {busy
                  ? "Creating account..."
                  : role === "SUPERVISOR"
                    ? "Create supervisor account"
                    : "Create staff account"}
              </span>
            </button>
          </form>
        </section>
      </div>

      {/* Edit Modal */}
      {editingStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setEditingStaff(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Edit Team Member
            </h3>
            <p className="mt-1 text-xs text-slate-500">{editingStaff.email}</p>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 0241234567"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Operational role
                </label>
                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(e.target.value as "STAFF" | "SUPERVISOR")
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="STAFF">Field Staff</option>
                  <option value="SUPERVISOR">Lead Supervisor</option>
                </select>
                {editRole !== editingStaff.role && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    Changing roles rotates active login sessions for this user.
                  </p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-[#031c43] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-950 disabled:opacity-50"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Suspend */}
      {suspendTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setSuspendTarget(null)}
          onConfirm={executeSuspend}
          title="Suspend team account?"
          description={`Suspend account for ${suspendTarget.name}? They will not be able to sign in or access workspace tools.`}
          consequences="All past assignments and supervisions will remain linked to this account for audit purposes."
          recordName={`${suspendTarget.name} (${suspendTarget.email})`}
          confirmText="Suspend Account"
          isDestructive={true}
          isLoading={busy}
        />
      )}

      {/* Confirmation Modal: Reactivate */}
      {reactivateTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setReactivateTarget(null)}
          onConfirm={executeReactivate}
          title="Reactivate team account?"
          description={`Reactivate ${reactivateTarget.name}'s account so they can sign in and be assigned to bookings again?`}
          recordName={`${reactivateTarget.name} (${reactivateTarget.email})`}
          confirmText="Reactivate Account"
          isLoading={busy}
        />
      )}

      {/* Confirmation Modal: Delete */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDelete}
          title="Delete team account?"
          description="Permanently delete this account if they have no historical assignment or supervision records."
          consequences="If this user has past records, deletion will be blocked and suspension should be used instead."
          recordName={`${deleteTarget.name} (${deleteTarget.email})`}
          confirmText="Permanently Delete"
          isDestructive={true}
          requireConfirmationText={deleteTarget.email}
          confirmationPlaceholder={deleteTarget.email}
          isLoading={busy}
        />
      )}

      {/* Reusable Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback((prev) => ({ ...prev, isOpen: false }))}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
