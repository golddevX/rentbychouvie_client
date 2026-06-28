# Rental Fashion Client

Customer-facing website for rental fashion business. Written in Next.js with TypeScript and Tailwind CSS.

## 🎯 Key Pages

- **Home (`/`)** - Landing page
- **Products (`/products`)** - Catalog with filtering
- **Product Detail (`/products/:id`)** - Single product with preview & dates
- **Checkout (`/checkout`)** - Tạo Booking trực tiếp vào PostgreSQL dùng chung với Admin
- **Create Lead (`/leads/create`)** - Luồng lead cũ, vẫn giữ để tương thích
- **Track Lead (`/leads/track/:id`)** - Optional lead tracking

## 🏗️ Architecture

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/
│   ├── api.ts          # API methods
│   └── api-client.ts   # Axios instance
├── store/
│   └── cart.store.ts   # Zustand cart store
├── hooks/
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
├── types/              # TypeScript types
└── styles/
    └── globals.css     # Tailwind styles
```

## 🚀 Quick Start

```bash
cd client

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Start dev server (port 3000)
npm run dev

# Build for production
npm build
npm start
```

## 📦 Features

- ✅ Product catalog & search
- ✅ Product detail with AI preview (integration-ready)
- ✅ Lead creation form
- ✅ Direct rental booking with Admin-compatible pricing, voucher, deposit and status
- ✅ Shopping cart (Zustand)
- ✅ Form validation (zod + react-hook-form)
- ✅ Responsive design (Tailwind CSS)
- ✅ TypeScript support

## 🔌 API Integration

All API calls go to backend at `NEXT_PUBLIC_API_URL`:

```typescript
// Products
GET /api/products
GET /api/products/:id
GET /api/products?category=dresses&search=summer

// Leads (public - no auth)
POST /api/leads
GET  /api/leads/:id

// Direct bookings (public Next.js route handler)
POST /api/public/bookings
```

## 🛠️ Development

### Add a new page

```tsx
// src/app/new-page/page.tsx
'use client';
import React from 'react';

export default function NewPage() {
  return <main>New Page</main>;
}
```

### Make API calls

```typescript
import { productsApi } from '@/lib/api';

const response = await productsApi.getAll();
```

### Use cart store

```typescript
import { useCartStore } from '@/store/cart.store';

const { items, addItem, removeItem } = useCartStore();
```

## 🌐 Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy

## 📝 Environment Variables

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_AI_ENABLED=false
NEXT_PUBLIC_AI_API_KEY=
```

## 📜 License

MIT
