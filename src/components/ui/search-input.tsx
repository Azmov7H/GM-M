"use client";

import * as React from "react";
import { Search, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

function SearchInput({
  className,
  value,
  defaultValue,
  onValueChange,
  placeholder = "بحث...",
  debounce = 300,
  ...props
}: Omit<React.ComponentProps<"input">, "onChange" | "value" | "defaultValue"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  debounce?: number;
}) {
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const controlled = value !== undefined;
  const displayValue = controlled ? value : internal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (!controlled) {
      setInternal(next);
    } else {
      onValueChange?.(next);
    }
    if (debounce > 0) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (controlled) onValueChange?.(next);
      }, debounce);
    }
  };

  const clear = () => {
    if (!controlled) setInternal("");
    onValueChange?.("");
  };

  return (
    <div data-slot="search-input" className={cn("relative w-full", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
      <input
        type="search"
        data-slot="search-input-field"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent text-sm transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden",
          "ps-9 pe-8",
        )}
        {...props}
      />
      {displayValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="مسح البحث"
          onClick={clear}
          className="absolute end-1.5 top-1/2 -translate-y-1/2"
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}

export { SearchInput };
