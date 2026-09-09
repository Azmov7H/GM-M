"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateFilter({
  initialFrom,
  initialTo,
  onApply,
}: {
  initialFrom: string;
  initialTo: string;
  onApply: (from: string, to: string) => void;
}) {
  const [from, setFrom] = React.useState(initialFrom);
  const [to, setTo] = React.useState(initialTo);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label>من تاريخ</Label>
        <Input
          dir="ltr"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label>إلى تاريخ</Label>
        <Input
          dir="ltr"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-40"
        />
      </div>
      <Button variant="outline" onClick={() => onApply(from, to)}>
        تطبيق
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          setFrom("");
          setTo("");
          onApply("", "");
        }}
      >
        مسح
      </Button>
    </div>
  );
}
