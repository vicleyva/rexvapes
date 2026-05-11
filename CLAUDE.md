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
src/
├── components/          # Reusable UI components
│   ├── AvailabilityCard.jsx
│   ├── FlavorCard.jsx
│   ├── Layout.jsx       # Protected pages layout (sidebar)
│   ├── LowStockAlert.jsx
│   ├── ModelSelector.jsx
│   ├── Navbar.jsx
│   ├── PublicLayout.jsx # Public pages layout
│   ├── RestockModal.jsx
│   ├── SaleModal.jsx
│   └── Sidebar.jsx
├── context/
│   └── AuthContext.jsx  # Supabase auth state
├── lib/
│   └── supabase.js      # Supabase client init
├── pages/
│   ├── public/
│   │   └── Availability.jsx  # Public stock check (/)
│   ├── Dashboard.jsx    # KPIs overview
│   ├── History.jsx      # Transaction history
│   ├── Inventory.jsx    # Stock management
│   ├── Login.jsx        # Auth page
│   ├── Reports.jsx      # Analytics
│   ├── Sales.jsx        # Record sales
│   └── Settings.jsx     # Models & flavors config
├── App.jsx              # Routes + ProtectedRoute
├── App.css
├── index.css            # Tailwind imports
└── main.jsx             # Entry point
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

### Key Columns

**models**
- `id` (UUID), `name`, `puffs`, `price`, `is_active`

**flavors**
- `id` (UUID), `model_id` (FK), `name`, `name_es`, `stock`, `min_stock`, `is_active`

**sales**
- `id` (UUID), `flavor_id` (FK), `quantity`, `price`, `total`, `sold_at`, `notes`

**restocks**
- `id` (UUID), `flavor_id` (FK), `quantity`, `cost`, `restocked_at`, `notes`

### Row Level Security

- **Public**: Can read active models and flavors (for availability page)
- **Authenticated**: Full access to all tables

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
| `/settings` | Settings | Yes |

---

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to GitHub Pages
npm run deploy

# Lint
npm run lint
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## UI Patterns

- **Language**: Spanish (Ventas, Inventario, Sabores, etc.)
- **Dark mode**: Supported via Tailwind (`dark:` classes)
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

## Notes

- Stock decrements automatically on sale
- Stock increments on restock
- Flavors belong to models (FK relationship)
- Soft delete via `is_active` flag (not actual DELETE)
