# Design System Plan

## Color Strategy

### Primary Palette

| Token                  | Usage                     | Light                  | Dark                   |
| ---------------------- | ------------------------- | ---------------------- | ---------------------- |
| `--primary`            | Buttons, links, accents   | `oklch(0.45 0.15 250)` | `oklch(0.65 0.15 250)` |
| `--primary-foreground` | Text on primary           | White                  | White                  |
| `--secondary`          | Secondary buttons, badges | `oklch(0.95 0.02 250)` | `oklch(0.25 0.02 250)` |
| `--accent`             | POS CTA, highlights       | `oklch(0.55 0.15 145)` | `oklch(0.65 0.15 145)` |
| `--destructive`        | Delete, errors            | `oklch(0.55 0.2 25)`   | `oklch(0.65 0.2 25)`   |

### Semantic Colors

| Token       | Usage                      |
| ----------- | -------------------------- |
| `--success` | Completed states, positive |
| `--warning` | Low stock, below cost      |
| `--info`    | Informational messages     |
| `--muted`   | Disabled, secondary text   |

### Background Colors

| Token          | Usage                      |
| -------------- | -------------------------- |
| `--background` | Page background            |
| `--card`       | Card background            |
| `--popover`    | Dialog/dropdown background |
| `--sidebar`    | Sidebar background         |

## Typography

### Font Stack

```css
--font-sans: "IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif;
--font-mono: "IBM Plex Mono", monospace;
```

### Scale

| Size | Token       | Usage                       |
| ---- | ----------- | --------------------------- |
| 12px | `text-xs`   | Labels, captions            |
| 14px | `text-sm`   | Secondary text, table cells |
| 16px | `text-base` | Body text, inputs           |
| 18px | `text-lg`   | Subheadings                 |
| 20px | `text-xl`   | Section titles              |
| 24px | `text-2xl`  | Page titles                 |
| 30px | `text-3xl`  | Dashboard KPIs              |

### Weights

| Weight         | Usage            |
| -------------- | ---------------- |
| 400 (regular)  | Body text        |
| 500 (medium)   | Labels, emphasis |
| 600 (semibold) | Headings         |
| 700 (bold)     | Page titles      |

**Rule:** No `font-black` (900). Maximum weight is 700 (bold).

## Spacing Scale

```
4px  → space-1 (tight padding)
8px  → space-2 (default padding)
12px → space-3 (card padding)
16px → space-4 (section gaps)
24px → space-6 (page sections)
32px → space-8 (page padding)
48px → space-12 (hero spacing)
```

## Border Radius

| Token         | Value | Usage                  |
| ------------- | ----- | ---------------------- |
| `--radius-sm` | 4px   | Badges, small elements |
| `--radius-md` | 6px   | Inputs, buttons        |
| `--radius-lg` | 8px   | Cards, dialogs         |
| `--radius-xl` | 12px  | Modals, sheets         |

## Shadows

| Token         | Usage                    |
| ------------- | ------------------------ |
| `--shadow-sm` | Subtle elevation (cards) |
| `--shadow-md` | Dialogs, dropdowns       |
| `--shadow-lg` | Modals, sheets           |

**Rule:** Minimal shadows. Use borders over shadows for separation.

## Component Standards

### Buttons

| Variant       | Usage             | Height |
| ------------- | ----------------- | ------ |
| `default`     | Primary actions   | 36px   |
| `secondary`   | Secondary actions | 36px   |
| `destructive` | Delete, dangerous | 36px   |
| `outline`     | Tertiary actions  | 36px   |
| `ghost`       | Inline actions    | 32px   |
| `link`        | Text links        | auto   |

### Inputs

| Type     | Height | Padding |
| -------- | ------ | ------- |
| Text     | 36px   | 12px    |
| Select   | 36px   | 12px    |
| Textarea | auto   | 12px    |

### Tables

| Property      | Value             |
| ------------- | ----------------- |
| Header bg     | Muted             |
| Header weight | 500 (medium)      |
| Row height    | 48px              |
| Cell padding  | 12px horizontal   |
| Border        | 1px border        |
| Hover         | Muted background  |
| RTL           | Text-align: right |

### Cards

| Property | Value                   |
| -------- | ----------------------- |
| Padding  | 16px-24px               |
| Border   | 1px border              |
| Shadow   | none (border preferred) |
| Hover    | Subtle shadow on hover  |

### Dialogs

| Property  | Value                                         |
| --------- | --------------------------------------------- |
| Max width | 480px (small), 640px (default), 800px (large) |
| Padding   | 24px                                          |
| Overlay   | 50% black                                     |
| Close     | X button top-left (RTL)                       |

## RTL Rules

1. All directional properties use logical properties (`ms-`, `me-`, `ps-`, `pe-`)
2. No `ml-*` or `mr-*` — use `ms-*` and `me-*` instead
3. No `left-*` or `right-*` — use `start-*` and `end-*` instead
4. Text alignment: `text-start` / `text-end` (not `text-left` / `text-right`)
5. Icons that indicate direction must be mirrored in RTL
6. Tables: header cells aligned to `text-start` (right in RTL)
7. Forms: labels above inputs, right-aligned
8. Dialogs: close button on top-left (RTL)
9. Navigation: active indicator on right edge (RTL)

## Data Visualization

### Charts

- **Primary library:** Recharts (already in Jammaz)
- **Colors:** Use semantic palette, not random colors
- **Charts to include:**
  - Line chart: Sales over time
  - Bar chart: Top products by sales
  - Pie chart: Payment type distribution
  - Donut chart: Stock distribution by location

### Status Indicators

| Status         | Color  | Usage                          |
| -------------- | ------ | ------------------------------ |
| Active/Success | Green  | Completed, active, paid        |
| Warning        | Yellow | Low stock, below cost, pending |
| Error/Danger   | Red    | Overdue, insufficient, error   |
| Info           | Blue   | Informational, draft           |
| Muted          | Gray   | Inactive, disabled             |

## Notification System

| Type    | Color  | Duration  |
| ------- | ------ | --------- |
| Success | Green  | 3 seconds |
| Error   | Red    | 5 seconds |
| Warning | Yellow | 4 seconds |
| Info    | Blue   | 3 seconds |

Use `sonner` toast library (already in Jammaz).
