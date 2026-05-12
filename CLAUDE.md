# Rexvapes

Inventory & sales tracking app for vape shop.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Icons | Lucide React |
| Routing | React Router 7 |
| Hosting | GitHub Pages |

---

## Project Structure

```
rexvapes/
├── public/
│   └── 404.html         # GitHub Pages SPA redirect
├── src/
│   ├── components/
│   │   ├── AvailabilityCard.jsx
│   │   ├── FlavorCard.jsx
│   │   ├── Layout.jsx       # Protected layout (sidebar + dark mode)
│   │   ├── LowStockAlert.jsx
│   │   ├── ModelSelector.jsx
│   │   ├── Navbar.jsx
│   │   ├── PublicLayout.jsx # Public layout (dark mode)
│   │   ├── RestockModal.jsx
│   │   ├── SaleModal.jsx    # Internal use + discount features
│   │   └── Sidebar.jsx      # Collapsible sidebar
│   ├── context/
│   │   └── AuthContext.jsx  # Supabase auth state
│   ├── lib/
│   │   └── supabase.js      # Supabase client init
│   ├── pages/
│   │   ├── public/
│   │   │   └── Availability.jsx  # Public stock check (/)
│   │   ├── Dashboard.jsx    # KPIs overview
│   │   ├── History.jsx      # Transaction history (default today)
│   │   ├── Inventory.jsx    # Stock management + filters
│   │   ├── Login.jsx        # Auth page (dark mode)
│   │   ├── Reports.jsx      # Analytics
│   │   ├── Reservations.jsx # Reserve items for future delivery
│   │   ├── Sales.jsx        # Record sales
│   │   └── Settings.jsx     # Models & flavors config
│   ├── App.jsx              # Routes + ProtectedRoute
│   ├── App.css
│   ├── index.css            # Tailwind + dark mode variant
│   └── main.jsx             # Entry point
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Pages deployment
├── index.html               # SPA redirect handler script
└── package.json             # homepage: GitHub Pages URL
```

---

## Database Schema (Supabase)

### Tables

| Table | Purpose |
|-------|---------|
| `models` | Vape device models (name, puffs, price) |
| `flavors` | Flavors per model (stock, min_stock) |
| `sales` | Sales records (quantity, price, total) |
| `restocks` | Restock records (quantity, cost) |
| `cancellations` | Cancelled sales log |
| `reservations` | Reserved items for future delivery |

### Key Columns

**models**
- `id` (UUID), `name`, `puffs`, `price`, `cost`, `is_active`

**flavors**
- `id` (UUID), `model_id` (FK), `name`, `name_es`, `stock`, `min_stock`, `is_active`

**sales**
- `id` (UUID), `flavor_id` (FK), `quantity`, `price`, `total`, `sold_at`, `notes`

**restocks**
- `id` (UUID), `flavor_id` (FK), `quantity`, `cost`, `restocked_at`, `notes`

### Row Level Security

- **Public (anon)**: Can read active models, flavors, and **active reservations** (for availability page)
- **Authenticated**: Full access to all tables

**IMPORTANT**: The `reservations` table needs an RLS policy for anonymous users, otherwise the public Availability page won't subtract reserved items from stock.

```sql
-- Required policy for public Availability page
CREATE POLICY "Allow anonymous read active reservations"
ON reservations
FOR SELECT
TO anon
USING (status = 'active');
```

---

## Routes

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | Availability | No |
| `/login` | Login | No |
| `/dashboard` | Dashboard | Yes |
| `/inventory` | Inventory | Yes |
| `/sales` | Sales | Yes |
| `/history` | History | Yes |
| `/reports` | Reports | Yes |
| `/reservations` | Reservations | Yes |
| `/settings` | Settings | Yes |

---

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Fix package-lock.json sync issues
rm -rf node_modules package-lock.json && npm install
```

## Git

- **Branch**: `master`
- **Remote**: `https://github.com/vicleyva/rexvapes.git`
- **Live URL**: `https://vicleyva.github.io/rexvapes`

---

## Versioning

**Current Version**: `v1.4.4`

**Location**: `src/components/Sidebar.jsx` and `src/components/PublicLayout.jsx` → `APP_VERSION` constant

Displayed on public page header next to Login button. **Bump version on each deploy** to verify deployment.

```javascript
const APP_VERSION = 'v1.0.3'  // Update this!
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Dark Mode (Tailwind v4)

**CRITICAL**: Tailwind CSS v4 uses media query for dark mode by default. To enable class-based toggling:

```css
/* src/index.css */
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));
```

This allows `document.documentElement.classList.add('dark')` to work properly.

---

## GitHub Pages Deployment

### Setup

1. **Repository Settings** → Pages → Source: GitHub Actions
2. **Secrets** (Settings → Secrets → Actions):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Security Note

The Supabase anon key is **public by design** - it's embedded in the built JS. Security comes from Row Level Security (RLS) policies, not the key itself.

### Workflow

File: `.github/workflows/deploy.yml`
- Triggers on push to `master` branch
- Uses secrets for environment variables
- Deploys to GitHub Pages

### IMPORTANT: Deployment Process

**Do NOT use `npm run deploy` alone** - it pushes to `gh-pages` branch but GitHub Pages is configured to build from `master` via GitHub Actions.

**Correct deployment:**
```bash
# 1. Commit changes to master
git add -A && git commit -m "Description (vX.X.X)"

# 2. Push to master (triggers workflow)
git push origin master
```

The workflow will build and deploy automatically. Check workflow status:
```bash
gh run list --limit 1
```

### SPA 404 Fix

GitHub Pages doesn't understand client-side routes. When user refreshes `/dashboard`, GitHub returns 404.

**Solution**: Two-file redirect pattern:

**`public/404.html`** - Catches 404 and redirects with path in query string:
```javascript
var l = window.location;
l.replace(
  l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
  l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
  l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
  (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
  l.hash
);
```

**`index.html`** - Script in `<head>` restores the path:
```javascript
if (l.search[1] === '/' ) {
  var decoded = l.search.slice(1).split('&').map(function(s) {
    return s.replace(/~and~/g, '&')
  }).join('?');
  window.history.replaceState(null, null,
    l.pathname.slice(0, -1) + decoded + l.hash
  );
}
```

---

## UI Patterns

- **Language**: Spanish (Ventas, Inventario, Sabores, etc.)
- **Dark mode**: Class-based via `dark:` classes (see Dark Mode section)
- **Colors**: Blue/Purple primary, standard status colors
- **Cards**: `rounded-xl border border-gray-200 dark:border-gray-700`
- **Buttons**: `rounded-xl` with hover transitions

---

## Key Features

1. **Public Availability** - Customers check stock without login
2. **Low Stock Alerts** - Dashboard shows items at/below `min_stock`
3. **Sales Recording** - Select flavor, quantity, auto-calculate total
4. **Restock Tracking** - Record incoming inventory
5. **Reports** - Sales analytics and trends
6. **Internal Use** - Record $0 sales for internal use (orange toggle)
7. **Custom Price/Discount** - Apply discounts with savings display (green toggle)
8. **Collapsible Sidebar** - Toggle between full (256px) and icon-only (80px) modes
9. **Inventory Filters** - Filter by: Todos | Con stock | Agotados
10. **History Date Default** - Defaults to today's date
11. **Cancel Sale** - X button on History to cancel sale and restore stock
12. **Version Display** - Shows version on public page to verify deployments
13. **Reservations** - Reserve items for future delivery (sale created on payment, not delivery)
14. **Available Stock** - Stock minus reserved shown across Inventory, Sales, Availability
15. **History Type Column** - Shows badges for internal use (orange) and discount (green)
16. **Profit Tracking** - Model cost field enables profit/margin calculations
17. **Margin Column** - History and Reservations show profit/loss per transaction (green/red)
18. **Promo Fullscreen** - Escape key exits, responsive mobile layout

---

## Supabase Queries Pattern

```javascript
import { supabase } from '../lib/supabase'

// Fetch with filter
const { data, error } = await supabase
  .from('flavors')
  .select('*')
  .eq('is_active', true)

// Insert
const { error } = await supabase
  .from('sales')
  .insert({ flavor_id, quantity, price, total })

// Update
const { error } = await supabase
  .from('flavors')
  .update({ stock: newStock })
  .eq('id', flavorId)
```

---

## LocalStorage Keys

| Key | Purpose | Values |
|-----|---------|--------|
| `rexvapes_darkmode` | Dark mode preference | `'true'` / `'false'` |
| `rexvapes_sidebar_collapsed` | Sidebar collapse state | `'true'` / `'false'` |

---

## Sales Modal Features

### Internal Use (Uso Interno)
- Orange toggle button
- Sets price to $0, disables price editing
- Auto-prefixes notes with `[USO INTERNO]`
- Mutually exclusive with discount

### Custom Price/Discount (Descuento)
- Green toggle button
- Shows custom price input field
- Displays savings: `Ahorras: $X.XX`
- Auto-prefixes notes with `[DESCUENTO -$X.XX]`
- Mutually exclusive with internal use

---

## Collapsible Sidebar

**Props**: `collapsed`, `onCollapse`

| State | Width | Content |
|-------|-------|---------|
| Expanded | 256px (`w-64`) | Full text + icons |
| Collapsed | 80px (`w-20`) | Icons only + tooltips |

Toggle button at bottom with ChevronLeft/ChevronRight icon.

---

## Inventory Filters

Three filter buttons: **Todos** | **Con stock** | **Agotados**

```javascript
const matchesStock = stockFilter === 'all' ||
  (stockFilter === 'stocked' && f.stock > 0) ||
  (stockFilter === 'empty' && f.stock === 0)
```

---

## Logo

**File**: `public/logo.png` (Rex Vapes dinosaur logo)

**Path in components**: Use `import.meta.env.BASE_URL + "logo.png"` for GitHub Pages compatibility.

| Location | Size |
|----------|------|
| Sidebar (expanded) | 176px (`w-44`) |
| Sidebar (collapsed) | 56px (`w-14`) |
| Mobile header | 56px (`w-14`) |
| Public header | 40px (`w-10`) |
| Login page | 128px (`w-32`) |
| Favicon | `index.html` → `./logo.png` |

---

## Profit & Cost Tracking

### Model Cost Field

**Column**: `models.cost` (numeric, nullable)

Stores purchase cost per unit. Used to calculate profit margins.

**Display in Settings**: `Costo: $63 • +$57` (cost and profit per unit)

### Profit Calculation

```javascript
// Revenue - (Quantity × Model Cost)
const profit = totalRevenue - (quantity * model.cost)
```

| Scenario | Revenue | Cost | Margin |
|----------|---------|------|--------|
| Normal sale ($120) | $120 | $63 | +$57 (green) |
| Internal use ($0) | $0 | $63 | -$63 (red) |
| Discounted ($100) | $100 | $63 | +$37 (green) |

### Where Profit Shows

| Page | What Shows |
|------|------------|
| **Reports** | Summary cards: Ventas, Costo, Ganancia, Promedio |
| **History** | Summary cards + Margen column per sale |
| **Reservations History** | Margen column per reservation |

### Supabase Query for Cost

```javascript
// Get sales with model cost via nested join
const { data } = await supabase
  .from('sales')
  .select('*, flavors(model_id, models(cost))')

// Access: sale.flavors?.models?.cost
```

---

## SaleModal (Client-Facing)

**"Uso interno" button is HIDDEN** - removed from UI so clients don't see internal pricing.

Only "Descuento" button visible for discounts.

Internal use state/logic kept in code for potential future admin features.

---

## RestockModal Auto-Fill

Cost field auto-fills from model's default cost:

```javascript
useEffect(() => {
  if (isOpen) {
    setCost(model?.cost ? model.cost.toString() : '')
  }
}, [isOpen, model])
```

---

## Number Input Steps

| Field | Step | Reason |
|-------|------|--------|
| Price | 10 | Typical increments |
| Cost | 10 | Typical increments |
| Puffs | 100 | Puff counts are larger numbers |

```html
<input type="number" step="10" />
```

---

## Promo Page (Fullscreen Mode)

### Escape Key to Close

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && fullscreen) {
      setFullscreen(false)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [fullscreen])
```

### Mobile Responsive

- Layout: `flex-col sm:flex-row` (stacks vertically on mobile)
- Logo: `h-32 sm:h-80` (smaller on mobile)
- Gradient selector: `p-1` padding prevents circle clipping

---

## Public Header (Availability Page)

**Thin header** for minimal branding:

| Element | Size |
|---------|------|
| Logo | `w-10 h-10` (40px) |
| Padding | `py-2` (8px) |

---

## Notes

- Stock decrements automatically on sale
- Stock increments on restock
- Flavors belong to models (FK relationship)
- Soft delete via `is_active` flag (not actual DELETE)
- History page defaults to today's date for both from/to filters
- Dark mode toggle available on: Public pages, Login, Admin layout
- Cancel sale restores stock automatically
- Internal use items deduct from profit (show negative margin)
