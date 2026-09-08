"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SessionUser {
  displayName: string;
  username: string;
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: SessionUser } | null) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onLogout = async () => {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {user && (
        <span className="text-muted-foreground hidden max-w-32 truncate text-sm sm:inline">
          {user.displayName}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="تسجيل الخروج"
        title="تسجيل الخروج"
        onClick={onLogout}
        disabled={pending}
      >
        <LogOut />
      </Button>
    </div>
  );
}
