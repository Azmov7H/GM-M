import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen p-8">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            نظام الجماز
          </h1>
          <p className="text-muted-foreground text-lg">
            نظام إدارة المخزون ونقطة البيع
          </p>
          <Badge variant="secondary" className="mt-4">
            الإصدار 0.1.0
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                إدارة المنتجات والمخزون
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نقطة البيع</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                معالجة المبيعات وال Transactions
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
