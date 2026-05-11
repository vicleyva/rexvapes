# Rexvapes - Inventory & Sales Tracker

React app for tracking vape inventory and sales.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: GitHub Pages

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL from `supabase/schema.sql` in the SQL Editor
3. Run the SQL from `supabase/seed.sql` to add initial data

### 3. Configure environment

Copy `.env.example` to `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

## Deployment

### GitHub Pages

```bash
npm run build
npm run deploy
```

Or push to main branch - GitHub Actions will auto-deploy.

## Features

- **Public page**: Check flavor availability (no login required)
- **Dashboard**: Sales and inventory overview
- **Inventory**: Manage stock levels
- **Sales**: Record sales
- **History**: View past transactions
- **Reports**: Analytics and insights
- **Settings**: Manage models and flavors

## Create Admin User

In Supabase Dashboard > Authentication > Users > Add user

