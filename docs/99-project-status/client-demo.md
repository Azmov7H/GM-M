# Client Demo Script (~45 minutes)

Acceptance walkthrough of alli-jamm on a production build with seeded demo data.
Run `npm run build` + `npm run start`, migrate + seed a demo DB, open `/login`.

## 0. Setup (before the meeting)

- Production server running, projector-friendly browser zoom.
- Seeded DB: admin/admin123, demo products, customers, suppliers.
- One printed/paper note of the backup file location.

## 1. Intro (5 min)

- What the system is: Arabic RTL inventory + POS, works offline on the shop machine.
- Roles: owner sees everything; cashier sees POS + invoices; warehouse sees stock.

## 2. Point of Sale (10 min)

1. Log in as admin → الرئيسية dashboard with today's KPIs.
2. المبيعات → نقطة البيع: press `F2`, search "أرز", add 2 units.
3. Complete a **cash** sale → show the invoice in سجل الفواتير, print view.
4. Complete a **credit** sale for a customer → open the customer card, show new debt.
5. Try to oversell (quantity > stock) → show the friendly shortage message.

## 3. Returns + Purchasing (10 min)

1. مرتجع المبيعات: return 1 unit from the cash invoice → stock restored.
2. المخزون → أوامر الشراء: create a PO, receive it → stock increases in المخزن الرئيسي.
3. Show حركات المخزون audit trail for both operations.

## 4. Inventory + Counts (5 min)

1. المخزون الحالي: point out the low-stock highlight.
2. الجرد الفعلي: create a count, enter one quantity, approve → adjustment movement.

## 5. Money + Reports (5 min)

1. المالية → الديون: record a partial payment on the credit customer.
2. التقارير: sales report with date filter → export CSV; shortage report.

## 6. Admin + Safety (5 min)

1. النظام → المستخدمون: create a cashier, log in as them in a second window → show limited menu.
2. النظام → الإعدادات: create a backup, download it.
3. Restore: emphasize typed confirmation + automatic safety snapshot + logout.

## 7. Q&A + Acceptance (5 min)

- Record every feedback item with severity (blocker / nice-to-have).
- Confirm: default password change, daily backup routine, who gets admin.
- Acceptance sign-off when no blockers remain.
