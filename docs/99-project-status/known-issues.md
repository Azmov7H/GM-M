# Known Issues

## Hardware Issues

| ID     | Issue                            | Severity | Status | Notes                                                       |
| ------ | -------------------------------- | -------- | ------ | ----------------------------------------------------------- |
| HW-001 | Vitest bus error on AMD A8-8600B | High     | Open   | `Bus error (core dumped)` on `vitest run`                   |
| HW-002 | Next.js build bus error          | High     | Open   | `Bus error` on `next build` with both Turbopack and webpack |
| HW-003 | `npm run dev` port binding fails | High     | Open   | Port 3000 binds but requests hang on Node 24                |

## Attempted Resolutions

| Attempt                   | Result                            |
| ------------------------- | --------------------------------- |
| Downgrade vitest to 3.2.7 | Still bus error                   |
| Use `--jitless` flag      | Bypasses bus error but WASM fails |
| Node.js 20                | Port binds but compilation hangs  |
| Node.js 22                | Not yet tested                    |

## Next Steps

1. Test with Node.js 22 LTS (`nvm use 22`)
2. If Node 22 works, update `.nvmrc` to `22`
3. If Node 22 fails, document as known hardware limitation

## Non-Hardware Issues

| ID     | Issue                               | Severity | Status | Notes                                               |
| ------ | ----------------------------------- | -------- | ------ | --------------------------------------------------- |
| SW-001 | shadcn form component not generated | Low      | Open   | CLI silently failed; component was created manually |
| SW-002 | components.json has `rtl: false`    | Low      | Open   | Needs update for RTL support                        |

## Resolved Issues

| ID  | Issue    | Resolution |
| --- | -------- | ---------- |
| —   | None yet | —          |
