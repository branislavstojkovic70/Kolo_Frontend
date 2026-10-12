# Kolo web app

The React frontend of [Kolo](../README.md), a marketplace where people share the spare months on
their subscriptions. Buyers pay a crypto invoice into escrow, sellers are paid after a clearing
period, and anything that goes wrong is settled by a person in a private Telegram chat.

It runs against the real [Kolo backend](https://github.com/branislavstojkovic70/Kolo_Backend)
(NestJS, Prisma, PostgreSQL). There is no mock data in this app.

## Contents

- [Screens](#screens)
- [Getting started](#getting-started)
- [Authentication](#authentication)
- [Demo walkthrough](#demo-walkthrough)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Design system](#design-system)
- [Responsive layout and accessibility](#responsive-layout-and-accessibility)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Deploying](#deploying)
- [Not built yet](#not-built-yet)

## Screens

| Route | Screen |
| --- | --- |
| `/` | **Landing page** for signed-out visitors, built from live listings and platform numbers. Signed-in users go straight to Browse. |
| `/login`, `/register` | Sign in and create account: Clerk's widget, or the e-mail dev login (see [Authentication](#authentication)). |
| `/ads` | **Browse**: search, category chips, price and sort filters, Everything / My listings. |
| `/ads/:id` | **Listing**: brand cover, savings against retail, Buyer Protection promises, Buy now. Sellers get pause, edit, cover photo and remove (with an inline confirm). |
| `/ads/new`, `/ads/:id/edit` | **Sell a subscription**: catalogue picker, price, quantity, private access details, live fee preview, inline validation. |
| `/alerts` | **Deal Alerts**: set a max price for a product; matched deals show a payment countdown. |
| `/orders` | **Orders**: All / Buying / Selling, search, status filter, a progress bar per order. |
| `/orders/:id` | **Order**: payment card (QR, checkout link, hold countdown), 5-step protection tracker, access details for the buyer, *Get help with this order*. |
| `/disputes`, `/disputes/:id` | **Resolution**: help requests and the case view with the Telegram chat button. Admins decide here, with a two-step confirm. |
| `/notifications` | **Activity**: everything that happened on your orders, requests and transfers. |
| `/profile` | **Wallet**: ready balance with a breakdown bar, withdraw (with a confirmation step), account details, order-by-order and transfer history. |
| `/admin` | **Resolution centre** (admins only): platform stats, dispute queue, all orders, transfers and deal alerts. |

Signed-in screens share one shell: a sidebar (navigation, ready-to-withdraw card, savings card),
a topbar (savings badge, theme toggle, *Sell a subscription*) and a strip of recent activity.

## Getting started

### 1. Start the backend

The app needs the [Kolo backend](https://github.com/branislavstojkovic70/Kolo_Backend) on
`http://localhost:3000`. From the backend repo:

```bash
cp .env.example .env
docker compose up -d          # PostgreSQL 16
npm install
npx prisma migrate deploy
npx prisma db seed            # demo users, listings and orders in every state
npm run start:dev             # API on :3000, Swagger docs at /docs
```

For a local demo, turn these on in the backend `.env`:

```bash
DEV_AUTH_BYPASS=true   # sign in with just an e-mail
OXAPAY_MOCK=true       # fake invoices, plus a built-in checkout with a "Simulate payment" button
```

### 2. Run the app

```bash
npm install
npm run dev               # http://localhost:5173
```

With no `.env`, the app talks to `http://localhost:3000/api` and uses the e-mail dev login. Copy
[`.env.example`](.env.example) to `.env` to change either.

To open the app from your phone on the same network:

```bash
npm run dev -- --host     # then visit http://<your-machine-ip>:5173
```

## Authentication

The app has two session models. One env var decides which one runs:
`VITE_CLERK_PUBLISHABLE_KEY` (see [`src/lib/clerk.ts`](src/lib/clerk.ts)).

### Clerk (key set)

- `<ClerkProvider>` wraps the app, and `/login` and `/register` render Clerk's
  [`<SignIn>`](src/pages/login.tsx) and [`<SignUp>`](src/pages/register.tsx), restyled to match
  the active theme. Google sign-in and other methods are switched on in the Clerk dashboard, not in
  code.
- Every API request carries `Authorization: Bearer <clerk session token>`, minted per request with
  Clerk's `getToken()`.
- The backend verifies the token and creates the Kolo account on first sign-in. It **adopts an
  existing account with the same e-mail**, so a seeded account keeps its data after its first real
  Clerk login.
- Both routes are mounted as splats (`/login/*`) because Clerk puts its sub-steps (2FA, SSO
  callback) underneath them.

Set the matching `CLERK_SECRET_KEY` in the **backend** `.env`, from the same Clerk instance.

### Dev login (key empty)

A fallback so the seeded demo runs without a Clerk account. Needs `DEV_AUTH_BYPASS=true` on the
backend.

- Signing in stores the e-mail in `localStorage` (`kolo-session-email`) and calls `GET /api/me`.
- Every API request sends that e-mail as `x-dev-user-email`
  (see [`src/api/client.ts`](src/api/client.ts)).
- The **password field is decorative**: this path has no password check.
- Registering is the same call plus `PATCH /api/me` to save the display name.

The client sends either the token or the e-mail header, never both: the backend checks the e-mail
header first, so a stray one would outrank a real token.

Admin rights come from the backend's `ADMIN_EMAILS` list in either mode.

### Seeded accounts

`npx prisma db seed` prints a cheat sheet of every demo account when it finishes. The useful ones:

| Account | Use it for |
| --- | --- |
| The main demo account (top of the cheat sheet) | Money in every wallet bucket, plus listings, orders and open requests |
| `marcus.reid@example.com` | One clean payout ready to withdraw |
| `tom.becker@example.com` | A buyer with two unpaid invoices |
| `priya.nair@example.com` | The seller of the Adobe and Notion listings |
| First entry of `ADMIN_EMAILS` | The admin: sees the Resolution centre |

With Clerk on, sign in with a real account whose e-mail matches one of these to inherit its data.

## Demo walkthrough

With `DEV_AUTH_BYPASS=true` and `OXAPAY_MOCK=true` on the backend:

1. **Buy.** Sign in as `tom.becker@example.com`, open a listing he doesn't own and click
   *Buy now*. The order page shows the payment card: the invoice QR, a checkout link and a
   countdown while the unit is held for him (`AUTO_BUY_RESERVATION_MINUTES`, 15 by default).
2. **Pay.** Open the checkout. With the mock on, it's the backend's own page: click
   *Simulate payment*. The order page checks every 5 seconds, flips to paid on its own and
   unlocks the access details.
3. **Sell.** Sign in as the seller. The sale is under *Orders → Selling* and the money sits in the
   wallet's *Clearing* part of the balance bar.
4. **Withdraw.** As `marcus.reid@example.com`, open the Wallet, add payout details and withdraw.
   The app reads the amount, network and address back before anything is sent. With the mock on,
   no real money moves.
5. **Deal Alert.** As a buyer, set an alert at or above a live listing's price. It matches
   straight away and starts a payment countdown.
6. **Ask for help.** On a paid order, click *Get help with this order*. The money freezes and the case appears
   under Resolution, with a Telegram chat button if Telegram is configured on the backend.
7. **Decide.** As the admin, settle it in the Resolution centre. If the buyer wins, the refund is
   withdrawable right away; if the seller wins, clearing resumes.

To show a withdrawal from a fresh sale without waiting 30 days, set `VESTING_DAYS=0` on the
backend before the demo.

## Project structure

```
src/
  api/                     backend integration
    client.ts              fetch wrapper: base URL, auth header, error contract
    types.ts               response shapes mirrored from the backend
    index.ts               typed endpoint groups: config, products, users, listings,
                           orders, wallet, stats, buy requests, disputes, admin
  components/
    app-shell.tsx          sidebar + topbar + activity strip + routed view (drawer on mobile)
    sidebar.tsx            navigation, ready-to-withdraw card, savings card
    topbar.tsx             breadcrumb, savings badge, theme toggle, Sell a subscription
    listing-card.tsx       marketplace card
    listing-cover.tsx      seller photo, or the product's brand mark as cover art
    product-picker.tsx     catalogue dropdown grouped by category
    qr-plate.tsx           QR of the payment invoice (light in both themes)
    async-panel.tsx        shared loading skeleton, error with retry, empty state
    pagination.tsx         page-size picker and pager
    platform-config-provider.tsx   loads GET /api/config once for the whole app
    ...                    auth, avatars, status chips, icons, theme toggle, ticker
  pages/                   one file per screen (see Screens)
  hooks/                   async loading, auth, activity feed, list controls,
                           platform config, theme, media queries, page titles
  lib/
    clerk.ts               Clerk on/off switch and theming
    events.ts              builds the activity feed from orders, disputes and transfers
    listing-ui.ts          availability, listing and deal-alert status labels, countdowns
    order-ui.ts            order and transfer status labels, the 5-step tracker logic
  utils/                   dates, money formatting
  index.css                the design system: tokens, components, responsive rules
  landing.css              landing page layout (lp- prefixed)
  theme.ts                 dark/light switch, persisted to localStorage
public/
  brands/                  512px brand icons, one per catalogue product (WebP, two SVG)
  logo.png                 the Kolo wordmark
```

## Architecture notes

- **Money is never a float.** The API returns 2-decimal USD strings (`"24.99"`); parsing and
  formatting go through [`src/utils/money.ts`](src/utils/money.ts). 1 USDT = 1 USD.
- **Nothing the backend owns is hardcoded.** The fee, clearing period, help window, minimum payout,
  hold time and payout currencies and networks all come from `GET /api/config`, loaded once by
  [`PlatformConfigProvider`](src/components/platform-config-provider.tsx). Change
  `PLATFORM_FEE_PERCENT` or `VESTING_DAYS` on the backend and every screen follows.
  Marketplace headline numbers come from `GET /api/listings/stats`, counted in SQL.
- **Activity is derived, not stored.** The backend has no notifications table, so
  [`src/lib/events.ts`](src/lib/events.ts) builds the feed, the unread badge and the activity strip
  from the user's real orders, disputes and transfers. Read state is a timestamp in `localStorage`.
- **Payment is webhook-driven.** The order page checks every 5 seconds while an invoice is open,
  so the payment webhook's flip to paid appears without a refresh.
- **Access details stay secret.** The seller's access details appear in one place only: the order
  page, for the buyer, once the order is paid, disputed or refunded. This mirrors the backend.
- **Covers are brand art or photos.** A listing with no seller photo shows its product's brand mark
  from `public/brands`, centered on a backdrop made from the logo's own colors
  ([`ListingCover`](src/components/listing-cover.tsx)). A seller's own photo fills the frame.
- **Errors are displayable.** Every backend error is `{ statusCode, message, error }`; the app shows
  `message` directly in toasts and error panels, with a retry where a reload exists.

### Lists: search, filter, pagination

Orders, disputes, deal alerts and the marketplace page **on the server**: `page`, `limit`,
`search`, `status` and the marketplace filters go to the API and come back as
`{ items, total, page, limit, pages }`. Page sizes are 10, 20, 50 and 100.
[`useListControls`](src/hooks/use-list-controls.ts) holds the debounced search, the filter and the
page, and any filter change returns to page 1.

The activity feed pages **in the browser**, because its events are derived and have no table. The
orders list calls `GET /api/orders?role=all|buying|selling` instead of merging two separately paged
lists.

## Design system

Everything lives in [`src/index.css`](src/index.css) as CSS custom properties. There is no UI
framework or CSS-in-JS library.

- **Two themes.** Dark is the default; light is an override under `[data-theme="light"]`. The
  choice is stored as `kolo.theme`, and a small script in `index.html` applies it before the first
  paint so there is no flash.
- **Tokens are named by role,** not shade (`--surface-card`, `--accent-ink`, `--on-accent`), so the
  same component reads correctly in both themes.
- **One accent:** `#ff385c`, for primary actions, savings and the active nav item.
- **Type:** Inter, weights 400 to 700.
- **Shape:** 8px radius on buttons and inputs, 14px on cards, fully rounded chips and badges.
- **Motion:** staggered entrances, count-up numbers and the activity strip. CSS animations and
  transitions turn off under `prefers-reduced-motion`.

## Responsive layout and accessibility

- **Three widths:** phone below 744px, tablet from 744 to 1127px, desktop from 1128px.
- **Below 1128px** the sidebar becomes a drawer opened from the topbar, the listing's buy card
  becomes a fixed bottom bar, and Resolution shows either the list or the case, depending on the
  route.
- Checked at 375, 768 and 1140px with no horizontal scrolling.
- **Keyboard and screen readers:** navigation uses real links, the first tab stop is a
  *Skip to content* link, the active nav item has `aria-current`, focus moves into the drawer and
  back, and every screen sets its own page title.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api` | Base URL of the Kolo backend |
| `VITE_CLERK_PUBLISHABLE_KEY` | *(empty)* | Clerk publishable key (`pk_test_…` or `pk_live_…`). Empty means the e-mail dev login. |

Copy [`.env.example`](.env.example) to `.env` and fill in what you need. `.env` is gitignored.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `http://localhost:5173` |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint, including the React hooks rules |

## Deploying

The app deploys to Vercel from this `kolo_frontend` folder.
[`vercel.json`](vercel.json) sends every path to `index.html`, so client-side routes like
`/orders/abc` load directly. Set `VITE_API_URL` (your deployed backend) and
`VITE_CLERK_PUBLISHABLE_KEY` in the Vercel project's environment variables.

## Not built yet

- Seller ratings and reputation. The clearing period is a flat 30 days for everyone.
- Card payments. Buyers pay in crypto through OxaPay.
- A native mobile app. The web app works on phones.
