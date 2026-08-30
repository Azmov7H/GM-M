"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";

import { navSections } from "@/config/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

let openPalette: (() => void) | null = null;

export function openQuickSearch() {
  openPalette?.();
}

export function quickSearchItems() {
  return navSections.flatMap((section) =>
    section.items.flatMap((item) => [
      { title: item.title, href: item.href, icon: item.icon, keyword: item.keyword },
      ...(item.children ?? []).map((child) => ({
        title: child.title,
        href: child.href,
        icon: child.icon,
        keyword: child.keyword,
      })),
    ]),
  );
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    openPalette = () => setOpen(true);

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => {
      openPalette = null;
      document.removeEventListener("keydown", down);
    };
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const items = quickSearchItems();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] max-w-lg overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">بحث سريع</DialogTitle>
        <DialogDescription className="sr-only">
          ابحث عن صفحة للانتقال إليها
        </DialogDescription>
        <Command className="overflow-hidden">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <Command.Input
              placeholder="اكتب للبحث... (Ctrl+K)"
              className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-1">
            <Command.Empty className="text-muted-foreground py-6 text-center text-sm">
              لا توجد نتائج
            </Command.Empty>
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.href + i}
                  value={`${item.title} ${item.keyword} ${item.href}`}
                  onSelect={() => navigate(item.href)}
                  className="focus:bg-accent focus:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm outline-none select-none"
                >
                  {Icon && <Icon className="text-muted-foreground size-4 shrink-0" />}
                  <span>{item.title}</span>
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
