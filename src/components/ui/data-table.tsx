"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

export interface DataTableColumn<T> {
  header: React.ReactNode;
  accessorKey?: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyTitle = "لا توجد بيانات",
  emptyDescription,
  emptyAction,
  className,
}: DataTableProps<T>) {
  return (
    <div data-slot="data-table" className={cn("rounded-xl border", className)}>
      {data.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col, i) => (
                <TableHead
                  key={col.accessorKey ?? i}
                  className={cn(
                    "text-muted-foreground bg-muted/50 h-11",
                    col.align === "center" && "text-center",
                    col.align === "end" && "text-end",
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((col, i) => (
                  <TableCell
                    key={col.accessorKey ?? i}
                    className={cn(
                      "py-2.5",
                      col.align === "center" && "text-center",
                      col.align === "end" && "text-end",
                      col.className,
                    )}
                  >
                    {col.cell
                      ? col.cell(row)
                      : String(
                          (row as Record<string, unknown>)[col.accessorKey ?? ""] ?? "",
                        )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
