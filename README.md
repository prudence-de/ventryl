# Ventryl — B2B Petroleum Marketplace

Nigeria's B2B petroleum marketplace connecting licensed fuel buyers with depot suppliers.  
**Stack:** React 19 · Vite · Recharts · Manrope (Google Fonts)

---

## Run Locally

### Prerequisites
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 9+

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (opens at http://localhost:3000)
npm run dev
```

That's it. The app opens automatically at **http://localhost:3000**

---

## Deploy to Vercel

### Option A — Vercel CLI (recommended, 60 seconds)

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy from project root
vercel

# Follow the prompts:
#   Set up and deploy? → Y
#   Which scope? → your username or team
#   Link to existing project? → N
#   Project name → ventryl (or your preferred name)
#   Directory → ./  (press Enter)
#   Override settings? → N

# 4. Your site is live! Vercel prints the URL.

# For production deployment (custom domain, etc.)
vercel --prod
```

### Option B — GitHub + Vercel Dashboard (zero CLI)

```
1. Push this folder to a GitHub repo:
   git init
   git add .
   git commit -m "Initial commit — Ventryl MVP"
   git remote add origin https://github.com/YOUR_USERNAME/ventryl.git
   git push -u origin main

2. Go to vercel.com → "Add New Project"
3. Import your GitHub repo
4. Framework Preset: Vite (auto-detected)
5. Build Command:   npm run build   (auto-filled)
6. Output Dir:      dist            (auto-filled)
7. Click "Deploy"

Vercel handles CI/CD — every git push auto-deploys.
```

---

## Project Structure

```
ventryl/
├── public/
│   └── favicon.svg          # Brand favicon (green V)
├── src/
│   ├── App.jsx              # Full application (Buyer + Depot portals)
│   ├── main.jsx             # React entry point
│   └── index.css            # Global reset + input styles
├── index.html               # HTML shell with meta tags + font preload
├── vite.config.js           # Vite config (port 3000, chunking)
├── vercel.json              # SPA routing + cache headers
├── package.json
└── README.md
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |

---

## Portals

| Portal | User | Description |
|--------|------|-------------|
| **Buyer** | Chukwuma Fuels Ltd | Dashboard, price discovery, 3-step order flow, wallet |
| **Depot** | Nepal Energies | Dashboard, order inbox, truck schedule, buyer network |

Switch between portals using the floating pill (mobile) or the top bar (desktop).

---

Built with the Ventryl PRD v1.0 · March 2026 · Confidential
