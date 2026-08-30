import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <FileQuestion className="text-muted-foreground size-6" />
      </div>
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">الصفحة المطلوبة غير موجودة.</p>
      <Button variant="outline" render={<Link href="/" />}>
        العودة للرئيسية
      </Button>
    </div>
  );
}
