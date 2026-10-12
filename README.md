<p align="center">
  <img src="kolo_frontend/public/logo.png" alt="Kolo" width="160" />
</p>

<p align="center"><strong>Subscriptions below retail.</strong></p>

Kolo is a marketplace where people share the spare months on their subscriptions. Buyers get
services like Netflix, Spotify, ChatGPT and Adobe for a fraction of the retail price, and their
money stays in escrow until the access has actually lasted.

This repository is the **web app** (React). The API lives in
[Kolo_Backend](https://github.com/branislavstojkovic70/Kolo_Backend).

## What it does

- **Browse real products below retail.** Sellers can only list products from a curated catalogue
  (15 subscriptions, from streaming to AI tools), so every offer sits next to its official price.
- **Pay safely.** Buyers pay a crypto invoice. The money is held by Kolo, not the seller, and
  access details unlock the moment payment confirms.
- **Get help when something breaks.** For 30 days after paying, a buyer can ask for help. The money
  freezes and a private Telegram chat opens with the buyer, the seller and the Kolo team.
- **Set Deal Alerts.** Name the most you'd pay for a product, and Kolo buys it for you the moment a
  matching listing appears, holding it for 15 minutes while you pay.
- **Track your savings.** Kolo shows how much each buyer has saved against retail prices.
- **Sell spare months.** Sellers keep 96% of every sale (Kolo's fee is 4%), paid out in crypto once
  each order has cleared.

## How the money moves

```
Buyer pays  ->  Kolo holds it  ->  Access delivered  ->  30-day clearing  ->  Seller paid
                      |
                      +-- buyer asks for help: money freezes until a person decides
```

The clearing period is the core idea: the seller only gets paid if the access survives, which is
exactly the scam informal sharing groups can't protect against. The fee, clearing period and
help window are set by the backend, so the app never hardcodes them.

## Quick start

You need **Node.js**, **Docker** (for PostgreSQL) and the
[backend repo](https://github.com/branislavstojkovic70/Kolo_Backend) cloned next to this one.

1. Start the backend (database, demo data, API on port 3000):

   ```bash
   cd Kolo_Backend
   cp .env.example .env
   docker compose up -d
   npm install
   npx prisma migrate deploy
   npx prisma db seed
   npm run start:dev
   ```

   For a local demo, set `DEV_AUTH_BYPASS=true` and `OXAPAY_MOCK=true` in the backend `.env`.
   You can then sign in with just an e-mail and pay invoices with a built-in "Simulate payment"
   button.

2. Start the web app:

   ```bash
   cd Kolo_Frontend/kolo_frontend
   npm install
   npm run dev
   ```

3. Open <http://localhost:5173>. Signed out, you see the landing page. With no frontend `.env`,
   the app uses the e-mail login: sign in as `marcus.reid@example.com`, or any account the seed
   prints, to use the marketplace.

## Learn more

[`kolo_frontend/README.md`](kolo_frontend/README.md) covers the details: every screen,
authentication (Clerk or dev login), the seeded accounts, a demo walkthrough, project structure,
architecture notes, the design system and environment variables.

**Built with** React 19, TypeScript and Vite, with Clerk for sign-in, OxaPay for crypto payments
and Vercel for hosting.

## License

No license has been chosen yet, so all rights are reserved by default.
