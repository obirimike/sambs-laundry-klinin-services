"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Bell,
  Briefcase,
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  History,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";

const ADMIN_COLLAPSE_KEY = "samb-admin-sidebar-collapsed";
const SIDEBAR_EVENT = "samb-sidebar-storage";

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
    return window.localStorage.getItem(ADMIN_COLLAPSE_KEY) === "true";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export type AdminNavBadges = {
  pendingBookings: number;
  awaitingFinalApproval: number;
  newMessages: number;
  unreadNotifications: number;
};

export default function AdminNavigation({
  adminName,
  badges,
}: {
  adminName: string;
  badges: AdminNavBadges;
}) {
  const pathname = usePathname();
  const isCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getServerSnapshot
  );
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const mobileOpen = mobileOpenPath === pathname;

  const navGroups: NavGroup[] = [
    {
      id: "overview",
      label: "Overview",
      items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        {
          href: "/admin/bookings",
          label: "Bookings",
          icon: ClipboardList,
          badge: badges.pendingBookings,
        },
        {
          href: "/admin/approvals",
          label: "Final Approvals",
          icon: CheckCheck,
          badge: badges.awaitingFinalApproval,
        },
        {
          href: "/admin/assignments",
          label: "Assignments",
          icon: UserPlus,
        },
        {
          href: "/admin/calendar",
          label: "Booking Calendar",
          icon: CalendarDays,
        },
        {
          href: "/admin/quotes",
          label: "Quotes & Pricing",
          icon: BadgeDollarSign,
        },
      ],
    },
    {
      id: "people",
      label: "People",
      items: [
        {
          href: "/admin/staff",
          label: "Staff & Supervisors",
          icon: UserCheck,
        },
        { href: "/admin/customers", label: "Customers", icon: Users },
        { href: "/admin/recruitment", label: "Recruitment", icon: Briefcase },
      ],
    },
    {
      id: "business",
      label: "Business Management",
      items: [
        {
          href: "/admin/services",
          label: "Services",
          icon: BriefcaseBusiness,
        },
      ],
    },
    {
      id: "communications",
      label: "Communications",
      items: [
        {
          href: "/admin/messages",
          label: "Messages",
          icon: MessageSquare,
          badge: badges.newMessages,
        },
        { href: "/admin/reviews", label: "Reviews", icon: Star },
      ],
    },
    {
      id: "system",
      label: "System",
      items: [{ href: "/admin/audit-logs", label: "Audit Logs", icon: History }],
    },
    {
      id: "account",
      label: "Account",
      items: [
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
      ],
    },
  ];

  const isRouteActive = (href: string) =>
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const activeGroupId =
    navGroups.find((g) => g.items.some((item) => isRouteActive(item.href)))
      ?.id ?? "overview";

  const [groupState, setGroupState] = useState<{
    path: string;
    overrides: Record<string, boolean>;
  }>({
    path: pathname,
    overrides: {},
  });

  const activeOverrides =
    groupState.path === pathname
      ? groupState.overrides
      : { ...groupState.overrides, [activeGroupId]: true };

  useEffect(() => {
    const mainScroll = document.getElementById("admin-main-content");
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
      window.localStorage.setItem(ADMIN_COLLAPSE_KEY, String(!isCollapsed));
      window.dispatchEvent(new Event(SIDEBAR_EVENT));
    } catch {
      // ignore
    }
  }

  function isGroupOpen(groupId: string) {
    if (groupId in activeOverrides) {
      return Boolean(activeOverrides[groupId]);
    }
    return (
      groupId === activeGroupId ||
      groupId === "overview" ||
      groupId === "operations" ||
      groupId === "people"
    );
  }

  function toggleGroup(groupId: string) {
    setGroupState((prev) => {
      const base =
        prev.path === pathname
          ? prev.overrides
          : { ...prev.overrides, [activeGroupId]: true };
      const current =
        groupId in base
          ? Boolean(base[groupId])
          : groupId === activeGroupId ||
            groupId === "overview" ||
            groupId === "operations" ||
            groupId === "people";
      return {
        path: pathname,
        overrides: {
          ...base,
          [groupId]: !current,
        },
      };
    });
  }

  const renderNavGroups = (collapsedMode: boolean) => (
    <div className="space-y-4">
      {navGroups.map((group) => {
        const isOpen = isGroupOpen(group.id);

        return (
          <div key={group.id}>
            {!collapsedMode && (
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`admin-nav-group-${group.id}`}
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <span className="truncate">{group.label}</span>
                {isOpen ? (
                  <ChevronDown size={14} className="shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-slate-400" />
                )}
              </button>
            )}

            {(collapsedMode || isOpen) && (
              <ul
                id={`admin-nav-group-${group.id}`}
                className={collapsedMode ? "space-y-1" : "mt-1 space-y-0.5"}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isRouteActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsedMode ? item.label : undefined}
                        aria-label={collapsedMode ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
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
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile / Tablet Top Bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link
          href="/admin"
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
            SAMB&apos;s Admin
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {badges.awaitingFinalApproval > 0 && (
            <Link
              href="/admin/approvals"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 whitespace-nowrap"
            >
              Approvals ({badges.awaitingFinalApproval})
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpenPath(pathname)}
            aria-label="Open admin menu"
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-drawer"
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
          aria-label="Admin navigation drawer"
        >
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileOpenPath(null)}
          />
          <aside
            id="admin-mobile-drawer"
            className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white"
          >
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  SAMB&apos;s Admin
                </p>
                <p className="truncate text-xs text-slate-500">{adminName}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpenPath(null)}
                aria-label="Close admin menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <nav
              aria-label="Mobile admin navigation"
              className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
            >
              {renderNavGroups(false)}
            </nav>

            <div className="border-t border-slate-200 p-3">
              <SignOutButton className="w-full justify-center rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" />
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Expanded / Collapsible Sidebar */}
      <aside
        className={`hidden border-r border-slate-200 bg-white transition-all duration-150 lg:flex lg:h-screen lg:shrink-0 lg:flex-col ${
          isCollapsed ? "lg:w-[74px]" : "lg:w-[264px]"
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
            <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
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
                  Operations Console
                </span>
              </span>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="flex items-center justify-center"
              title="SAMB's Operations Console"
              aria-label="SAMB's Operations Console"
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
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
          aria-label="Admin navigation"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
        >
          {renderNavGroups(isCollapsed)}
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3">
          {!isCollapsed && (
            <div className="mb-2.5 px-1">
              <p className="truncate text-xs font-semibold text-slate-900">
                {adminName}
              </p>
              <p className="text-[11px] text-slate-500">Administrator</p>
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
