"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PosProduct {
  id: string;
  code: string;
  name: string;
  buyPrice: number;
  retailPrice: number;
}

export interface PosWarehouse {
  id: string;
  name: string;
}

export interface PosCustomer {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
}

interface CartLine {
  key: string;
  productId: string | null;
  code: string;
  name: string;
  buyPrice: number;
  unitPrice: number;
  quantity: number;
  isService: boolean;
}

const NO_CUSTOMER = "__walkin__";

let lineSeq = 0;
function newKey() {
  lineSeq += 1;
  return `line_${Date.now()}_${lineSeq}`;
}

export function PosTerminal({
  warehouses,
  customers,
  defaultWarehouseId,
}: {
  warehouses: PosWarehouse[];
  customers: PosCustomer[];
  defaultWarehouseId: string;
}) {
  const router = useRouter();
  const focusSearch = () => document.getElementById("pos-search")?.focus();
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<PosProduct[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [warehouseId, setWarehouseId] = React.useState(defaultWarehouseId);
  const [customerId, setCustomerId] = React.useState(NO_CUSTOMER);
  const [paymentType, setPaymentType] = React.useState("cash");
  const [paidAmount, setPaidAmount] = React.useState("");
  const [discount, setDiscount] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [serviceOpen, setServiceOpen] = React.useState(false);
  const [serviceName, setServiceName] = React.useState("");
  const [servicePrice, setServicePrice] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [confirmBelowCost, setConfirmBelowCost] = React.useState<null | {
    lines: { productName: string }[];
  }>(null);
  const [success, setSuccess] = React.useState<null | {
    invoiceNumber: number;
    id: string;
  }>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const subtotal = cart.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - Math.min(discountValue, subtotal));
  const paidValue = paidAmount.trim() === "" ? total : Number(paidAmount);
  const change = paidValue - total;

  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(value.trim())}`,
        );
        const data = (await res.json()) as { products?: PosProduct[] };
        setResults(data.products ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  };

  const addProduct = (p: PosProduct) => {
    setCart((c) => {
      const existing = c.find((l) => l.productId === p.id && !l.isService);
      if (existing) {
        return c.map((l) =>
          l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...c,
        {
          key: newKey(),
          productId: p.id,
          code: p.code,
          name: p.name,
          buyPrice: p.buyPrice,
          unitPrice: p.retailPrice,
          quantity: 1,
          isService: false,
        },
      ];
    });
    setSearch("");
    setResults([]);
    focusSearch();
  };

  const updateLine = (key: string, patch: Partial<CartLine>) =>
    setCart((c) => c.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const removeLine = (key: string) => setCart((c) => c.filter((l) => l.key !== key));

  const addServiceItem = () => {
    if (!serviceName.trim()) return;
    setCart((c) => [
      ...c,
      {
        key: newKey(),
        productId: null,
        code: "SERVICE",
        name: serviceName.trim(),
        buyPrice: 0,
        unitPrice: Number(servicePrice) || 0,
        quantity: 1,
        isService: true,
      },
    ]);
    setServiceName("");
    setServicePrice("");
    setServiceOpen(false);
  };

  const submitSale = async (allowBelowCost: boolean) => {
    setError(null);
    if (cart.length === 0) {
      setError("السلة فارغة. أضف صنفاً واحداً على الأقل");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({
            productId: l.productId,
            productName: l.isService ? l.name : undefined,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            warehouseId,
            isService: l.isService,
          })),
          customerId: customerId === NO_CUSTOMER ? null : customerId,
          discount: discountValue,
          tax: 0,
          paymentType,
          paidAmount:
            paymentType === "credit"
              ? paidAmount.trim() === ""
                ? 0
                : Number(paidAmount)
              : total,
          notes: notes || null,
          allowBelowCost,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        belowCost?: boolean;
        belowCostLines?: { productName: string }[];
        invoiceNumber?: number;
        id?: string;
      } | null;
      if (res.status === 409 && data?.belowCost) {
        setConfirmBelowCost({ lines: data.belowCostLines ?? [] });
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "فشل إتمام البيع");
        return;
      }
      setSuccess({ invoiceNumber: data!.invoiceNumber!, id: data!.id! });
      setCart([]);
      setDiscount("0");
      setPaidAmount("");
      setNotes("");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      const inSearch = document.activeElement?.id === "pos-search";
      if (e.key === "F2") {
        e.preventDefault();
        focusSearch();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        focusSearch();
      } else if (e.key === "Enter" && inSearch && results.length > 0) {
        e.preventDefault();
        addProduct(results[0]);
      } else if (e.key === "Escape" && inSearch) {
        setSearch("");
        setResults([]);
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        void submitSale(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    results,
    cart,
    warehouseId,
    customerId,
    paymentType,
    paidAmount,
    discount,
    notes,
    total,
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardContent className="flex flex-col gap-2 py-4">
            <Label htmlFor="pos-search">
              بحث عن صنف (F2 للتركيز، Enter لإضافة الأول)
            </Label>
            <SearchInput
              id="pos-search"
              placeholder="ابحث بالاسم أو الرمز..."
              value={search}
              onValueChange={handleSearchChange}
            />
            {searching && <p className="text-muted-foreground text-xs">جارٍ البحث...</p>}
            {results.length > 0 && (
              <ul
                className="divide-y rounded-lg border"
                role="listbox"
                aria-label="نتائج البحث"
              >
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => addProduct(p)}
                      className="hover:bg-muted flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm"
                    >
                      <span>
                        {p.name}{" "}
                        <span dir="ltr" className="text-muted-foreground">
                          ({p.code})
                        </span>
                      </span>
                      <span dir="ltr" className="font-medium">
                        {p.retailPrice}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <Button variant="outline" size="sm" onClick={() => setServiceOpen(true)}>
                إضافة صنف خدمي
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>السلة ({cart.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                السلة فارغة — ابحث وأضف الأصناف
              </p>
            ) : (
              cart.map((line) => {
                const belowCost = !line.isService && line.unitPrice < line.buyPrice;
                return (
                  <div
                    key={line.key}
                    className="flex flex-wrap items-center gap-2 rounded-lg border p-2"
                  >
                    <div className="min-w-32 flex-1">
                      <p className="text-sm font-medium">{line.name}</p>
                      <p dir="ltr" className="text-muted-foreground text-xs">
                        {line.code}
                      </p>
                      {belowCost && <Badge variant="destructive">أقل من التكلفة</Badge>}
                      {line.isService && <Badge variant="outline">خدمي</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="إنقاص الكمية"
                        onClick={() =>
                          updateLine(line.key, {
                            quantity: Math.max(1, line.quantity - 1),
                          })
                        }
                      >
                        <Minus />
                      </Button>
                      <Input
                        dir="ltr"
                        inputMode="numeric"
                        aria-label={`كمية ${line.name}`}
                        className="h-7 w-16 text-center"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.key, {
                            quantity: Math.max(
                              1,
                              Math.floor(Number(e.target.value)) || 1,
                            ),
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="زيادة الكمية"
                        onClick={() =>
                          updateLine(line.key, { quantity: line.quantity + 1 })
                        }
                      >
                        <Plus />
                      </Button>
                    </div>
                    <Input
                      dir="ltr"
                      inputMode="decimal"
                      aria-label={`سعر ${line.name}`}
                      className="h-7 w-24"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(line.key, { unitPrice: Number(e.target.value) || 0 })
                      }
                    />
                    <span dir="ltr" className="w-20 text-end text-sm font-medium">
                      {(line.quantity * line.unitPrice).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`حذف ${line.name}`}
                      onClick={() => removeLine(line.key)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>الدفع</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pos-warehouse">المخزن</Label>
              <Select
                value={warehouseId}
                onValueChange={(v) => setWarehouseId(v ?? defaultWarehouseId)}
              >
                <SelectTrigger id="pos-warehouse" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pos-customer">العميل (اختياري — مطلوب للآجل)</Label>
              <Select
                value={customerId}
                onValueChange={(v) => setCustomerId(v ?? NO_CUSTOMER)}
              >
                <SelectTrigger id="pos-customer" className="w-full">
                  <SelectValue placeholder="عميل نقدي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CUSTOMER}>عميل نقدي</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pos-payment">طريقة الدفع</Label>
              <Select
                value={paymentType}
                onValueChange={(v) => setPaymentType(v ?? "cash")}
              >
                <SelectTrigger id="pos-payment" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="credit">آجل</SelectItem>
                  <SelectItem value="bank">تحويل بنكي</SelectItem>
                  <SelectItem value="wallet">محفظة</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pos-discount">خصم</Label>
                <Input
                  id="pos-discount"
                  dir="ltr"
                  inputMode="decimal"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pos-paid">المدفوع</Label>
                <Input
                  id="pos-paid"
                  dir="ltr"
                  inputMode="decimal"
                  placeholder={String(total.toFixed(2))}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pos-notes">ملاحظات</Label>
              <Input
                id="pos-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="bg-muted/50 flex flex-col gap-1 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span>المجموع الفرعي</span>
                <span dir="ltr">{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>الخصم</span>
                <span dir="ltr">{Math.min(discountValue, subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>الإجمالي</span>
                <span dir="ltr">{total.toFixed(2)}</span>
              </div>
              {paymentType !== "credit" && (
                <div className="flex justify-between">
                  <span>الباقي للعميل</span>
                  <span dir="ltr">{Math.max(0, change).toFixed(2)}</span>
                </div>
              )}
            </div>
            {error && (
              <p
                role="alert"
                className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}
            {success && (
              <p
                role="status"
                className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm"
              >
                تم إنشاء الفاتورة #{success.invoiceNumber} —{" "}
                <a href={`/sales/invoices/${success.id}`} className="underline">
                  عرض الفاتورة
                </a>
              </p>
            )}
            <Button
              onClick={() => void submitSale(false)}
              disabled={submitting || cart.length === 0}
            >
              {submitting ? "جارٍ إتمام البيع..." : "إتمام البيع (Ctrl+Enter)"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>صنف خدمي</DialogTitle>
            <DialogDescription>صنف بلا مخزون — مثل التوصيل أو التركيب</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="service-name">اسم الخدمة</Label>
              <Input
                id="service-name"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="service-price">السعر</Label>
              <Input
                id="service-price"
                dir="ltr"
                inputMode="decimal"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={addServiceItem} disabled={!serviceName.trim()}>
                إضافة للسلة
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmBelowCost !== null}
        onOpenChange={(open) => !open && setConfirmBelowCost(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بيع بأقل من التكلفة</DialogTitle>
            <DialogDescription>
              الأصناف التالية بسعر أقل من سعر الشراء:{" "}
              {(confirmBelowCost?.lines ?? []).map((l) => l.productName).join("، ")}. هل
              تريد المتابعة؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBelowCost(null)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                setConfirmBelowCost(null);
                void submitSale(true);
              }}
            >
              تأكيد البيع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
