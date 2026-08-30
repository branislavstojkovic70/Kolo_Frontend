# Kolo — Crypto Services Marketplace (Frontend)

Kolo is a marketplace for digital services — streaming slots, VPNs, IPTV, software keys, game
passes — where buyers pay in cryptocurrency via [OxaPay](https://oxapay.com) and the platform
holds the money in **escrow**. Sellers' earnings **vest** for 30 days per order before they can
be withdrawn; buyers can open an **admin-arbitrated dispute** (run through a dedicated Telegram
group) that freezes the escrow until a decision is made. The platform takes a flat **4% fee**.

This repository is the React frontend. It implements the full Kolo design language —
brutalist/editorial, flat, hard-edged, zero border radius — and runs entirely against the real
[NestJS backend](../../Kolo_Backend) (no mock data).

```
PAID. → ESCROWED. → VESTED. → RELEASED.
```

---

## Contents

- [Screens](#screens)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Authentication](#authentication)
- [Demo walkthrough](#demo-walkthrough)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Design system](#design-system)
- [Responsive behavior](#responsive-behavior)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Design ↔ backend adaptations](#design--backend-adaptations)

---

## Screens

| Route                | View                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/login`, `/register`| Split screen: orange manifesto poster (live service count) + sign-in / create-account form                     |
| `/ads`               | **Marketplace** — stat cells with count-up, search + category/price filters, All\|Mine scope, mondrian card grid |
| `/ads/:id`           | **Service detail** — description, platform guarantees, seller's other listings, sticky order card with fee math; owners get pause/activate/delete |
| `/ads/new`           | **Post an ad** — controlled form with live listing preview and payout-per-sale math; publish or save as paused draft |
| `/orders`            | **Orders** — All\|Buying\|Selling tabs, 5-segment escrow-flow bars, status chips                              |
| `/orders/:id`        | **Order detail** — money-flow strip, OxaPay payment card (QR + checkout link + countdown, self-refreshing), delivery info for the paid buyer, dispute action |
| `/disputes(/:id)`    | **Disputes** — master-detail list, message plates, ADMIN DECISION plate, "Join dispute chat on Telegram" button; inline resolve controls for admins |
| `/notifications`     | **Inbox** — real event feed with unread bars synced to the sidebar badge                                       |
| `/profile`           | **Wallet & profile** — balance buckets, withdraw bar, vesting entries table, payout history, account stats, profile editing |
| `/admin`             | **Arbitration** (admins only) — platform stats, dispute resolve queue, all orders and payouts                  |

Every authed view lives inside the app shell: a 288px sidebar (wordmark, nav with unread badge,
live wallet summary, escrow-release meter), a topbar with breadcrumb + theme toggle + *Post an
ad*, and a marquee ticker of real escrow events.

## Tech stack

- **React 19** + **TypeScript**, built with **Vite**
- **react-router-dom v7** for client routing
- **react-hot-toast** for notifications
- **qrcode** for rendering the OxaPay invoice QR
- Plain CSS design system in [`src/index.css`](src/index.css) — CSS custom properties, no UI
  framework, no CSS-in-JS library
- Fonts: **Archivo** (400/600/800) for UI + headings, **IBM Plex Mono** (400/500/600) for
  numbers, addresses, IDs, timestamps and micro-labels

## Getting started

### 1. Boot the backend

The frontend needs the [Kolo backend](../../Kolo_Backend) (NestJS + Prisma + PostgreSQL) running
on `http://localhost:3000`. From the backend repo:

```bash
docker compose up -d          # PostgreSQL 16
npm install
npx prisma migrate deploy
npx prisma db seed            # demo users, listings, orders in every state
npm run start:dev             # API on :3000, Swagger at /docs
```

The backend's `.env` should have the demo switches on:

```
DEV_AUTH_BYPASS=true     # sign in with just an e-mail (see Authentication)
OXAPAY_MOCK=true         # fake invoices + built-in mock checkout page
PLATFORM_FEE_PERCENT=4   # matches the UI copy
```

### 2. Run the frontend

```bash
npm install
npm run dev               # http://localhost:5173
```

Optional — copy `.env.example` to `.env` if your API isn't on the default URL:

```
VITE_API_URL=http://localhost:3000/api
```

To open the app from your phone on the same network:

```bash
npm run dev -- --host     # then visit http://<your-machine-ip>:5173
```

## Authentication

The backend authenticates with **Clerk** (Google OAuth) in production, but ships a **dev
bypass**: when `DEV_AUTH_BYPASS=true`, any request may carry an `x-dev-user-email` header and
the API JIT-provisions that user on first contact.

The frontend uses this bypass as its session model:

- Signing in stores the e-mail in `localStorage` (`kolo-session-email`) and calls `GET /api/me`.
- Every API request sends the stored e-mail as `x-dev-user-email`
  (see [`src/api/client.ts`](src/api/client.ts)).
- The **password field on the login screen is decorative** — there is no password auth.
- Registering is the same call plus a `PATCH /api/me` to save the chosen display name.
- Admin rights come from the backend's `ADMIN_EMAILS` env list.

Swapping in real Clerk auth later only touches `src/api/client.ts` (replace the header with a
Bearer token) and the auth provider.

### Seeded accounts

| E-mail                        | Why you'd use it                                      |
| ----------------------------- | ----------------------------------------------------- |
| `elena.petrova@example.com`   | Seller with money in **every** wallet bucket          |
| `marcus.reid@example.com`     | Seller with one clean payout ready to withdraw        |
| `tom.becker@example.com`      | Buyer with open (unpaid) invoices                     |
| `priya.nair@example.com`      | Empty wallet — good for watching a balance fill up    |
| *first entry of `ADMIN_EMAILS`* | The admin — sees the Arbitration view               |

## Demo walkthrough

1. **Sign in** as `tom.becker@example.com` and open a service on the marketplace.
2. **Order it** — the backend creates the order plus an OxaPay invoice and the app jumps to the
   order view, which shows the payment card: QR of the invoice, a 60-minute countdown and an
   *Open OxaPay checkout* button.
3. **Pay** — with `OXAPAY_MOCK=true` the checkout is the backend's mock page; click *Simulate
   payment*. The signed webhook flips the order to `PAID`, and the order page (which polls every
   5 s) updates itself: escrow locked, **delivery details unlocked** for the buyer, vesting
   started.
4. **Seller side** — sign in as the seller: the sale appears under *Orders → Selling*, the money
   sits in the wallet's *vesting* bucket, and the inbox/ticker show the event.
5. **Withdraw** — as `marcus.reid@example.com`, open *Wallet & profile* and withdraw: the whole
   *available* bucket pays out to the address + network you enter.
6. **Dispute** — as a buyer of a paid order, *Open a dispute* from the order view: escrow
   freezes, the dispute appears with a *Join dispute chat on Telegram* button (if Telegram is
   configured; the dispute works either way).
7. **Arbitrate** — as the admin, resolve it from */admin* (or inline on the dispute): buyer wins
   → instant refund withdrawable by the buyer; seller wins → normal vesting resumes.

## Project structure

```
src/
  api/                 backend integration
    client.ts          fetch wrapper: base URL, dev-auth header, error contract
    types.ts           response shapes mirrored from the backend's Swagger examples
    index.ts           typed endpoint groups: usersApi, listingsApi, ordersApi,
                       walletApi, disputesApi, adminApi
  components/
    app-shell.tsx      sidebar + topbar + ticker + scrollable outlet (drawer on mobile)
    sidebar.tsx        nav, wallet mini-summary, escrow-release meter, user row
    topbar.tsx         breadcrumb, theme toggle, Post-an-ad, mobile hamburger
    ticker.tsx         marquee of real escrow events
    page.tsx           page frame: giant uppercase title + mono subtitle + 2px rule
    auth-layout.tsx    login/register split screen with the orange poster
    listing-card.tsx   marketplace card (artwork plate, seller row, price footer)
    qr-plate.tsx       QR of the OxaPay invoice with the animated scan line
    status-tag.tsx     solid inverted status chip
    count-up.tsx       ~950ms cubic ease-out number animation
    async-panel.tsx    uniform loading / error / empty states
    block-avatar.tsx   hard-edged square avatar
    icons.tsx          inline Lucide-style SVG icon set
    auth-provider.tsx  session context (dev-bypass e-mail → GET /me)
    require-auth.tsx   route guard (+ adminOnly variant)
  pages/               one file per route (see Screens above)
  hooks/
    use-async.ts       loader + loading/error/reload state
    use-auth.ts        auth context hook
    use-events.ts      shared event feed + unread count (one instance per shell)
    use-now.ts         render-stable clock (tick option for countdowns)
  lib/
    events.ts          derives inbox/ticker events from orders, disputes, payouts
    order-ui.ts        status → chip color maps, 5-step escrow bar logic
  utils/
    format.ts          dates, relative time, shortRef ids
    money.ts           2-decimal USD-string helpers, FEE_PERCENT mirror
  index.css            the whole design system: tokens, components, animations,
                       responsive utilities
  theme.ts             dark/light mode via [data-theme] + localStorage
```

## Architecture notes

- **Money is never a float.** The API returns 2-decimal USD strings (`"24.99"`); parsing and
  formatting go through `src/utils/money.ts`. 1 USDT = 1 USD platform-wide.
- **Notifications are derived, not stored.** The backend has no notifications table, so
  `src/lib/events.ts` builds the inbox, the unread badge and the ticker from the caller's real
  orders, disputes and withdrawals. Read state is a last-seen timestamp in `localStorage`. One
  shared feed instance per app shell keeps the badge and the inbox in sync.
- **Payment is webhook-driven.** The order view polls every 5 s while an invoice is open, so the
  OxaPay webhook's `PENDING_PAYMENT → PAID` flip appears without a refresh.
- **Error contract.** Every backend error is `{ statusCode, message, error }` with a displayable
  `message`; the client surfaces it directly in toasts and error plates.
- **`deliveryInfo` is sacred.** The seller's secret (credentials, keys, instructions) appears in
  exactly one place: the order view, for the buyer, once the order is `PAID`/`DISPUTED`/
  `REFUNDED` — mirroring the backend's rule.

## Design system

Implemented from the Kolo design handoff (`design_handoff_kolo_app`), which is the source of
truth for look and behavior:

- **Tokens** (`src/index.css`): dark theme is default; light is a `[data-theme="light"]`
  override scope. Neutral and accent ramps are *flipped* on dark (100 = darkest) so tinted fills
  stay dark. Orange `#f97316` is the single accent.
- **Zero border radius everywhere.** 2px rules separate major sections, 1px inside components.
- **Type**: Archivo for UI/headings (800 for display), IBM Plex Mono for all numerals, ids,
  timestamps and uppercase micro-labels. Body is 16px.
- **Status chips** are solid inverted blocks: status color background, page-background ink.
- **Poster panels** are always orange with near-black ink and a drifting diagonal stripe field.
- **Animations** per the handoff timing spec: staggered `fadeUp` entrances, `growBar` meters,
  count-up numbers, the ticker marquee (pauses on hover), the QR scan line, progress-bar sheen —
  all disabled under `prefers-reduced-motion`.
- **Theme toggle** persists to `localStorage` and transitions surfaces over 250ms.

## Responsive behavior

The app works from desktop down to phone width (audited at 390px with zero horizontal
overflow):

- Below **~980px** the sidebar becomes a slide-in drawer with a topbar hamburger and backdrop.
- Marketplace cards go 3 → 2 → 1 columns; stat cells 4 → 2 → 1; all two-column and
  master-detail layouts collapse to one column; filter bars wrap; tables scroll horizontally
  inside their cards.
- The app frame uses `100dvh` so mobile URL bars don't clip the UI, inputs are 16px on small
  screens (no iOS focus zoom), giant headlines clamp to the viewport, and *Post an ad* collapses
  to its icon on tiny screens.

## Environment variables

| Variable       | Default                     | Purpose                       |
| -------------- | --------------------------- | ----------------------------- |
| `VITE_API_URL` | `http://localhost:3000/api` | Base URL of the Kolo backend  |

## Scripts

| Command           | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Vite dev server on `http://localhost:5173`  |
| `npm run build`   | Type-check (`tsc -b`) + production build    |
| `npm run preview` | Serve the production build locally          |
| `npm run lint`    | ESLint (incl. react-hooks purity rules)     |

## Design ↔ backend adaptations

The design handoff describes a few concepts the backend intentionally doesn't have. The UI keeps
the visual language but backs every widget with real data:

| Design concept                       | What ships instead                                                                 |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Reputation scores, tiers, REP chips  | Real account stats (sales, disputes lost, member age) and a real escrow-release meter; vesting is a flat 30 days per order |
| Reviews & star ratings               | Real "more from this seller" listings and platform guarantees                       |
| In-app dispute chat with evidence    | The real Telegram arbitration flow: opening plate, admin decision plate, invite-link button |
| Per-asset payment chips + addresses  | The real OxaPay checkout (100+ assets chosen there) + QR of the actual invoice      |
| Notifications backend                | Client-derived event feed from orders / disputes / payouts                          |
| Seller-uploaded artwork              | Deterministic placeholder plates until the backend stores images                    |
