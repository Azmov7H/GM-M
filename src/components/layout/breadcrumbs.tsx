"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navSections } from "@/config/navigation";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function findTrail(pathname: string) {
  const result: { title: string; href: string; current: boolean }[] = [];

  for (const section of navSections) {
    for (const item of section.items) {
      if (pathname === item.href) {
        result.push({ title: item.title, href: item.href, current: true });
        return result;
      }
      for (const child of item.children ?? []) {
        if (pathname === child.href || pathname.startsWith(child.href + "/")) {
          result.push({ title: item.title, href: item.href, current: false });
          result.push({ title: child.title, href: child.href, current: true });
          return result;
        }
      }
    }
  }

  return result;
}

export function Breadcrumbs({ max = 4 }: { max?: number }) {
  const pathname = usePathname();
  const trail = findTrail(pathname);

  if (trail.length === 0) {
    return null;
  }

  const visible = trail.slice(-max);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.length > max && (
          <BreadcrumbItem>
            <span className="text-muted-foreground">…</span>
          </BreadcrumbItem>
        )}
        {visible.map((crumb, i) => {
          const isLast = i === visible.length - 1;
          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
