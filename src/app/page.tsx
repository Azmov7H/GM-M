import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-8">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight">نظام الجماز</h1>
          <p className="text-muted-foreground text-lg">نظام إدارة المخزون ونقطة البيع</p>
          <Badge variant="secondary" className="mt-4">
            الإصدار 0.1.0
          </Badge>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">إدارة المنتجات والمخزون</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">نقطة البيع</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                معالجة المبيعات وال Transactions
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
