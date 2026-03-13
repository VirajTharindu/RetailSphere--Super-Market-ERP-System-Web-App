# Engineering Decisions | RetailSphere

This document provides a deep dive into the engineering principles, architectural trade-offs, and technical choices that power the RetailSphere ERP system.

## 1. Fullstack TypeScript Conversion
**Decision**: Complete migration from a JavaScript codebase to a strictly typed TypeScript environment.
**Reasoning**: Retail systems handle complex relational data (Invoices, Batches, Stock levels). Even minor type mismatches can lead to catastrophic inventory discrepancies. TypeScript provides a compile-time safety net that ensures data integrity from the MySQL layer all the way to the React UI.
**Outcome**: Achieved zero-error compilation with `tsc --noEmit`.

## 2. Layered Controller-Service-Model (CSM) Architecture
**Decision**: Implementation of a strict separation of concerns on the backend.
**Reasoning**: 
- **Models**: Act as the Single Source of Truth for the database schema using Sequelize.
- **Services**: Encapsulate the "Business Logic" (e.g., calculating profit, generating invoice numbers, algorithmic reorder logic).
- **Controllers**: Handle the Express request/response lifecycle, parsing inputs and mapping service outputs to HTTP statuses.
**Impact**: High testability and maintainability. Changing the database schema only requires touching the Model layer, while API endpoint changes are isolated to Controllers.

## 3. Runtime Validation with Zod
**Decision**: Every external input (Query params, Body payloads) is validated via Zod schemas before reaching the service layer.
**Reasoning**: TypeScript types disappear at runtime. Zod ensures that the data actually arriving at the server matches the expected structure, preventing injection attacks and malformed data from corrupting the database.

## 4. Stateless Authentication (JWT & Augmented Request)
**Decision**: Using JSON Web Tokens for authentication and augmenting the Express `Request` type to include a strictly typed `user` object.
**Reasoning**: Statelessness allows for horizontal scaling. By augmenting the `Request` type, we eliminate the need for casting or "any" types when accessing `req.user` in controllers, ensuring we always know the user's ID, role, and username.

## 5. Algorithmic Inventory Management
**Decision**: Implementing server-side logic for "Expiry Forecasts" and "Manual Reorder Checks" using Sequelize's raw query capabilities where necessary.
**Reasoning**: ERP systems should be proactive. Instead of just listing batches, the system calculates which products are falling below their custom `ReorderLevel` by summing current `QuantityOnHand` across all active batches.

## 6. ES Modules (ESM) & `tsx`
**Decision**: Adopting native ES Modules and using `tsx` for execution.
**Reasoning**: ESM is the future of the Node.js ecosystem. `tsx` allows us to run TypeScript files directly with high performance, avoiding the slow compilation step of `ts-node` or manual `tsc` builds during development.
