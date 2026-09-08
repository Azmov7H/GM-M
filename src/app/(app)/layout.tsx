import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import AppShell from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return <AppShell>{children}</AppShell>;
}
