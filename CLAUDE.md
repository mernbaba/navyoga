# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (lockfile is `pnpm-lock.yaml`; do not introduce `npm install` or `yarn`).

| Command | What it does |
|---|---|
| `pnpm dev` | Vite dev server (also exposed on LAN — `vite.config.ts` sets `server.host: true`) |
| `pnpm build` | `tsc -b && vite build` — type errors fail the build (see "Pre-existing TS errors" below) |
| `pnpm preview` | Serve the production build locally on port 5173 |
| `pnpm lint` | Type-check only (`tsc -b --noEmit`). **There is no ESLint configured** — this script is misnamed. |

There is no test runner configured.

To add a shadcn component: `pnpm dlx shadcn@latest add <name>` — installs into `src/components/ui/`. Aliases live in `components.json`; the path alias resolves via `tsconfig.json` (root) `baseUrl` + `paths`, which is the file shadcn CLI reads (not `tsconfig.app.json`).

## Stack

- **Vite 8** with `@vitejs/plugin-react`. Vite 8 uses the **Rolldown** bundler — stricter than Rollup about missing named exports. If a build fails on `MISSING_EXPORT`, fix the import rather than working around it.
- **React 19** + TypeScript 6 (strict mode, project references via `tsconfig.app.json` / `tsconfig.node.json`).
- **Tailwind CSS v4** via `@tailwindcss/vite` — CSS-first config, **no `tailwind.config.js`**. Everything lives in **`src/index.css`**: the `@import "tailwindcss"` + `@import "tw-animate-css"` lines, theme tokens for `:root` and `.dark`, the `@theme inline` block that maps tokens to Tailwind utilities, and base typography in `@layer base`.
- **shadcn/ui** ("new-york" style, neutral base, lucide icons). Configured via `components.json`. **Important:** the `utils` alias is `@/components/ui/utils` (not the default `@/lib/utils`) — `cn()` lives there.
- **react-router v7** (declarative `createBrowserRouter` config in `src/routes.tsx`, not framework mode).
- **Icons**: `lucide-react` (v1, primary) plus `react-icons` (used for brand icons like Facebook/Twitter that lucide v1 removed for trademark reasons).

Path alias `@/*` → `src/*` is set in three places that must stay in sync: `tsconfig.json`, `tsconfig.app.json`, and `vite.config.ts`.

## Architecture

This is a **frontend-only SPA** for a yoga studio admin/management product. There is **no backend integration** — all data is hard-coded in `src/data/mockData.ts` and "auth" is a localStorage flag.

### Multi-role routing

The app has **five distinct user-role surfaces**, each with its own layout component and route subtree, all defined centrally in `src/routes.tsx`:

| Path prefix | Layout | Pages folder |
|---|---|---|
| `/` | `AdminLayout` | `src/pages/*` (top-level) |
| `/tutor` | `TutorLayout` | `src/pages/tutor/*` |
| `/frontline` | `FrontlineLayout` | `src/pages/frontline/*` |
| `/operations` | `OperationsLayout` | `src/pages/operations/*` |
| `/user` | `UserLayout` | `src/pages/user/*` |

When adding a page: create the page component under the matching role folder, then register it in `src/routes.tsx`. The navigation menu is hard-coded inside each `*Layout.tsx` component — adding a route is not enough; the layout's nav array must also be updated.

### Auth (mocked)

`src/routes.tsx` defines a `ProtectedRoute` wrapper that reads `localStorage.isAuthenticated`. `Login.tsx`/`LoginMinimal.tsx` set both `isAuthenticated` and `userRole` in localStorage; the `*Layout` logout handlers clear them. There is **no real auth check** — anyone who sets the localStorage key bypasses the gate. Treat this as scaffolding to be replaced when a real backend lands.

### Data layer

`src/data/mockData.ts` exports both the TypeScript interfaces (`Student`, `Tutor`, `Class`, `AttendanceRecord`, `Payment`, etc.) **and** the seed data arrays. Pages import these directly. When adding a new domain entity, add the interface and seed array here; do not scatter mock data across page files.

### Styling conventions

- Brand palette: primary purple `#610981`, secondary orange `#ff691d`, accent peach `#ffac96`. Use the CSS variables from `src/index.css` (`--primary`, `--heading-color`, `--gradient-primary`, etc.) rather than hardcoding hex values.
- Layouts make heavy use of `backdrop-blur`, gradient blob backgrounds, and animated `*-pulse` effects — match this aesthetic when adding new screens to the same role.

## Pre-existing TS errors (block `pnpm build`)

`pnpm build` runs `tsc -b` which currently fails on five errors. They predate any fresh work; fix them before assuming a build break is yours:

- `src/components/ui/calendar.tsx:13-14` — imports `@/app/components/ui/utils` and `@/app/components/ui/button` (stale paths from when the source layout was flattened from `src/app/` to `src/`). The file isn't imported anywhere — either delete it or rewrite the imports as `@/components/ui/utils` and `@/components/ui/button` (and note v9 of `react-day-picker` would also need an API rewrite — see Gotchas).
- `src/pages/Classes.tsx:30` — local mock data is missing `tutor` and `enrolledStudents` fields required by the `Class` interface in `mockData.ts`.
- `src/pages/tutor/TutorClasses.tsx:26` — references a non-existent `instructor` field on `Class` (the interface uses `tutor`).
- `src/pages/operations/OperationsNotifications.tsx:478` — missing null check on `selectedNotification.openRate`.

`pnpm exec vite build` (skipping the typecheck) succeeds. The errors are real, but the runtime artifact ships fine.

## Gotchas

- **`react-day-picker@8.10.1`** declares React 16/17/18 peer support only and emits a peer-dep warning under React 19. Its only consumer is `src/components/ui/calendar.tsx`, which is **not imported anywhere** (see above). If you need the calendar, upgrade to v9 (API rewrite required: `caption_label`, `nav_button*`, `head_row`, `day_*` classNames are gone; `IconLeft`/`IconRight` are now a single `Chevron` slot).
- **`tailwindcss` and `tw-animate-css`** look unused to dependency scanners (depcheck etc.) because they're loaded via CSS imports, not JS. Don't remove them.
- **Lucide v1 removed brand icons** (Facebook, Twitter, etc.). For social/brand icons use `react-icons` instead.
- **`src/components/ScrollToTopButton.jsx`** is the only `.jsx` (non-TS) file in the codebase — keep new code as `.tsx`.
