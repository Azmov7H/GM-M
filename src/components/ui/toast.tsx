"use client";

import * as React from "react";
import {
  Toast as ToastPrimitive,
  type ToastManagerAddOptions,
} from "@base-ui/react/toast";
import { CheckCircle2, Info, TriangleAlert, XCircle, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastData {
  variant?: ToastVariant;
}

export const toastManager = ToastPrimitive.createToastManager<ToastData>();

const variantIcon: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="text-success size-4" />,
  error: <XCircle className="text-destructive size-4" />,
  warning: <TriangleAlert className="text-warning size-4" />,
  info: <Info className="text-info size-4" />,
};

function toast(options: ToastManagerAddOptions<ToastData>) {
  return toastManager.add(options);
}

toast.success = (title: string, description?: string) =>
  toastManager.add({ title, description, data: { variant: "success" } });

toast.error = (title: string, description?: string) =>
  toastManager.add({ title, description, data: { variant: "error" } });

toast.warning = (title: string, description?: string) =>
  toastManager.add({ title, description, data: { variant: "warning" } });

toast.info = (title: string, description?: string) =>
  toastManager.add({ title, description, data: { variant: "info" } });

toast.close = (id?: string) => toastManager.close(id);

function ToastRoot({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      {...props}
      className={cn(
        "border-border bg-popover text-popover-foreground absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] w-full origin-bottom [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] border shadow-sm select-none [--gap:0.5rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.5rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] data-ending-style:opacity-0 data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))] data-limited:opacity-0 data-starting-style:[transform:translateY(150%)] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]",
        className,
      )}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex items-start gap-3 overflow-hidden p-3 transition-opacity duration-200 data-behind:opacity-0 data-expanded:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed top-1 right-1 z-[999] flex w-[calc(100vw-2rem)] max-w-sm flex-col-reverse gap-0 sm:top-2 sm:right-2",
        className,
      )}
      {...props}
    />
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager<ToastData>();
  return toasts.map((item) => {
    const variant = item.data?.variant ?? "info";
    return (
      <ToastRoot key={item.id} toast={item}>
        <ToastContent>
          <span className="mt-0.5 shrink-0">{variantIcon[variant]}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <ToastPrimitive.Title className="text-sm font-semibold" />
            <ToastPrimitive.Description className="text-muted-foreground text-sm" />
          </div>
          <ToastPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="إغلاق"
                className="-me-1 -mt-1 shrink-0"
              />
            }
          >
            <XIcon />
          </ToastPrimitive.Close>
        </ToastContent>
      </ToastRoot>
    );
  });
}

function ToastProvider({ children, ...props }: ToastPrimitive.Provider.Props) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} {...props}>
      {children}
      <ToastViewport>
        <ToastList />
      </ToastViewport>
    </ToastPrimitive.Provider>
  );
}

export { ToastProvider, toast };
