# Napnix Admin: UI/UX Revamp Plan

Date: 2026-10-11. Status: plan only, no source changed.
Scope: `Nexspire-admin` (React 19, Vite 7, Tailwind 4, React Query v5, Recharts).
Method: impeccable `audit` (a11y, performance, theming, responsive, implementation integrity) plus the redesign-audit protocol from `design-taste-frontend` (audit before touching, preserve IA/routes/copy, levers in order: type, spacing, color, motion). Everything below was measured from source with grep/line counts; nothing was browser-proven, so Phase 0 adds screenshot baselines before any visual change.

Design read: internal operator console for the founder and a small team, used daily for leads, clients, tenants and ops. Operate mode: scanability, consistency and trust beat expression. Dials: variance 2, motion 2, density 7.

---

## 1. Audit

### 1.1 Health score

| # | Dimension | Score | Key finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 1 | 300 light-mode `text-slate-400` (2.56:1), zero `focus-visible`, 455 `<label>` vs 14 `htmlFor` |
| 2 | Performance | 3 | Routes lazy; LeadsList refetches per keystroke; WorkflowEditor is one 2,550-line component |
| 3 | Theming | 1 | Tokens exist but are bypassed: 171 hex literals, 6,563 raw `slate-*` utilities, fuchsia accent unused |
| 4 | Responsive | 2 | Sidebar drawer works; 42 hand-rolled modals, wide tables, header search hidden below md |
| 5 | Implementation integrity | 1 | Shared components built then ignored; ~2,900 lines of dead duplicates |
| | **Total** | **8/20** | **Poor: systemic drift, not a reskin problem** |

### 1.2 Findings by severity (file:line)

**P0: integrity and wrong information**

1. **Dead duplicate code is drifting.** `src/pages/marketing/workflow/` (5 files: WorkflowNodeConfig 1,795, WorkflowNodes 208, WorkflowNodePanel 101, WorkflowToolbar 85, workflowConstants 57) is imported by nothing. `WorkflowEditor.jsx` redefines the same pieces locally: `SearchableSelect` at :6 (duplicate of `components/common/SearchableSelect.jsx`), node renderers at :114/:147/:209/:255, `NODE_PALETTE` at :304. The stale copy has 0 WhatsApp references vs 12 in the editor; commit `5685640` ("add whatsapp to local NODE_PALETTE") is the drift already biting. Same pattern in tenants: `TenantHeader/Billing/DangerZone/Domains/Infrastructure/Logs/Stats.jsx` (641 lines) are unused while `TenantDetail.jsx` is 1,564 lines.
2. **Header shows the wrong page title.** `components/layout/DashboardLayout.jsx:97-105` maps only 5 paths and falls back to "Dashboard", so Tenants, Settings, Expenses, etc. all say "Dashboard". Every page then renders its own `<h1>` too: two h1s per page in three sizes (`ClientsList.jsx:144` text-3xl gray-900, `Tenants.jsx:107` text-2xl, `SupportInbox.jsx:67` text-xl).
3. **Dashboard shows fabricated numbers.** `pages/Dashboard.jsx:28-30` hardcodes `change: '+0%'`, `isPositive: true` (always green up-arrow); `:83-84` shows hardcoded "My Tasks 12 / Pending Reviews 4" to every non-admin role; `:50-51` renders "Action Needed" with a down arrow in red.
4. **Orphaned routes.** 14 email-marketing routes (`App.jsx:130-143`) plus `/tools`, `/pricing`, `/api-docs`, `/smtp-accounts` appear in neither `Sidebar.jsx:206-255` nor `CommandPalette.jsx` (16 hardcoded paths). Two Campaigns and two SMTP pages coexist (`marketing/` vs `email-marketing/`) with no way to tell them apart.

**P1: accessibility and theming (WCAG AA failures)**

5. **Contrast.** 300 light-mode `text-slate-400` uses: 2.56:1 on white, 2.45:1 on slate-50. Examples: table headers `Dashboard.jsx:159`, nav section titles `Sidebar.jsx:304`, search icons. `dark:text-slate-500` (61 uses) is 3.07:1 on slate-800.
6. **Keyboard and labels.** 0 `focus-visible` styles, 125 `outline-none`. `Settings.jsx` has 25 labels and 0 `htmlFor`; app-wide 455 labels and 14 `htmlFor`. Header bell (`DashboardLayout.jsx:153`) is a dead button titled "No notifications". Hamburger at :119 has no aria-label.
7. **Theme leaks.** Theme class is applied in `useEffect` (`ThemeContext.jsx:17`), so a dark user sees a white flash on every load. Toasts are hardcoded indigo/emerald/red with coloured glows (`App.jsx:162-196`), identical in both themes. `utils/statusColors.js` (11 importers) has no dark variants. `SiteAnalytics.jsx:205,313,463` paints the map `#080c14` in light mode; `:715-717` grid `#e2e8f0` and ticks `#94a3b8` in dark mode. `DetailSidebar.jsx:98` gradient has no dark variant. 32 `bg-white` lines with no dark pair.
8. **Brand drift.** `index.css:10-20` brand scale is Tailwind indigo (`#4f46e5`), the most common AI-template accent, while the Napnix logo is blue `#0E6BEF` / navy `#081757`. The fuchsia `accent-*` scale (`index.css:22-31`) has 0 uses. `--font-sans: "Inter"` (`index.css:8`) is declared but never loaded, so the app actually renders in Segoe UI on Windows and whatever the OS default is elsewhere.

**P1: states and data**

9. **No error states.** Only `system/Telemetry.jsx:124` handles `isError`. Every other page either toasts and shows an empty table, or (ClientDetail.jsx:67-68) navigates away on failure.
10. **React Query rule broken.** 27 pages fetch in `useEffect` with no `useQuery` (e.g. `LeadsList.jsx:45`, `ClientDetail.jsx:59`, `Settings.jsx`, `TenantDetail.jsx`, `Tenants.jsx`, `WorkflowEditor.jsx:460`). `LeadsList.jsx:45-47` refetches on every keystroke with no debounce.
11. **Loading is a spinner lottery.** 80 inline `animate-spin` spinners in 43 files, while `components/common/Spinner.jsx` has 0 importers. Only Dashboard has a skeleton.

**P2: component duplication and visual noise**

12. **Built but unused:** `FormInput`, `FormSelect`, `FormTextarea`, `SearchInput`, `Spinner`, `PaymentLinkModal` (0 importers each). `.card`, `.card-hover`, `.glass-panel`, `.glass-card` in `index.css:42-78` (0 uses). Meanwhile the payment-link modal is re-implemented inline at `ClientsList.jsx:369` and `LeadsList.jsx:571`; 42 `fixed inset-0` modal overlays across 29 files; stat cards redefined at `Expenses.jsx:537`, `marketing/CampaignDetail.jsx:305`, `SiteAnalytics.jsx:93`, inline in `Dashboard.jsx:121`; chart tooltips at `SiteAnalytics.jsx:78` and `Telemetry.jsx:21` while `DashboardCharts.jsx` uses Recharts defaults.
13. **Three icon systems plus hand-drawn paths.** `FeatherIcons.jsx` (52 hand-copied SVGs, comment at :1 says it exists to avoid react-icons) coexists with `react-icons/fi` (3 files, e.g. `Sidebar.jsx:187`) and `react-icons/lu` (`Sidebar.jsx:186`), plus ~150 inline `<svg>` path blobs (ApiDocumentation 23, Settings 19, WorkflowEditor 17, LeadsList 14). Same glyph drawn differently in different places (settings cog at `DashboardLayout.jsx:56` vs `FeatherIcons.jsx:20`).
14. **Radius and type soup.** 692 `rounded-lg`, 442 `rounded-xl`, 145 `rounded`, 11 `rounded-2xl`, 10 `rounded-md` with no rule. 85 `text-[10px]`, 19 `text-[11px]`, 1 `text-[8px]` (below a legible floor). 49 `shadow-lg/xl/2xl` on static surfaces. Nav items `rounded-xl` with solid `bg-brand-600` active state (`Sidebar.jsx:320-322`) is the loudest element on every screen.
15. **Template tells.** Three permanent "NEW" badges (`Sidebar.jsx:215,222,248`), "Enterprise" tagline under the logo (`Sidebar.jsx:285`), FiZap as the logo instead of the real mark (:281), gradient avatar initials (`Dashboard.jsx:171`), purple gradient hero card (`ApiDocumentation.jsx:389`), div/SVG fake dashboard on the login page (`Login.jsx:69-73`), uppercase-tracked labels on stat cards (`Dashboard.jsx:128`).

**P3**

16. Duplicate logout (sidebar footer `Sidebar.jsx:360` and user menu `DashboardLayout.jsx:64`). Theme toggle is a 56px custom switch taking a full row. Main uses `h-screen` (`DashboardLayout.jsx:108`), 8 `h-screen` total. No `prefers-reduced-motion` handling anywhere. `main` has `scroll-smooth`, which fights React Router scroll restore.

### 1.3 What works (keep it)

- All routes lazy-loaded behind one `Suspense` helper (`App.jsx:72`); one `ProtectedRoute` model for roles.
- `ConfirmModal.jsx` has focus trap, Esc, scroll lock and a test: the right behaviour, wrong shell (it should become the base Dialog).
- `CommandPalette` with Cmd/Ctrl-K exists; it only needs to read the real route list.
- `usePagination` + `Pagination` are actually shared (10 and 13 importers).
- Class-based dark variant is already wired (`index.css:5`), so a token swap reaches every `dark:` utility.
- `queryClient` defaults are sensible for an operator tool (`lib/queryClient.js`: 5 min stale, 1 retry).

---

## 2. Design direction: "Ledger"

**One direction:** a calm, high-density operator ledger. Neutral cool-grey surfaces separated by hairlines, not shadows; one Napnix-blue accent reserved for the primary action, the current selection and focus; numbers in a tabular mono; status shown with colour plus text, never colour alone. Think of a well-kept accounts book, not a SaaS landing page.

**Why this, for this product:**
- The work is scanning lists (leads, inquiries, tickets, tenants) and acting on one row. Density and alignment are the product; decoration costs time 40 times a day.
- The current UI is loud in the wrong places (solid-indigo nav, coloured shadows, NEW badges) and quiet where it matters (2.5:1 table headers, no error states). Ledger inverts that.
- Using the real logo blue instead of Tailwind indigo makes the tool feel like Napnix's own, and removes the most recognisable AI-template signal at zero cost.
- It preserves everything an operator has muscle memory for: routes, nav groups, page names, Cmd-K, table layouts. This is a "redesign, preserve IA" job, not a rebrand.

**Rejected:** dark-terminal/brutalist (hurts long reading sessions, fights the light-mode majority); glass/gradient "premium SaaS" (the current failure mode, amplified); adopting Carbon/Fluent wholesale (rewrites every page at once, which violates the incremental constraint).

### 2.1 Typography

- Family: **Geist** (UI) + **Geist Mono** (numbers, IDs, slugs, code), self-hosted via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` (two small deps, `font-display: swap`). Fallback `ui-sans-serif, system-ui, "Segoe UI", sans-serif`. Reason: Inter is declared but never loaded today, so this is the first font the app actually ships; Geist's tabular figures and narrow width suit dense tables. If adding deps is unwanted, drop to the system stack: the scale below still holds.
- Fixed rem scale, ratio about 1.15. No fluid type.

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `text-2xs` | 11px / 16px | 500 | table meta, badge text (floor; replaces all `text-[10px]`, `text-[8px]`) |
| `text-xs` | 12px / 16px | 500 | column headers (sentence case, not uppercase), helper text |
| `text-sm` | 13px / 20px | 400/500 | **default UI and table body** |
| `text-base` | 14px / 22px | 400 | form inputs, prose, descriptions |
| `text-md` | 16px / 24px | 600 | panel titles |
| `text-lg` | 18px / 26px | 600 | page title (the only h1) |
| `text-xl` | 22px / 28px | 600 | KPI values (mono, tabular) |

Rules: one h1 per page, rendered by `PageHeader`. Hierarchy via weight and colour, not size jumps. `font-variant-numeric: tabular-nums` on all numeric cells and KPIs. Uppercase tracking only on the sidebar group labels, nowhere else.

### 2.2 Colour tokens (oklch)

Hue 259.5 is the Napnix logo blue (`#0E6BEF` = `oklch(0.561 0.214 259.5)`, 4.81:1 on white). Neutrals are tinted toward hue 260 at very low chroma so greys and accent belong together. Dark neutrals borrow the logo navy hue (266).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `oklch(0.975 0.004 260)` | `oklch(0.165 0.014 266)` | app background |
| `--surface` | `oklch(0.995 0.002 260)` | `oklch(0.200 0.016 266)` | panels, tables, inputs |
| `--surface-2` | `oklch(0.962 0.005 260)` | `oklch(0.182 0.015 266)` | sidebar, toolbars, table header, hover row |
| `--surface-3` | `oklch(0.935 0.007 260)` | `oklch(0.245 0.018 266)` | selected row, pressed |
| `--border` | `oklch(0.905 0.006 260)` | `oklch(0.285 0.018 266)` | hairlines |
| `--border-strong` | `oklch(0.830 0.010 260)` | `oklch(0.370 0.020 266)` | input borders |
| `--fg` | `oklch(0.225 0.020 262)` | `oklch(0.950 0.005 260)` | primary text |
| `--fg-muted` | `oklch(0.440 0.020 262)` | `oklch(0.770 0.012 260)` | secondary text (>= 7:1) |
| `--fg-subtle` | `oklch(0.540 0.018 262)` | `oklch(0.670 0.012 260)` | meta, placeholders (>= 4.5:1, replaces slate-400) |
| `--accent` | `oklch(0.561 0.214 259.5)` | `oklch(0.680 0.160 248)` | primary button, link, selection, focus |
| `--accent-hover` | `oklch(0.500 0.200 260)` | `oklch(0.740 0.140 248)` | |
| `--accent-soft` | `oklch(0.955 0.030 255)` | `oklch(0.280 0.070 258)` | active nav item, selected chip bg |
| `--accent-fg` | `oklch(0.990 0.002 260)` | `oklch(0.165 0.014 266)` | text on accent |
| `--success` | `oklch(0.520 0.130 155)` | `oklch(0.720 0.140 155)` | |
| `--warning` | `oklch(0.560 0.130 70)` | `oklch(0.800 0.140 80)` | text-safe amber |
| `--danger` | `oklch(0.540 0.190 25)` | `oklch(0.700 0.170 25)` | |
| `--*-soft` | each semantic at L 0.96 / C 0.03 | L 0.27 / C 0.06 | badge backgrounds |

Rules: accent only on primary action, current nav item, selection, focus ring and links. Never as decoration, never on inactive states. Status badges = soft background + semantic text + label text. Chart series: `--chart-1` = accent, then 5 hue-spaced series at matched lightness (validate with the `dataviz` skill palette checker in Phase 1; must pass in both themes).

Compatibility trick: also redefine `--color-brand-50..950` as a blue ramp around hue 259.5. The 94 existing `bg-brand-600` and all `text-brand-*` usages re-skin on day one without touching a page.

### 2.3 Spacing, radius, elevation, motion

- **Spacing:** Tailwind 4px base, used as a fixed ladder: 4 / 8 / 12 / 16 / 24 / 32. Page gutter 24px desktop, 16px mobile. Panel padding 16px. Table row height 36px (compact 32px toggle later if wanted). Control height 32px (sm) / 36px (default). Gap between page sections 24px (today `space-y-8` = 32 and `gap-6/8` vary).
- **Radius rule (one, documented):** controls and badges 6px (`--radius-sm`), panels/cards/modals 8px (`--radius-md`), avatars `full`. `rounded-xl/2xl` retired. Status badges are 6px rectangles, not pills.
- **Elevation:** surfaces are separated by `--border`, no resting shadow. Shadows only on things that float: popover/menu `--shadow-pop` (`0 4px 12px oklch(0.2 0.02 260 / 0.10)`), modal `--shadow-modal` (`0 16px 40px oklch(0.2 0.02 260 / 0.18)`), tinted to the neutral hue, never coloured glows. Dark mode: shadows near-invisible, so floating layers also step up one surface level.
- **Motion:** state only. 120ms for hover/press colour, 180ms for popover/drawer enter, 140ms exit; `cubic-bezier(0.2, 0, 0, 1)`; transform and opacity only. No page-load choreography, no `transition-all`. `@media (prefers-reduced-motion: reduce)` keeps opacity fades and drops transforms. Remove `scroll-smooth` from `main`.
- **z-index scale** (in `@theme`): sticky header 10, sidebar drawer 40, popover 50, modal 60, toast 70. Replaces ad-hoc `z-50` everywhere.

---

## 3. Phases

Each phase is shippable on its own and deploys to `admin.napnix.in` independently. Estimates are for one developer, in working days, and include manual light/dark checks.

### Phase 0: Baseline and dead-code removal (1 day)

- Screenshot baseline: extend the existing `qa/` Playwright harness with a `visual` spec that logs in and captures the 15 routes in section 4 Wave A/B at 1440px and 390px, light and dark. This is the regression net for every later phase.
- Delete `src/pages/marketing/workflow/` (all 5 files; git history keeps them). Phase 5 extracts fresh from `WorkflowEditor.jsx`, which is the source of truth.
- Diff the 7 unused `Tenant*.jsx` against the inline sections of `TenantDetail.jsx`; if they are stale, delete them now; if close, keep and wire them in Wave A.
- Delete unused `.glass-*` / `.card*` classes and the `accent-*` scale from `index.css`.
- Add a 6-line inline script to `index.html` that sets the `dark` class from `localStorage`/`matchMedia` before paint (kills the flash).
- Fix `getPageTitle` by giving each route a `handle: { title }` and reading `useMatches()`.

Acceptance: build and `npm test` green; baseline screenshots committed; no import of deleted files (`grep` clean); no theme flash on hard reload in dark mode; header title correct on all 50+ routes.

### Phase 1: Token foundation (2 days)

Where tokens live (Tailwind 4, no config file), all in `src/index.css`:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

:root { --canvas: oklch(0.975 0.004 260); --surface: ...; --fg: ...; --accent: ...; /* section 2.2 */ }
.dark { --canvas: oklch(0.165 0.014 266); /* dark column */ }

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-border: var(--border);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-accent: var(--accent);
  /* success / warning / danger + -soft, chart-1..6 */
}
@theme {
  --font-sans: "Geist Variable", ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, monospace;
  --text-2xs: 0.6875rem; --text-2xs--line-height: 1rem;   /* + scale in 2.2 */
  --radius-sm: 6px; --radius-md: 8px;
  --color-brand-50 ... --color-brand-950: blue ramp at hue 259.5;
}
```

`@theme inline` makes `bg-surface`, `text-fg-muted`, `border-border` resolve to the CSS variable, so one class works in both themes and new code needs no `dark:` pair. Existing `slate-*` + `dark:` code keeps working untouched.

Also in this phase:
- Base layer: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` globally. The 125 `outline-none` utilities would override it, so strip `outline-none` from each file as it is touched and rely on this base rule (inputs keep their `focus:ring` border treatment).
- Body: `bg-canvas text-fg text-sm`.
- Toasts: one `toastOptions` reading tokens (`var(--surface)`, `var(--fg)`, border, `--shadow-pop`), semantic icon colour only, no coloured glow.
- Charts: `useChartTheme()` hook (reads the CSS vars via `getComputedStyle` and re-reads on theme change through `useTheme`), returning grid, tick, tooltip and series colours. One shared `ChartTooltip` in `components/charts/`.
- `statusColors.js`: rewrite the map onto semantic soft tokens so its 11 importers get dark mode for free; same function signatures.

Acceptance: zero visual change to layout; brand now Napnix blue everywhere `brand-*` was used; every token pair passes AA (body >= 4.5:1, large/UI >= 3:1) in both themes, checked with a script; charts and toasts correct in both themes; Lighthouse a11y on Dashboard not lower than baseline.

### Phase 2: Shared component library (5 days)

New folder `src/components/ui/`, one file per component, plain Tailwind with tokens, no new UI library. Each ships with default, hover, focus-visible, active, disabled, loading and error states.

| Component | Replaces |
|---|---|
| `Button` (primary / secondary / ghost / danger; sm / md; `loading`) | `.btn*` classes (`index.css:51-69`, 44 uses), hundreds of inline button class strings |
| `IconButton` (required `label` -> `aria-label`) | inline icon buttons, `title`-only buttons, dead bell |
| `Icon` set | `FeatherIcons.jsx` becomes a thin re-export of `react-icons/fi` (already installed, same Feather glyphs, tree-shaken): its 32 importers keep working unchanged; `react-icons/lu` and ~150 inline `<svg>` paths migrate to it as pages are touched |
| `Field` (label + control + hint + error, auto `id`/`htmlFor`/`aria-describedby`) with `Input`, `Select`, `Textarea`, `Checkbox`, `Switch` | unused `FormInput/FormSelect/FormTextarea` (0 importers, deleted), 455 hand-rolled labels |
| `SearchInput` (debounced `onChange`, 250ms) | unused `SearchInput.jsx`, search boxes at `ClientsList.jsx:167`, `LeadsList.jsx:293` |
| `Combobox` | `components/common/SearchableSelect.jsx` and the copy at `WorkflowEditor.jsx:6` |
| `Dialog` (native `<dialog>`, focus trap, Esc, scroll lock, sizes) and `ConfirmDialog` on top | 42 `fixed inset-0` overlays in 29 files; `ConfirmModal.jsx` keeps its API and test, re-implemented on `Dialog` |
| `Drawer` (right side panel, same primitive) | `DetailSidebar.jsx` (no dark mode) and inline side panels |
| `Menu` (popover API or portal) | `UserDropdown` in `DashboardLayout.jsx:8`, row action menus |
| `PageHeader` (title h1, description, actions slot, optional back link and tabs) | layout h1 at `DashboardLayout.jsx:129` plus every per-page h1 |
| `Panel` (titled bordered surface, optional toolbar) | `.card`, `bg-white ... rounded-xl shadow-sm p-6` repeated per page, `SiteAnalytics.jsx:56` `Card` |
| `StatCard` (label, mono value, optional delta only when a real comparison exists) | `Dashboard.jsx:121`, `Expenses.jsx:537`, `marketing/CampaignDetail.jsx:305`, `SiteAnalytics.jsx:93` |
| `DataTable` (columns config, sticky header, row click, row actions, selection, built-in skeleton/empty/error rows, horizontal scroll container) | ~20 hand-written `<table>` blocks. Plain component, not TanStack: no sorting engine until a page needs it |
| `Pagination` | restyle existing (keep API, 13 importers) |
| `Badge` / `StatusBadge` (`entity`, `status`) | `statusColors.js` call sites, inline ternary badges (`Dashboard.jsx:184-187`) |
| `Tabs` (roving tabindex, `aria-selected`) | Settings tabs (`Settings.jsx:311,330`), detail-page tab bars |
| `Skeleton`, `SkeletonRows` | 80 inline spinners; `Spinner.jsx` kept only for in-button loading |
| `EmptyState` (icon, one line, primary action) | "No leads found. Create your first one!" style blocks |
| `QueryState` (`query`, `skeleton`, `empty`, `children`) renders loading / error-with-Retry / empty / data | missing error states on 60+ pages |
| `Avatar` (initials, neutral bg) | gradient avatars (`Dashboard.jsx:171`) |
| `PaymentLinkDialog` | `PaymentLinkModal.jsx` (unused) and inline copies at `ClientsList.jsx:369`, `LeadsList.jsx:571` |

Plus a `/dev/ui` route (admin-only, lazy) rendering every component in both themes: the living reference and the place screenshots are taken.

Acceptance: every component keyboard-operable, visible focus, AA contrast in both themes, labelled; unit tests for `Dialog` focus trap, `Field` id wiring, `QueryState` branches, `SearchInput` debounce (Vitest, alongside the existing ConfirmModal test); `/dev/ui` screenshots committed; `FormInput/FormSelect/FormTextarea/SearchInput(old)/PaymentLinkModal/DetailSidebar` deleted once their replacement has its first consumer.

### Phase 3: App shell and IA (2 days)

- One `navConfig.js` (groups, items, roles, icons, titles) consumed by `Sidebar`, `CommandPalette` and the route `handle.title`. Ends the three-way drift.
- Add an **Email Marketing** group (dashboard, contacts, templates, campaigns, automations, SMTP, domains) and put `/tools`, `/pricing`, `/api-docs` under System. Label the legacy `/campaigns` and `/smtp-accounts` explicitly (e.g. "Broadcasts (legacy)") until Anu decides which pair survives; do not delete routes (URL stability).
- Sidebar: 240px, `surface-2`, 32px rows, active item = `accent-soft` bg + accent text + 2px accent left rule (not a solid fill). Real Napnix logo instead of `FiZap`, drop "Enterprise". Remove all "NEW" badges; show live counts instead where real (open support tickets, pending inquiries) from existing queries.
- Collapsible to a 56px icon rail at `lg` (persist in localStorage, try/catch), drawer below `lg` with focus trap, Esc and `aria-expanded` on the hamburger.
- Header: 52px, `PageHeader` title moves into the page; header keeps breadcrumbs (from route matches), Cmd-K trigger (visible on mobile as an IconButton), user `Menu` (profile, settings, theme: light/dark/system, logout). Remove the dead bell and the duplicate sidebar logout and toggle.
- Replace `h-screen` with `h-dvh`; remove `scroll-smooth`; scroll to top on route change.

Acceptance: every route in `App.jsx` reachable from the sidebar or Cmd-K (scripted check: route list minus nav list = only `:id` / `new` / `edit` routes); one h1 per page; sidebar fully keyboard navigable; works at 390px with no horizontal scroll; role filtering identical to today (compare nav for each of the 4 roles before/after).

### Phase 4: Page migration, by daily use (10-12 days, 4 waves)

Per page, the same checklist: `PageHeader` + `Panel` + `DataTable`/`Field` + `QueryState`; convert `useEffect` fetching to `useQuery`/`useMutation` with `invalidateQueries` (CLAUDE.md pattern, `staleTime: 2 * 60 * 1000`); `SearchInput` debounce; tokens instead of `slate-*`/hex; icons from the one set; remove fake numbers. Copy, field names, field order and routes stay as they are.

| Wave | Pages | Why first | Days |
|---|---|---|---|
| A | Dashboard, LeadsList + LeadDetail + LeadsKanban, Inquiries + InquiryDetail, SupportInbox, ClientsList + ClientDetail, Tenants + TenantDetail | daily: pipeline, inbound, support, tenant ops. Dashboard drops `+0%` deltas and hardcoded role stats (show deltas only when the API returns a comparison; non-admin roles get their real assigned leads) | 4.5 |
| B | ProjectsList, Documents + DocumentEdit, Expenses, Transactions, marketing Campaigns + CampaignDetail, Workflows list | weekly operations and money | 3 |
| C | Settings (tabs -> `Tabs`, every input -> `Field`), Team, Templates, Servers, BackupAccounts, SiteAnalytics, Telemetry | admin and observability. SiteAnalytics: theme-aware map palette (light: neutral land, accent-ramp density), charts via `useChartTheme`, local `Card/KpiCard/Skeleton/ChartTooltip` deleted, one `QueryState` per section so one failed endpoint does not blank the page | 3 |
| D | Blogs, Portfolio, Case Studies (lists + editors), email-marketing (11 pages), WhatsApp, MobileApp, ApiDocumentation, PricingPage, ToolRegistry, Login | lower frequency. Login loses the div/SVG fake dashboard (`Login.jsx:69`) for the real logo and a single focused form | 2 |

Acceptance per wave: no `text-slate-400` without a token replacement, no hex literals outside chart/map palettes, no inline `animate-spin` outside `Button`, no `fixed inset-0` outside `ui/`, every query has error UI, every form label has `htmlFor`; Playwright visual diff reviewed (intended changes only) light + dark, 1440 + 390; existing QA specs for the touched module green; impeccable detector run on the changed files with zero new findings.

### Phase 5: WorkflowEditor decomposition (4 days)

`WorkflowEditor.jsx` is 2,916 lines: a local `SearchableSelect` (:6), four node renderers (:114-303), `NODE_PALETTE` (:304), and one component (:358-2916) with 16 `useState`, 5 `useEffect`, raw fetching (`fetchWorkflow` :460, `saveWorkflow` :602), the palette sidebar (:705-805), canvas and top bar (:806-912), and a config panel (:913-2916) that is about 30 `{selectedNode... === '...' && (...)}` blocks for triggers (:941-1435) and actions (:1436-2868). It is also the most actively edited file (WhatsApp, keyword_research, gsc_opportunities and http_request nodes were added in the last weeks), so this phase must be done in a quiet window and coordinated with the workflow-engine work in `nexs-backend`.

Target structure (fresh extraction from the live file, not from the deleted stale copies):

```
pages/marketing/workflow-editor/
  WorkflowEditor.jsx        # ~200 lines: layout, ReactFlow provider, wiring only
  useWorkflow.js            # useQuery(workflow), useMutation(save), dirty state, node/edge state
  nodeTypes.jsx             # TriggerNode, ActionNode, ConditionNode, DelayNode (from :114-303)
  nodeRegistry.js           # single source: type -> { label, icon, group, defaults, ConfigForm }
                            #   replaces NODE_PALETTE (:304) and every inline `actionType ===` branch
  NodePalette.jsx           # left sidebar, rendered from nodeRegistry groups (:705-805)
  EditorToolbar.jsx         # top bar: name, active toggle, save, test (:808-873)
  NodeConfigPanel.jsx       # right panel shell: label field, Apply, looks up registry ConfigForm
  config/
    triggers/  LeadCreated.jsx  ClientCreated.jsx  LeadStatusChanged.jsx  ClientStatusChanged.jsx
               InquiryCreated.jsx  InquiryStatusUpdated.jsx  Scheduled.jsx  StripeEvents.jsx
               Manual.jsx  WhatsAppReceived.jsx
    actions/   SendEmail.jsx  UpdateLead.jsx  UpdateClient.jsx  UpdateInquiry.jsx  CreateTask.jsx
               AssignUser.jsx  AssignInquiry.jsx  AddNote.jsx  SendNotification.jsx  Webhook.jsx
               HttpRequest.jsx  AiAssistant.jsx  AiPickTopic.jsx  AiWriteBlog.jsx  AiFetchImage.jsx
               AiPostBlog.jsx  IndexUrl.jsx  KeywordResearch.jsx  GscOpportunities.jsx  SendWhatsApp.jsx
    GenericConfig.jsx       # the "no settings" fallback (:2869)
    fields.jsx              # shared VariablePicker, TemplateSelect, StatusSelect built on ui/Field
```

Steps, each a separate commit that leaves the editor working:
1. Characterise first: a Playwright spec that opens an existing workflow, opens every node type's config, edits one field each, saves, reloads and asserts the saved JSON. This is the safety net (none exists today).
2. Move node renderers and the palette into `nodeTypes.jsx` / `nodeRegistry.js`; swap local `SearchableSelect` for `ui/Combobox`.
3. Move fetch/save into `useWorkflow` (React Query); keep payload shape byte-identical.
4. Extract config forms one group at a time (triggers, then actions, then AI, then WhatsApp/HTTP), each form receiving `{ config, onChange }` only.
5. Restyle with tokens: node cards 8px radius, semantic colour per node group as a 3px left rule plus icon (not full tinted fills), config panel as a `Drawer` on narrow screens.

Adding a node afterwards = one registry entry + one config file (today it means editing the palette, the node renderer and a new branch in a 2,500-line JSX tree).

Acceptance: characterisation spec green before and after every step; saved workflow JSON identical for each node type; no file over 400 lines in `workflow-editor/`; editor usable at 1280px; no `useEffect` fetching left.

### Phase 6: Hardening pass (2 days)

- Full keyboard walkthrough of Wave A flows; axe scan per route (zero serious/critical).
- Responsive pass at 390 / 768 / 1280: tables scroll inside their panel, dialogs become full-height sheets below 640px, 40px minimum touch targets on mobile.
- `prefers-reduced-motion` verified; Lighthouse a11y >= 95 on Dashboard, Leads, Tenants.
- Write `DESIGN.md` (tokens, rules from section 2, component index) so later work extends the system rather than drifting again; add an ESLint `no-restricted-syntax` rule or a CI grep that fails on new hex literals, `text-slate-400`, `fixed inset-0` and `text-[10px]` outside `components/ui/`.

Acceptance: audit re-run scores >= 16/20; the CI guard is active.

### Effort summary

| Phase | Days | Ships |
|---|---|---|
| 0 Baseline + dead code | 1 | correct titles, no theme flash, ~2,900 dead lines gone |
| 1 Tokens | 2 | Napnix blue, AA-safe neutrals, themed toasts/charts |
| 2 Components | 5 | `components/ui/` + `/dev/ui` |
| 3 Shell + IA | 2 | every route reachable, calmer nav |
| 4 Pages (A-D) | 10-12 | migrated pages, error states, React Query everywhere |
| 5 WorkflowEditor | 4 | decomposed editor with registry |
| 6 Hardening | 2 | a11y/responsive verified, drift guard |
| **Total** | **26-28** | about 6 working weeks for one developer |

Phases 0-1 alone (3 days) fix the brand, the contrast floor, the titles and the theme flash across the whole app, so they are the best first ship.

---

## 4. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Visual regressions across 75 page files | Phase 0 screenshot baseline; migrate per wave; tokens are additive (old `slate-*` + `dark:` keeps rendering) so half-migrated pages still look coherent |
| Dark mode breaks during the mix of old and new classes | semantic tokens switch automatically; visual diff runs in both themes every wave; `statusColors` and charts fixed centrally in Phase 1 |
| React Query conventions drift while converting 27 `useEffect` pages | one pattern only: `useQuery({ queryKey: ['entity', params], queryFn, staleTime: 2 * 60 * 1000 })`, mutations invalidate the entity key; no fetching inside `ui/` components; review checklist item |
| Behaviour changes hidden inside "restyle" commits | restyle and data-layer changes in separate commits; field names, order and payloads unchanged (forms feed backend validation and workflow triggers) |
| WorkflowEditor is under active feature work | characterisation test first; decompose in a quiet window; registry makes in-flight node additions a one-file merge |
| Brand blue vs Tailwind indigo muscle memory | the `brand-*` ramp is remapped, so class names do not change, only the hue |
| New font dependency | optional; system stack fallback defined; self-hosted, no Google Fonts link |
| Route/IA changes confuse operators | no route renamed or removed; legacy pages labelled, not deleted, until a decision is made |
| Role visibility regressions in the new nav | nav generated from the same `roles` arrays; per-role nav snapshot compared before and after Phase 3 |
| Scope creep into a rewrite | each phase has its own acceptance bar and ships alone; no page is rewritten, only re-composed from `ui/` |

## 5. Open questions for Anu

1. Which campaign/SMTP pair is canonical: `marketing/` or `email-marketing/`? (Phase 3 labels both until decided.)
2. OK to add the two `@fontsource-variable/geist*` packages, or stay on the system font?
3. PNG masters only exist for the logo; is there an SVG of the mark for the sidebar and login, or should the PNG be used?
