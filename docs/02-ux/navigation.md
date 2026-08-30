# Navigation Design

## Sidebar Structure

### Desktop (≥1024px)

```
┌─────────────────────────────────┐
│  🏪 نظام الجماز                  │
│  GM-M v0.1.0                    │
├─────────────────────────────────┤
│  🏠 الرئيسية                     │
├─────────────────────────────────┤
│  💰 المبيعات ▾                  │
│    ├── نقطة البيع [CTA]          │
│    ├── سجل الفواتير              │
│    └── مرتجع المبيعات            │
├─────────────────────────────────┤
│  📦 المخزون ▾                   │
│    ├── المنتجات                  │
│    ├── المخزون الحالي            │
│    ├── حركات المخزون             │
│    ├── الجرد                     │
│    ├── التحويلات                 │
│    └── أوامر الشراء              │
├─────────────────────────────────┤
│  👥 العملاء والموردين ▾          │
│    ├── العملاء                   │
│    └── الموردين                  │
├─────────────────────────────────┤
│  💵 المالية ▾                   │
│    ├── الخزينة                   │
│    ├── الديون                    │
│    └── الحركات المالية           │
├─────────────────────────────────┤
│  📊 التقارير ▾                  │
│    ├── تقرير المبيعات            │
│    ├── التقارير المالية          │
│    ├── أرباح العملاء             │
│    ├── تاريخ الأسعار             │
│    └── النواقص                   │
├─────────────────────────────────┤
│  ⚙️ النظام ▾                    │
│    ├── المستخدمين                │
│    ├── الإعدادات                 │
│    └── سجل النشاط                │
├─────────────────────────────────┤
│  👤 [اسم المستخدم]              │
│  🚪 تسجيل الخروج                │
└─────────────────────────────────┘
```

### Tablet (768px–1023px)

- Collapsible sidebar (hamburger toggle)
- Icons only (no text labels)
- Tooltip on hover shows label
- Active section highlighted

### Mobile (<768px)

- Bottom navigation bar (5 items max)
- Primary: Dashboard, POS, Products, Stock, More
- "More" opens full navigation sheet

## Navigation Rules

1. **Active state:** Current page highlighted with accent color
2. **Grouping:** Related items under collapsible groups
3. **CTA:** POS button has accent styling (prominent)
4. **Badges:** Low stock count shown on Inventory group
5. **Role-based:** Items hidden if user lacks permission
6. **RTL:** All navigation right-to-left aligned
7. **Keyboard:** Arrow keys navigate, Enter selects, Escape closes

## Breadcrumbs

```
الرئيسية > المبيعات > سجل الفواتير > فاتورة #1234
```

- Maximum depth: 4 levels
- RTL aligned
- Clickable segments
- Current page not clickable

## Keyboard Shortcuts

| Shortcut | Action                   |
| -------- | ------------------------ |
| `Alt+1`  | Dashboard                |
| `Alt+2`  | POS                      |
| `Alt+3`  | Products                 |
| `Alt+4`  | Stock                    |
| `Ctrl+K` | Command palette (search) |
| `Escape` | Close dialog/drawer      |
| `Ctrl+S` | Save (in forms)          |
