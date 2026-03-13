# Design Decisions | RetailSphere

This document outlines the UI/UX philosophy, architectural design patterns, and interaction models used in the RetailSphere frontend.

## 1. Component-Based Architecture (React)
**Decision**: Breaking the UI into independent, reusable functional components.
**Reasoning**: Pages like Sales and Stock Management share many UI primitives (tables, cards, modals). By standardizing these, we ensure a consistent "look and feel" across the entire enterprise application.

## 2. Centralized API Abstraction Layer
**Decision**: All networking logic is isolated within the `src/api/` directory.
**Reasoning**: Prevents "prop drilling" of API logic and makes the UI components strictly focus on rendering state. 
**Implementation**: Using an Axios instance with interceptors for automatic JWT attachment and 401 (Unauthorized) redirection.

## 3. Role-Based Navigation Guards (RBAC)
**Decision**: Dynamic UI rendering based on user roles (Admin, Manager, Staff).
**Reasoning**: In a retail environment, a Staff member should not be able to delete users or modify supplier contracts. 
**Implementation**: The `ProtectedRoute` and `Layout` components evaluate the user's role from the AuthContext to prune the sidebar and block unauthorized routes.

## 4. Proactive Analytics Visualization
**Decision**: Utilizing custom-built widgets on the Dashboard instead of a generic list.
**Reasoning**: ERP users need a "birds-eye view" of the business. 
**Features**:
- **Inventory Valuation**: High-visibility capital summary.
- **Urgent Expiry**: Color-coded warnings (Red/Amber) to prompt immediate stock clearance.
- **Top Customers**: Driven by sales aggregation logic to foster CRM growth.

## 5. Atomic Styling with TailwindCSS v4
**Decision**: Using the latest Tailwind version for high-performance, utility-first styling.
**Reasoning**: Rapid UI iteration without leaving the JSX file. v4's performance improvements ensure the dashboard feels snappy even with large datasets.

## 6. Self-Service Profile Persistence
**Decision**: Allowing users to manage their own credentials via a dedicated Profile page.
**Reasoning**: Reduces administrative overhead. 
**UX**: Password changes take effect immediately on the backend, and the frontend signals a reminder to sign in again to refresh the local session token.
