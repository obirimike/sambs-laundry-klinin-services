"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  CheckCheck,
  Clock3,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  X,
} from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";

const SUPERVISOR_COLLAPSE_KEY = "samb-supervisor-sidebar-collapsed";
const SIDEBAR_EVENT = "samb-supervisor-sidebar-storage";

function subscribeCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_EVENT, callback);
  };
}

function getCollapsedSnapshot() {
  try {
    return window.localStorage.getItem(SUPERVISOR_COLLAPSE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

export type SupervisorNavBadges = {
  awaitingReview: number;
  changesRequested: number;
  approvedCount: number;
  unreadNotifications: number;
};

export default function SupervisorNavigation({
  supervisorName,
  badges,
}: {
  supervisorName: string;
  badges: SupervisorNavBadges;
}) {
  const pathname = usePathname();
  const isCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getServerSnapshot
  );
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname;

  const navItems = [
    { href: "/supervisor", label: "Overview", icon: LayoutDashboard },
    { href: "/supervisor/jobs", label: "Supervised Jobs", icon: Briefcase },
    {
      href: "/supervisor/in-progress",
      label: "In Progress",
      icon: Clock3,
    },
    {
      href: "/supervisor/awaiting-review",
      label: "Awaiting Review",
      icon: ClipboardCheck,
      badge: badges.awaitingReview,
    },
    {
      href: "/supervisor/changes-requested",
      label: "Changes Requested",
      icon: AlertTriangle,
      badge: badges.changesRequested,
    },
    {
      href: "/supervisor/approved",
      label: "Approved Jobs",
      icon: CheckCheck,
      badge: badges.approvedCount,
    },
  ];

  const accountItems = [
    {
      href: "/account/notifications",
      label: "Notifications",
      icon: Bell,
      badge: badges.unreadNotifications,
    },
    {
      href: "/account/profile",
      label: "Profile Settings",
      icon: UserRound,
    },
  ];

  const isRouteActive = (href: string) =>
    href === "/supervisor"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const mainScroll = document.getElementById("supervisor-main-content");
    if (mainScroll) {
      mainScroll.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpenPath(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function toggleCollapse() {
    try {
      window.localStorage.setItem(
        SUPERVISOR_COLLAPSE_KEY,
        String(!isCollapsed)
      );
      window.dispatchEvent(new Event(SIDEBAR_EVENT));
    } catch {
      // ignore
    }
  }

  const renderLinks = (
    items: Array<{
      href: string;
      label: string;
      icon: React.ComponentType<{ size?: number; className?: string }>;
      badge?: number;
    }>,
    collapsedMode: boolean
  ) => (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isRouteActive(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              title={collapsedMode ? item.label : undefined}
              aria-label={collapsedMode ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                collapsedMode
                  ? "justify-center"
                  : "justify-between gap-2.5"
              } ${
                active
                  ? "bg-[#031c43] text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Icon
                  size={17}
                  className={`shrink-0 ${
                    active
                      ? "text-blue-200"
                      : "text-slate-500 group-hover:text-slate-800"
                  }`}
                />
                {!collapsedMode && (
                  <span className="truncate whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </span>

              {!collapsedMode &&
                typeof item.badge === "number" &&
                item.badge > 0 && (
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

              {collapsedMode &&
                typeof item.badge === "number" &&
                item.badge > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600" />
                )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile / Tablet Top Bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link
          href="/supervisor"
          className="flex min-w-0 items-center gap-2.5 text-slate-900"
        >
          <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-2xs">
            <Image
              src="/images/logo/samb-logo.jpeg"
              alt="SAMB's Logo"
              fill
              sizes="32px"
              className="object-cover"
            />
          </span>
          <span className="truncate text-sm font-bold tracking-tight">
            SAMB&apos;s Supervisor
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {badges.awaitingReview > 0 && (
            <Link
              href="/supervisor/awaiting-review"
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 whitespace-nowrap"
            >
              Review ({badges.awaitingReview})
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpenPath(pathname)}
            aria-label="Open supervisor menu"
            aria-expanded={mobileOpen}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Supervisor navigation drawer"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileOpenPath(null)}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  SAMB&apos;s Supervisor
                </p>
                <p className="truncate text-xs text-slate-500">
                  {supervisorName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpenPath(null)}
                aria-label="Close supervisor menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <nav
              aria-label="Mobile supervisor navigation"
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4"
            >
              <div>
                <p className="mb-1.5 px-2.5 text-[11px] font-semibold text-slate-500">
                  Supervision Queues
                </p>
                {renderLinks(navItems, false)}
              </div>
              <div>
                <p className="mb-1.5 px-2.5 text-[11px] font-semibold text-slate-500">
                  Account
                </p>
                {renderLinks(accountItems, false)}
              </div>
            </nav>

            <div className="border-t border-slate-200 p-3">
              <SignOutButton className="w-full justify-center rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden border-r border-slate-200 bg-white transition-all duration-150 lg:flex lg:h-screen lg:shrink-0 lg:flex-col ${
          isCollapsed ? "lg:w-[74px]" : "lg:w-[260px]"
        }`}
      >
        <div
          className={`flex shrink-0 items-center border-b border-slate-200 ${
            isCollapsed
              ? "h-auto flex-col justify-center gap-3 px-2 py-3"
              : "h-16 justify-between px-4"
          }`}
        >
          {!isCollapsed ? (
            <Link
              href="/supervisor"
              className="flex min-w-0 items-center gap-2.5"
            >
              <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                <Image
                  src="/images/logo/samb-logo.jpeg"
                  alt="SAMB's Logo"
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold tracking-tight text-slate-900">
                  SAMB&apos;s
                </span>
                <span className="block truncate text-xs text-slate-500">
                  Supervisor Portal
                </span>
              </span>
            </Link>
          ) : (
            <Link
              href="/supervisor"
              className="flex items-center justify-center"
              title="SAMB's Supervisor Portal"
              aria-label="SAMB's Supervisor Portal"
            >
              <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                <Image
                  src="/images/logo/samb-logo.jpeg"
                  alt="SAMB's Logo"
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
        </div>

        <nav
          aria-label="Supervisor navigation"
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4"
        >
          <div>
            {!isCollapsed && (
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold text-slate-500">
                Supervision Queues
              </p>
            )}
            {renderLinks(navItems, isCollapsed)}
          </div>

          <div>
            {!isCollapsed && (
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold text-slate-500">
                Account
              </p>
            )}
            {renderLinks(accountItems, isCollapsed)}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3">
          {!isCollapsed && (
            <div className="mb-2.5 px-1">
              <p className="truncate text-xs font-semibold text-slate-900">
                {supervisorName}
              </p>
              <p className="text-[11px] text-slate-500">Lead Supervisor</p>
            </div>
          )}
          <SignOutButton
            className={`w-full justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 ${
              isCollapsed ? "px-2 py-2" : "py-2 text-xs font-semibold"
            }`}
          />
        </div>
      </aside>
    </>
  );
}
