"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { navSections, appName, appVersion, type NavItem } from "@/config/navigation";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const SidebarContext = React.createContext<{
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}>({ collapsed: false, setCollapsed: () => {} });

export function SidebarCollapseToggle({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { collapsed, setCollapsed } = React.useContext(SidebarContext);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
      className={className}
      onClick={() => setCollapsed((c) => !c)}
      {...props}
    >
      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
    </Button>
  );
}

function isLinkActive(item: NavItem, pathname: string) {
  if (item.href === "/") {
    return pathname === "/";
  }
  return item.children
    ? pathname === item.href || item.children.some((c) => pathname.startsWith(c.href))
    : pathname === item.href || pathname.startsWith(item.href + "/");
}

function SidebarItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active = isLinkActive(item, pathname);
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        "group/sidebar-item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        item.cta && "bg-accent text-accent-foreground hover:bg-accent/80",
        !item.cta &&
          (active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"),
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {!collapsed && <span className="me-auto truncate">{item.title}</span>}
      {!collapsed && item.badge != null && (
        <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 text-xs font-medium">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={content} />
        <TooltipContent side="inline-end">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function SidebarGroup({
  section,
  collapsed,
}: {
  section: (typeof navSections)[number];
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const group = section.items[0];
  const defaultOpen = !group?.children?.length
    ? true
    : group.children.some((c) => pathname.startsWith(c.href));

  if (!group?.children?.length) {
    return <SidebarItemLink item={group} collapsed={collapsed} />;
  }

  return (
    <div data-slot="sidebar-group">
      {collapsed ? (
        <SidebarGroupCollapsed group={group} />
      ) : (
        <SidebarGroupExpanded group={group} defaultOpen={defaultOpen} />
      )}
    </div>
  );
}

function SidebarGroupExpanded({
  group,
  defaultOpen,
}: {
  group: NavItem;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const Icon = group.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-sidebar-foreground hover:bg-sidebar-accent/60 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      >
        {Icon && <Icon className="size-4 shrink-0" />}
        <span className="me-auto">{group.title}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform rtl:-scale-x-100",
            open && "rotate-180 rtl:rotate-0",
          )}
        />
      </button>
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0">
          <div className="border-sidebar-border ms-1 border-s-2 ps-2">
            {group.children!.map((child) => (
              <SidebarItemLink key={child.href} item={child} collapsed={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarGroupCollapsed({ group }: { group: NavItem }) {
  const Icon = group.icon;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={group.href}
            className="text-sidebar-foreground hover:bg-sidebar-accent/60 flex w-full items-center justify-center rounded-lg px-3 py-2 transition-colors"
          >
            {Icon && <Icon className="size-4 shrink-0" />}
          </Link>
        }
      />
      <TooltipContent side="inline-end">{group.title}</TooltipContent>
    </Tooltip>
  );
}

const SIDEBAR_MEDIA_QUERY = "(max-width: 1023px)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(SIDEBAR_MEDIA_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(SIDEBAR_MEDIA_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function Sidebar() {
  const autoCollapsed = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [overridden, setOverridden] = React.useState<boolean | null>(null);
  const collapsed = overridden ?? autoCollapsed;

  const setCollapsed: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
    setOverridden(typeof value === "function" ? value(collapsed) : value);
  };

  const [companyName, setCompanyName] = React.useState(appName);
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { settings?: Record<string, string> } | null) => {
        const name = body?.settings?.["company.name"]?.trim();
        if (!cancelled && name) setCompanyName(name);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <aside
        data-slot="sidebar"
        data-collapsed={collapsed}
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-svh shrink-0 flex-col border-e transition-[width] duration-200 lg:flex",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <div className="border-sidebar-border flex h-14 items-center gap-2 border-b px-3">
          <div className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Store className="size-4" />
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{companyName}</span>
              <span className="text-muted-foreground text-xs">{appVersion}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navSections.map((section, i) => (
            <SidebarGroup key={i} section={section} collapsed={collapsed} />
          ))}
        </nav>
      </aside>
    </SidebarContext.Provider>
  );
}
