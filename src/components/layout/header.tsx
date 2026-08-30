"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { openQuickSearch } from "@/components/layout/command-palette";
import { SidebarCollapseToggle } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

export function Header({ className }: { className?: string }) {
  return (
    <header
      data-slot="header"
      className={cn(
        "bg-background border-sidebar-border sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3",
        className,
      )}
    >
      <SidebarCollapseToggle className="hidden lg:inline-flex" />
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <button
        type="button"
        onClick={openQuickSearch}
        className="border-input text-muted-foreground hover:bg-muted inline-flex h-8 w-44 items-center gap-2 rounded-lg border bg-transparent px-2.5 text-sm transition-colors max-md:hidden"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-start">بحث سريع...</span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none">
          Ctrl K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="بحث سريع"
        onClick={openQuickSearch}
        className="md:hidden"
      >
        <Search />
      </Button>
    </header>
  );
}
