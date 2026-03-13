# Super Market ERP Frontend

React (TypeScript) frontend for the Super Market ERP backend. Built with Vite, React Router, and Tailwind CSS.

## Features

- **Auth**: Login with JWT; role-based access (Admin, Manager, Staff).
- **Dashboard**: Analytics overview, sales trend, top products, low stock.
- **Sales**: Point-of-sale (cart, customer, payment) and recent transactions list.
- **Products & Categories**: CRUD; products linked to categories.
- **Customers**: CRUD (required for sales).
- **Suppliers**: CRUD (procurement).
- **Stock Batches**: List view (create via backend/PO flow).
- **PO Details**: List purchase order details grouped by PO.
- **Users**: List and create users (Admin/Manager only).

## Setup

1. Ensure the [Super Market ERP Backend](../Super%20Market%20ERP%20Backend) is running on `http://localhost:3000`.
2. From this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:5173. Use your backend user credentials to sign in.

## Scripts

- `npm run dev` – Start dev server (proxies `/api` to backend).
- `npm run build` – Production build.
- `npm run preview` – Preview production build.

## Environment

API is proxied to the backend in development (see `vite.config.ts`). For a different API URL, configure the proxy or set `VITE_API_URL` and use it in `src/api/client.ts`.
