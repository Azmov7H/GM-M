"use client";

import { useEffect } from "react";
import { PageError } from "@/components/shared/page-error";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Segment error boundary caught:", error);
  }, [error]);

  return <PageError onReset={reset} />;
}
