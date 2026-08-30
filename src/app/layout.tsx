import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jammaz System - نظام الجماز",
  description: "Local-First Inventory & POS Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="flex min-h-full flex-col">
        <TooltipProvider delay={400}>
          <ToastProvider>{children}</ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
