# Tokyo Mavericks — Improvement Plan

A prioritised plan to improve functionality and streamline the UI/UX, based on a full audit of every page, component, API route, data model, and business-logic flow.

---

## Table of Contents

1. [Navigation & Layout](#1-navigation--layout)
2. [Authentication & Onboarding](#2-authentication--onboarding)
3. [Home Page](#3-home-page)
4. [Sessions List](#4-sessions-list)
5. [Session Detail Page](#5-session-detail-page)
6. [RSVP Flow](#6-rsvp-flow)
7. [Carpool Optimisation & Assignments](#7-carpool-optimisation--assignments)
8. [Stats Dashboard](#8-stats-dashboard)
9. [Admin: User Management](#9-admin-user-management)
10. [Admin: Attendance Panel](#10-admin-attendance-panel)
11. [Notifications & Real-Time](#11-notifications--real-time)
12. [Accessibility & Polish](#12-accessibility--polish)
13. [Data Integrity & Edge Cases](#13-data-integrity--edge-cases)
14. [Mobile-Specific Improvements](#14-mobile-specific-improvements)

---

## 1. Navigation & Layout

### Current State
- `Nav.tsx` is a server component that conditionally renders links based on auth/role.
- Links wrap on small screens (`flex-wrap`), creating a crowded multi-row header.
- No skip-to-content link, no breadcrumbs, no active-route highlighting.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 1.1 | **Add a mobile hamburger menu.** Replace `flex-wrap` with a collapsible slide-out or dropdown menu at `sm:` breakpoint. Keep full link row on desktop. | High — currently the nav is the single biggest mobile UX issue; links overflow and wrap messily on small phones. | Medium |
| 1.2 | **Highlight the active route.** Use `usePathname()` (client wrapper around Nav) to apply an underline or accent colour to the current link. | Medium — helps orientation, especially on deeper pages. | Low |
| 1.3 | **Add a skip-to-content link.** Invisible `<a href="#main-content">` that becomes visible on Tab focus, jumping past the nav. Add `id="main-content"` to `<main>`. | Medium — accessibility baseline. | Low |
| 1.4 | **Add breadcrumbs on nested pages** (`/sessions/[id]`, `/sessions/[id]/edit`, `/sessions/[id]/assignments`). A small `text-xs text-muted` trail below the nav. | Low — orientation aid, especially when deep-linked. | Low |

---

## 2. Authentication & Onboarding

### Current State
- Login page doesn't redirect already-logged-in users away.
- `proxy.ts` (edge middleware) exists but is **not wired** — no `middleware.ts` imports it.
- No sign-up flow; admin creates all accounts.
- No password-change UI for players. 
- No "forgot password" flow - keep it as admin reset

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 2.1 | **Wire `proxy.ts` as Next.js middleware.** Rename/export it from `src/middleware.ts` so the edge runtime enforces auth globally. This catches unauthenticated access to API routes that might forget `requireSession`. | High — security hardening + removes the need for per-page `getSession()` + redirect boilerplate. | Low |
| 2.2 | **Redirect `/login` when already authenticated.** Either via the middleware above or a server-side check at the top of the login page. | Medium — prevents confusion when users bookmark `/login`. | Low |
| 2.3 | **Add a "Change password" page** at `/settings` or `/profile`. API: `PUT /api/auth/password` requiring current + new password. | Medium — currently only admin can reset, and only to a shared default. | Medium |
| 2.4 | **Add a first-login forced password change.** When user logs in with `DEFAULT_RESET_PASSWORD`, redirect to `/settings` with a banner: "Please change your password." | Medium — operational hygiene. | Medium |

---

## 3. Home Page

### Current State
- Shows a greeting and the single next upcoming session via `SessionCard`.
- If no upcoming session, shows "No upcoming sessions."
- Published ride info (driver/pickup/time) shown inline.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 3.1 | **Show the next 2–3 sessions**, not just one. Use a compact card list so users see what's coming beyond the immediate next event. | High — a single card can feel empty, and users may have consecutive weekend games. | Low |
| 3.2 | **Add a quick-action banner** when the user has **not RSVP'd** to an open session whose deadline is approaching (< 48 h). Bold red accent, "RSVP closing soon" with a direct link. | High — drives engagement, reduces missed deadlines. | Medium |
| 3.3 | **Show personal stats summary** (total rides, travel time saved) as a small card below sessions. Links to `/stats`. | Low — nice-to-have at-a-glance info. | Low | - probably out of scope - hard to calculate time saved and costs more on api usage  - add in a later version

---

## 4. Sessions List

### Current State
- Only shows upcoming sessions (`date >= now`).
- Each row is a full-width link card with name, datetime, RSVP deadline, and a one-line status summary.
- No filtering, no past sessions, no search.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 4.1 | **Add "Upcoming / Past" tab toggle.** Past sessions are useful for checking travel history or reviewing old assignments. | Medium — frequently asked for by team apps. | Low |
| 4.2 | **Add status filter chips** (Open, Closed, Optimised, Published). Clickable pills that toggle URL search params. | Low — useful for admins managing many sessions. | Low |
| 4.3 | **Add colour-coded status badges** to each card. Currently the status is only shown as a small line of text. Use pill-shaped badges with colour: green for OPEN, amber for CLOSED, blue for OPTIMISED, red-accent for PUBLISHED. | Medium — instant visual scanning. | Low |
| 4.4 | **Show RSVP progress** on each card (e.g., "12 / 20 attending"). A small progress bar or fraction gives a sense of team momentum. | Medium — social proof drives RSVPs. | Low |

---

## 5. Session Detail Page

### Current State
- Dense layout: status label, title, venue, date, deadline, map, drive/ride cards, RSVP form, attendee list, carpool assignments.
- RSVP form is below the fold on mobile (below map).
- `CarpoolSessionMap` (multi-marker) shown when groups exist; else basic `MapEmbed`.
- `YourRideCard` only appears when status is PUBLISHED and user is an assigned rider.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 5.1 | **Reorganise the page into tabbed or collapsible sections.** Suggested tabs: **Overview** (status, date, venue, map), **RSVP**, **Attendees**, **Carpool** (assignments + map). Reduces scroll depth and lets users jump to what they care about. | High — the page is currently one long scroll, which on mobile can exceed 5+ screen heights. | Medium |
| 5.2 | **Move the RSVP CTA to a sticky bottom bar on mobile.** A floating "RSVP" button (or the form itself as a bottom sheet) so users don't have to scroll past the map. | High — the most important action on this page is buried. | Medium |
| 5.3 | **Show a countdown timer** to RSVP deadline when < 24 h remaining. Animated or at least refreshing every minute. | Medium — urgency cue. | Low | - dont do this
| 5.4 | **Improve the `YourRideCard` / `YourDriveCard` prominence.** Move them above the map when present, with a highlighted background (e.g., accent-bordered panel). These are the **most actionable** pieces of info for a user on game day. | Medium — currently they can blend into the page. | Low |
| 5.5 | **Show rider assignment status before publish.** When status is OPTIMISED, show "You've been assigned to [Driver]'s car" even before publish, with a "pending confirmation" label. Currently `YourRideCard` is hidden until PUBLISHED. | Medium — reduces anxiety for riders. | Low |

---

## 6. RSVP Flow

### Current State
- `RSVPForm` is a client component with three modes: driver (pickup station + seats), rider (start location), own way (start location + transport mode).
- Uses `StationSearch` (Google Places Autocomplete, Japan bias, `train_station` or `geocode` type).
- Disabled when RSVP is not open.
- No confirmation step, no undo, no "change my RSVP" distinction.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 6.1 | **Add a confirmation toast or banner** after RSVP submission ("You're in! Driving from Meguro Station."). Currently the form just resets/refetches, and the user has to scroll to the attendee list to verify. | High — immediate feedback is a UX fundamental. | Low |
| 6.2 | **Show the user's current RSVP as a read-only summary** when the form is in "edit" mode (re-submitting). Make it clear they're **updating**, not creating. A small "Currently: Driving, 3 seats" above the form. | Medium — prevents confusion. | Low |
| 6.3 | **Allow "Not attending" as an explicit RSVP option.** Currently users can RSVP as attending or not submit at all. An explicit "Can't make it" button that sets `attending: false` lets the team see definitive headcounts. | High — ambiguity between "hasn't responded" and "not coming" is a major team-app pain point. | Low |
| 6.4 | **Add a fallback for StationSearch** when Google Maps API key is missing. Currently shows a text message. Instead, allow a **manual text input** for station name + optional lat/lng entry, so dev/testing works without API keys. | Low — dev experience, but also fallback for production key issues. | Medium |  - not now - later version

---

## 7. Carpool Optimisation & Assignments

### Current State
- Admin triggers optimise → greedy min-time assignment using Google Distance Matrix.
- `AssignmentEditor` lets admin manually reassign riders to different drivers.
- Publish makes assignments visible to players.
- No unpublish workflow UI; admin must `PUT` status via the session edit API.
- Stale data risk: editing venue/time after optimisation doesn't invalidate cached matrices.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 7.1 | **Add an "Unpublish" button** on the assignments page when status is PUBLISHED. Reverts to OPTIMISED so admin can re-assign and re-publish. | High — currently the help page says "unpublish in the database", which is unacceptable UX. | Low |
| 7.2 | **Show a "stale data" warning** on the assignments page if `session.updatedAt > optimisationSnapshot.updatedAt`. Prompt admin to re-run optimise with `?refresh=1`. | Medium — prevents publishing assignments based on a different venue or time. | Low |
| 7.3 | **Show unassigned riders prominently** at the top of the assignment editor with a warning badge and count. Currently they exist in the UI but are easy to miss. | Medium — unassigned riders are the most urgent item for an admin. | Low |
| 7.4 | **Add an "Auto-assign remaining" button** that re-runs the greedy algorithm on just the unassigned riders against drivers with remaining capacity. Avoids a full re-optimise. | Medium — saves admin time when a few riders need manual placement. | High |
| 7.5 | **Add a drag-and-drop interface** for the assignment editor. Riders as draggable chips, drivers as drop targets. Much more intuitive than dropdowns. | Medium — polish, but transforms the admin experience. | High |
| 7.6 | **Invalidate the optimisation snapshot** when session venue/time is edited via `PUT /api/sessions/[id]`. Either auto-delete the snapshot or set a `stale` flag. | Medium — data integrity. | Low |

---

## 8. Stats Dashboard

### Current State
- `StatsClient` fetches `/api/stats/me` and `/api/stats/team/sessions`.
- Renders two plain tables: personal stats and team-by-session totals.
- `TravelChart.tsx` (Recharts bar chart) exists but is **not imported or used anywhere**.
- `/api/stats/team` (per-user leaderboard) exists but is **not consumed by the UI**.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 8.1 | **Wire up `TravelChart.tsx`** to display personal travel time as a bar/line chart over sessions. It's already built — just needs to be imported into `StatsClient`. | High — the chart component is done and sitting unused; this is a quick win. | Low |
| 8.2 | **Add the team statistics** using `/api/stats/team`. Show a ranked table: player name, total travel time, sessions attended, average travel time. | Medium — social/fairness element drives engagement. | Low | - it is not competitive 
| 8.3 | **Add date-range filtering** to the stats page. The API already supports `year`/`month` params via `sessionDateFilterFromSearchParams`. Wire up month/year selectors in the UI. | Medium — lets users compare seasons. | Low |
| 8.4 | **Add a "carpool savings" metric.** Compare actual carpool travel time vs theoretical solo driving time (from step3 own-way data). Show "X minutes saved this month by carpooling." | Low — motivational, but requires data that may not always exist. | Medium | - leave for vnext

---

## 9. Admin: User Management

### Current State
- `UserManagement.tsx`: create user form (name, email, password) + table with role toggle and password reset.
- Create form uses **placeholders only** — no `<label>` elements.
- Password reset uses `window.confirm()` and resets to `DEFAULT_RESET_PASSWORD`.
- No search, no pagination, no bulk operations.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 9.1 | **Add proper `<label>` elements** to the create-user form. Essential for accessibility (screen readers) and also improves click targets on mobile. | High — accessibility gap. | Low |
| 9.2 | **Add a search/filter bar** above the user table. With 20+ players, scanning a flat list is already slow. | Medium — scales with team size. | Low |
| 9.3 | **Replace `window.confirm()`** for password reset with a styled modal dialog (reuse the pattern from `AdminRsvpEditor`). Show the temporary password in the modal so admin can copy it. | Medium — `confirm()` is jarring and unstyled. | Low |
| 9.4 | **Add a "Deactivate" option** for users who leave the team. Soft-delete (boolean flag) instead of hard delete, so historical RSVPs and stats are preserved. | Medium — real team management need. | Medium |

---

## 10. Admin: Attendance Panel

### Current State
- `AdminAttendancePanel.tsx`: session selector, refresh button, full user × RSVP table with admin edit modal.
- Table has `min-w-[640px]` forcing horizontal scroll on mobile.
- Modal uses `role="dialog"` and `aria-labelledby`.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 10.1 | **Replace the wide table with a card-based layout on mobile.** One card per user showing their RSVP status, expandable to edit. Keep the table on `md:` and up. | High — the horizontal-scroll table is the weakest mobile experience in the app. | Medium |
| 10.2 | **Add attendance summary counts** at the top: "16 attending, 4 not attending, 0 no response." | Medium — quick overview before scanning the list. | Low |
| 10.3 | **Colour-code RSVP status cells.** Green for attending-driver, blue for attending-rider, grey for not attending, yellow for no response. | Medium — visual scanning. | Low |
| 10.4 | **Add bulk actions:** "Mark all remaining as not attending" for deadline enforcement. | Low — admin convenience. | Medium |

---

## 11. Notifications & Real-Time

### Current State
- No notifications of any kind — no email, no push, no in-app.
- All data is fetched on page load or via explicit API calls.
- No indication when other users RSVP or when admin publishes assignments.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 11.1 | **Add in-app toast notifications** for actions (RSVP submitted, assignments published, etc.). Use a lightweight toast library or a custom component. | High — immediate feedback for all user actions. | Medium |
| 11.2 | **Add DISCORD BOT notifications** for key events: RSVP deadline approaching (24h), assignments published, session created. wire it up but integrate fully later with discord bot| High — the single most impactful missing feature for a team coordination app. | High |
| 11.3 | **Add a notification preferences page** (`/settings/notifications`). Let users opt in/out of notification types. | Medium — required complement to 11.2. | Medium | - leave this for later

---

## 12. Accessibility & Polish

### Current State
- Dark theme only, no toggle.
- Error messages inconsistently use `role="alert"`.
- Some tables lack `scope` on `<th>`.
- `loading.tsx` is plain text with no skeleton.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 12.1 | **Add `role="alert"` to all error and success messages** across all forms and API-calling components. Audit: `RSVPForm`, `AssignmentActions`, `UserManagement`, `EditSessionForm`, `NewSessionForm`, `StatsClient`. | High — accessibility baseline. | Low |
| 12.2 | **Add `scope="col"` / `scope="row"`** to all table headers. | Low — accessibility compliance. | Low |
| 12.3 | **Replace the plain-text `loading.tsx`** with skeleton screens that match the page layout. At minimum, a pulsing card placeholder. | Medium — perceived performance. | Low |
| 12.4 | **Add `aria-busy` to submit buttons** while forms are loading. | Low — accessibility. | Low |
| 12.5 | **Add a custom `not-found.tsx` and `error.tsx`** at the app root. Style them to match the dark theme with helpful CTAs ("Go home", "Try again"). | Medium — currently users see the default Next.js 404/500. | Low |
| 12.6 | **Standardise colour usage.** Several components hardcode `#8b1a1a` or `#a0a0a0` instead of using theme tokens (`text-accent`, `text-muted`). Refactor to use Tailwind theme variables consistently. | Low — maintainability. | Low |
| 12.7 | **Add a light/dark theme toggle** (or at least system-preference support). | Low — nice-to-have; the dark theme is well-executed. | Medium |

---

## 13. Data Integrity & Edge Cases

### Current State
- `syncSessionStatus` auto-closes sessions past deadline, but only on read.
- Editing session venue/time after optimisation doesn't invalidate cached Distance Matrix data.
- Admin can `PUT` session status freely, potentially creating inconsistent states (e.g., OPEN with orphaned carpool groups).
- No audit log for admin actions.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 13.1 | **Add status transition validation** in `PUT /api/sessions/[id]`. Only allow valid transitions: OPEN → CLOSED, CLOSED → OPTIMISED (via optimise), OPTIMISED → PUBLISHED (via publish), and reverse paths (PUBLISHED → OPTIMISED for unpublish, OPTIMISED → CLOSED for re-open). Reject invalid jumps. | High — prevents admin from accidentally creating broken states. | Medium |
| 13.2 | **Auto-clear optimisation data** when session venue or time changes. In `PUT /api/sessions/[id]`, if `locationLat`, `locationLng`, or `date` changes and status > CLOSED, delete `OptimisationSnapshot` and all `CarpoolGroup` rows, reset status to CLOSED. | Medium — prevents stale assignments. | Medium |
| 13.3 | **Add an admin audit log** (new `AuditLog` model): who did what, when, to which session/user. Show on an admin dashboard. | Low — operational visibility, but significant schema change. | High |
| 13.4 | **Validate RSVP field consistency** in `parseRsvpBody`. E.g., a driver must have `pickupLat`/`pickupLng` and `availableSeats >= 1`; a rider must have `startLat`/`startLng`. Currently some fields can be null when they shouldn't be. | Medium — data quality. | Low |

---

## 14. Mobile-Specific Improvements

### Current State
- Content width: `max-w-lg` on small screens, `md:max-w-4xl` on desktop.
- Maps are `h-48` / `md:h-64` — small on mobile.
- Tables use horizontal scroll.
- No PWA/installable support.

### Improvements

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 14.1 | **Make the app installable as a PWA.** Add `manifest.json`, a service worker for offline caching of static pages, and app icons. Team apps benefit hugely from home-screen access. | High — this is a team coordination app used on game days, often on phones. | Medium |
| 14.2 | **Increase map height on mobile** to `h-64` (from `h-48`) and add a "full screen" expand button. | Medium — maps are a key feature but feel cramped. | Low |
| 14.3 | **Use bottom sheet modals** instead of centered modals on mobile (e.g., admin RSVP editor). Bottom sheets are more thumb-friendly. | Medium — interaction quality. | Medium |
| 14.4 | **Add pull-to-refresh** on the sessions list and session detail pages. | Low — expected mobile behaviour for list views. | Medium |

---

## Suggested Implementation Order

Grouped by phase, optimising for impact-per-effort. **Deferred / vNext** items are called out in the tables above (out of scope, later version, or “leave for later”) — they are listed at the bottom, not scheduled here.

### Phase 1: Quick Wins (low effort, high/medium impact)

- 1.2 Active route highlighting
- 1.3 Skip-to-content link
- 1.4 Breadcrumbs on nested session routes
- 2.1 Wire middleware (`proxy.ts`)
- 2.2 Redirect `/login` when authenticated
- 4.3 Colour-coded status badges
- 5.4 Promote drive/ride cards above map
- 5.5 Show rider assignment before publish
- 6.1 RSVP confirmation toast
- 6.3 Explicit "Not attending" option
- 7.1 Unpublish button
- 7.2 Stale data warning
- 7.3 Prominent unassigned riders
- 8.1 Wire up TravelChart
- 8.2 Wire `/api/stats/team` into the UI — summary table (not framed as a competitive leaderboard)
- 8.3 Date-range filtering in stats
- 9.1 Labels on create-user form
- 12.1 `role="alert"` audit
- 12.3 Skeleton loading screens
- 12.5 Custom 404/500 pages
- 12.6 Standardise theme colours

### Phase 2: Core UX (medium effort, high impact)

- 1.1 Mobile hamburger menu
- 3.2 RSVP deadline urgency banner
- 4.1 Upcoming/Past tab toggle
- 4.2 Status filter chips (admin)
- 4.4 RSVP progress on session cards
- 5.1 Tabbed/collapsible session detail sections
- 5.2 Sticky RSVP bar on mobile
- 6.2 RSVP “edit mode” summary (currently driving / riding)
- 9.2 User search/filter
- 9.3 Styled password-reset modal (replace `window.confirm`)
- 10.1 Card layout for attendance on mobile
- 10.2 Attendance summary counts
- 10.3 Colour-code RSVP status cells
- 11.1 In-app toast notifications
- 13.1 Status transition validation
- 13.4 RSVP field consistency in `parseRsvpBody`
- 14.2 Larger mobile maps

### Phase 3: Feature Expansion (higher effort, high impact)

- 2.3 Change password page
- 2.4 Forced password change on first login
- 3.1 Show multiple upcoming sessions on home
- 7.6 Invalidate optimisation snapshot when session venue/time is edited
- 9.4 User deactivation
- 11.2 Discord bot notifications for key events — wire stubs now; full Discord integration later
- 13.2 Auto-clear optimisation data when venue or time changes
- 14.1 PWA support

### Phase 4: Polish & Advanced (highest effort)

- 7.4 Auto-assign remaining riders
- 7.5 Drag-and-drop assignment editor
- 10.4 Bulk attendance actions
- 12.2 Table `scope` on headers
- 12.4 `aria-busy` on submit buttons
- 12.7 Light/dark theme toggle (or system preference)
- 13.3 Admin audit log
- 14.3 Bottom sheet modals on mobile
- 14.4 Pull-to-refresh

### Deferred / vNext (not scheduled above)

| # | Item | Note from plan |
|---|------|----------------|
| 3.3 | Home: personal stats summary | Out of scope for now — hard to define “time saved”, extra API cost; later version |
| 5.3 | Countdown to RSVP deadline | **Do not implement** |
| 6.4 | StationSearch manual fallback | Later version |
| 8.4 | “Carpool savings” metric | vNext |
| 11.3 | Notification preferences page | Leave for later |
