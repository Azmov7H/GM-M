"use client";

import * as React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PageError({
  title = "حدث خطأ ما",
  description = "تعذّر تحميل هذه الصفحة. يرجع السبب غالباً إلى مشكلة مؤقتة.",
  onReset,
}: {
  title?: string;
  description?: string;
  onReset?: () => void;
}) {
  return (
    <div
      data-slot="page-error"
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center"
    >
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="text-destructive size-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      {onReset && (
        <Button onClick={onReset} className="mt-2">
          <RefreshCcw />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
