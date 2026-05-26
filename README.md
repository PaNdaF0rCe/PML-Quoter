# Pack Me Lanka Quoter

Internal quotation calculator for Pack Me Lanka. Built with React + Vite + Tailwind CSS + Firebase + PWA.

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project.
2. Enable **Firestore** (start in test mode, then lock down rules).
3. Enable **Authentication → Email/Password** and create an admin user.
4. Copy your Firebase config from Project Settings → Your apps → Web app.

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase values:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run Locally

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

### 4. Seed Default Pricing

1. Open the app and go to `/admin/login`
2. Sign in with your Firebase admin account
3. On the Admin Dashboard, click **Seed Default Pricing**
4. Pricing is now stored in Firestore and editable from the dashboard

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked about settings:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Then add environment variables in the Vercel dashboard (Settings → Environment Variables) — same keys as `.env.local`.

### Option B — GitHub + Vercel

1. Push this repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all `VITE_FIREBASE_*` env vars in the Vercel dashboard
4. Deploy

## Firestore Security Rules (Recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /config/pricing {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Project Structure

```
src/
  firebase/          Firebase config + Firestore helpers
  lib/pricing/       Calculation logic + TypeScript types
  data/defaults/     Default seed data for first setup
  components/
    calculator/      Public calculator form + quote summary
    admin/           Admin pricing editors (per-section)
    ui/              Shared components (Button, Input, Card, etc.)
  context/           AuthContext + PricingContext (React contexts)
  pages/             CalculatorPage, AdminLoginPage, AdminDashboardPage
```

## Access Rules

| Route | Access |
|-------|--------|
| `/` | Anyone with the link — no login required |
| `/admin/login` | Anyone (login form) |
| `/admin` | Authenticated admin only |

## Pricing Logic

- **Base price** = (product type rate + reel size rate) × costing tier qty
- **Costing tier** = next available tier at or above requested quantity
- **Printing** = (colour rate + area rate) × costing tier qty (if enabled)
- **Material** = selected material rate × costing tier qty (mutually exclusive)
- **Add-ons** = per-unit rate × costing tier qty (each optional)
- **Labour** = configured % of subtotal (default 30%)
- **Total** = subtotal + labour
- **Per unit** = total ÷ costing tier qty

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
