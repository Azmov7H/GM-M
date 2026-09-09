# LOGIN WHITE SCREEN — AUDIT

**Date:** 2026-09-09
**URL:** https://gm-m.vercel.app/login?next=/
**Symptom:** Page loads (HTTP 200) but renders completely white. Console shows only benign CSS warnings.

---

## 1. Exact root cause

`ToastProvider` in `src/components/ui/toast.tsx` **silently discards the entire application subtree**.

```tsx
function ToastProvider(props: ToastPrimitive.Provider.Props) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} {...props}>
      <ToastViewport>
        <ToastList />
      </ToastViewport>
    </ToastPrimitive.Provider>
  );
}
```

`props` contains `children` (the whole app, passed from `src/app/layout.tsx`), but the
**explicit JSX children** (`<ToastViewport>…`) **override the spread `children`** — standard
React/JSX semantics: explicit children win over `{...props}` children. The app subtree is
dropped; only the (empty, no toasts) toast viewport renders. React is perfectly happy, so
there are **zero console errors, zero failed requests** — just a white page with the lone
toast-viewport `<div>` in the DOM.

Since `ToastProvider` wraps `{children}` in the **root layout**, EVERY route is blank
(`/login`, `/`, all pages), in every environment (dev, local prod, Vercel).

## 2. Evidence proving the root cause

- **Reproduced in a real browser engine** (headless Chromium via Playwright, installed
  locally for this investigation): `/login` → `innerText ""`, 0 inputs, 0 forms,
  0 console errors, 0 failed requests — identical on local prod build AND Vercel.
- **Bisect on dev server** (each step verified in headless browser):
  1. Baseline: blank.
  2. Replaced `<Suspense><LoginForm/></Suspense>` with static `<p>`: still blank
     → page content and `useSearchParams` exonerated.
  3. Removed `TooltipProvider`+`ToastProvider` from root layout: **page renders**
     ("نظام الجماز / سجّل الدخول للمتابعة").
  4. Restored `TooltipProvider` alone: renders → exonerated.
  5. Therefore `ToastProvider` is the sole cause.
- **DOM proof:** the only element in `<body>` besides scripts is the toast-viewport
  `<div>` — exactly what the buggy provider renders, nothing else.
- **Code proof:** Base UI's `ToastPrimitive.Provider` DOES render `children`
  (`node_modules/.../@base-ui/react/toast/provider/ToastProvider.mjs`, line 61:
  `children: […, children]`), but it receives the viewport as children instead of the
  app, because explicit JSX children replace the spread.
- **Uniqueness:** repo-wide grep for `{...props}>` with explicit JSX children finds
  exactly ONE instance — this provider. `TooltipProvider` wrapper has no explicit
  children, so its spread survives (confirmed working).
- All diagnostic edits were reverted; working tree was clean before the fix.

## 3. Files involved

- `src/components/ui/toast.tsx` (lines 116–124) — **the bug, and the only file changed**.
- `src/app/layout.tsx` (lines 30–34) — wraps app in `TooltipProvider`/`ToastProvider`
  (correct usage; unchanged).
- NOT involved: `src/app/login/page.tsx`, `src/components/auth/login-form.tsx`,
  `src/proxy.ts`, `next.config.ts`, `src/app/globals.css`, any API route, any service.

## 4. Production-only differences

**None for the white screen.** Reproduced identically on: `next dev`, local
`next build` + `next start` (both default/Turbopack and `--webpack` builds), and Vercel.
Vercel faithfully serves what the build produces; the defect is 100% application code.

Separate, pre-existing **production-only** issue found (NOT the white screen, NOT fixed
here — see §11): `POST /api/auth/login` on Vercel returns bare HTTP 500 with empty body,
while the identical local prod build returns correct `401 {"error":"…"}`.
Cause: `src/server/db/index.ts` opens `new Database("./data/app.db")` at import time;
on Vercel serverless the gitignored SQLite file does not exist (and the FS is
read-only outside `/tmp`), so any DB-importing route crashes. SQLite-file persistence
is architecturally incompatible with Vercel serverless regardless.

## 5. Why the CSS warnings are / are not related

**Not related.** The three warnings (`-webkit-text-size-adjust`,
`-moz-osx-font-smoothing`, `text-wrap`) come from Tailwind v4 preflight / Base UI
internals — a repo-wide grep confirms **none of these properties exist in `src/`**.
They are benign cross-browser notices (e.g. Chrome not recognizing a `-moz-` property)
and cannot blank a page. No CSS was changed.

## 6. Authentication flow analysis

Untouched and sound: `LoginForm` renders the form immediately (no mount-time API wait —
UI-first, matching the required pattern), POSTs credentials on submit, shows server
errors inline, routes to `next` (`/` default) + refresh on success. Invalid creds →
inline error; valid → redirect. Verified post-fix in headless browser against local prod
build (see regression section). No auth semantics changed.

## 7. Middleware analysis

`src/proxy.ts` verified correct, unchanged:

- Anonymous `GET /login…` → public path → `NextResponse.next()` (200, observed).
- Anonymous `GET /` → 307 to `/login?next=%2F` (observed).
- No `/login → /login` loop possible (only authenticated sessions redirect `/login → /`).
- `next` parameter preserved and internal (`router.push(next)` defaults to `/`).
- Matcher excludes `_next/static`, images, `favicon.ico`, files with extensions.

## 8. Environment variable analysis

Not a factor in the white screen (no env-dependent code on the render path; build and
prerender succeed). For login _functionality_ on Vercel, `SESSION_SECRET` must be set in
the Vercel dashboard (plus the §4/§11 database decision) — operational follow-up, no code
change.

## 9. Network/chunk analysis

All 17 JS chunks, CSS, and woff2 fonts referenced by prod HTML return HTTP 200 with
plausible sizes (probed individually). No 404/403/CORS/chunk-load failures. Server HTML
shell + React flight payload contain the full login card; the browser simply never
rendered it because the provider dropped it (see §2).

## 10. Minimal fix

Destructure `children` and render it explicitly alongside the viewport:

```tsx
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
```

No behavior change to toasts, manager wiring, or prop forwarding (`timeout`/`limit`
still spread through). No business logic, auth, DB, permission, session, middleware,
or routing changes.

## 11. Regression risks

- **Risk ≈ nil for the fix itself:** one wrapper component; children now render where
  React always expected them. Toast system behavior unchanged (viewport still mounted).
- **Residual prod risk (pre-existing, out of scope):** login API 500 on Vercel due to
  SQLite file DB on serverless (§4). After this fix deploys, the form will render but
  sign-in on Vercel will fail until the production database decision is made
  (e.g. Turso/libSQL, Vercel Postgres + Drizzle adapter, or a persistent host).
  Deliberately NOT addressed here per constraints (no DB-architecture changes).
- Playwright browsers were installed locally (`~/.cache/ms-playwright`) purely as a
  diagnostic tool; no project dependency or config was added.
