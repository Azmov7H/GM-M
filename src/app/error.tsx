"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-4 p-8 text-center">
          <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive size-6" />
          </div>
          <h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1>
          <p className="text-muted-foreground">
            نعتذر عن هذا الخطأ. يرجى إعادة المحاولة أو التواصل مع الدعم الفني.
          </p>
          <Button onClick={reset}>إعادة المحاولة</Button>
        </div>
      </body>
    </html>
  );
}
