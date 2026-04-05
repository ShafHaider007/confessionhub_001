<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Project: SpatialX

Full-stack **geospatial** app (Sentinel Hub JS on the server, MongoDB, Next.js 16). Branding and Cursor rules: **`.cursor/rules/spatialx.mdc`**.

---

## Autocomplete / agent steps (follow in order)

Use this checklist so suggestions and edits stay consistent with this repo and the installed Next.js version.

1. **Confirm the API** — Open the matching topic under `node_modules/next/dist/docs/` (e.g. App Router, `route.ts`, `fetch`, caching). Do not assume patterns from older Next.js or from memory alone.

2. **Server vs client** — Default to Server Components. Add `"use client"` only when you need hooks, browser APIs, or event handlers in that file.

3. **API routes** — Use App Router handlers: `src/app/api/<segment>/route.ts` exporting named functions (`GET`, `POST`, etc.). Return `Response` or `NextResponse` per current docs.

4. **Database** — Call the default export from `src/lib/dbConnect.ts` before Mongoose calls. Require `process.env.MONGODB_URI` on the server; never commit secrets or paste `.env` into chat.

5. **Validation** — Reuse Zod schemas in `src/schemas/` (`signUpSchema`, `signInSchema`, `verifySchema`, `messageSchema`, `acceptMessageSchema`). Align field names and rules with `src/model/User.ts`.

6. **Types** — Use shared response shapes from `src/types/` (e.g. `ApiResponse`) so route handlers and clients stay typed the same way.

7. **Email** — Use `src/lib/resend.ts` and `src/lib/helpers/sendVerificationEmail.ts` with templates under `emails/` when touching verification or transactional mail.

8. **Lint and build** — After edits, run `npm run lint` and `npm run build` when the change touches routes, imports, or types.

9. **Scope** — Change only what the task needs; match existing naming, imports, and formatting in nearby files.

---

## Quick map

| Area        | Location |
|------------|----------|
| Pages / UI | `src/app/` |
| API        | `src/app/api/` |
| Dashboard shell | `src/app/dashboard/layout.tsx` (Server Component); interactive chrome in `DashboardHeader.tsx` (`"use client"`) to avoid shell hydration mismatches |
| Map UI     | `src/components/map/` (MapLibre basemap + Deck.gl overlay); **`MapImportToolbar.tsx`** — compact **Import** control (collapsed pill / mobile bottom sheet, desktop card); first category **Vectors & PMTiles** (GeoJSON / shapefile ZIP ≤ **15 MB** via `parseVectorImportFile.ts`, `.pmtiles` ≤ **500 MB** via `PMTilesMVTLayer`); raw files **over 15 MB** → `LargeFileGuidancePanel.tsx`; signed-in **`/dashboard/map`** |
| Mongoose   | `src/model/User.ts` |
| Zod        | `src/schemas/` |
| DB helper  | `src/lib/dbConnect.ts` |
| Email      | `src/lib/resend.ts`, `src/lib/helpers/sendVerificationEmail.ts`, `emails/` |
