<p align="center">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" alt="Sequelize" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-Web%20App-004D40?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/License-Private%20%26%20Portfolio-E11D48?style=for-the-badge&logo=security&logoColor=white" alt="License" />
</p>

# 🧩 RetailSphere

> **Seamlessly Unifying Retail, Inventory, and Intelligence.**

RetailSphere is a **Full-stack ERP Web Application** designed to **streamline retail operations with automated inventory tracking, real-time sales processing, and proactive business analytics**.

The system focuses on **architectural type-safety and data-driven visibility** and aims to **provide retailers with actionable insights and zero-leakage stock management**.

---

# ✨ Key Features

| Feature | Description |
|---|---|
| **Intelligent Dashboard** | Real-time overview of Sales Trends, Top Products, Low Stock alerts, and Inventory Valuation. |
| **Point-of-Sale (PoS)** | Rapid transaction processing with customer linking, dynamic cart management, and payment logging. |
| **Proactive Inventory** | Advanced batch tracking, automated expiry forecasting (30-day alerts), and manual reorder triggers. |
| **Role-Based Security** | Hierarchical access control (Admin, Manager, Staff) enforced at both API and UI levels. |
| **CRM Integration** | Integrated customer spending analysis to identify and rank top-tier clients. |
| **Procurement Suite** | Full lifecycle tracking from Supplier management to detailed Purchase Order (PO) histories. |

---

# 🎬 Project Demonstration

The following resources demonstrate the system's behavior:

- [📹 Product Video](#-product-video)
- [📸 Screenshots of Key Features](#-screenshots)
- [⚙️ Architecture Overview](docs/system_architecture.md)
- [🧠 Engineering Lessons](#-engineering-lessons)
- [🔧 Design Decisions](#-key-design-decisions)
- [🗺️ Roadmap](#️-roadmap)
- [🚀 Future Improvements](#-future-improvements)
- [📄 Documentation](#-documentations)
- [📝 License](#-license)
- [📩 Contact](#-contact)

If deeper technical access is required, it can be provided upon request.

---

# 📹 Product Video

> **[DEMONSTRATION PENDING]**

*A comprehensive video or GIF of the system's walkthrough demonstrating the Architecture, engines, and core workflows is available soon!*

---

# 📸 Screenshots (Role-Based)

The following gallery showcases the RetailSphere interface, categorized by system roles and sequentially ordered to demonstrate the operational workflow.

### 🛡️ Administrator View
*Managing the core retail infrastructure, users, and procurement.*

| 01 - Dashboard Overview | 02 - Sales & Point of Sale |
|:---:|:---:|
| ![Dashboard](docs/screenshots/01%20-%20Admin%20-%20Dashboard.png) | ![Sales](docs/screenshots/02%20-%20Admin%20-%20Sales%20&%20Point%20of%20Sale.png) |

| 03 - Category Management | 04 - Product Management |
|:---:|:---:|
| ![Categories](docs/screenshots/03%20-%20Admin%20-%20Category%20Management.png) | ![Products](docs/screenshots/04%20-%20Admin%20-%20Product%20Management.png) |

| 05 - Customer Management | 06 - Supplier Management |
|:---:|:---:|
| ![Customers](docs/screenshots/05%20-%20Admin%20-%20Customer%20Management.png) | ![Suppliers](docs/screenshots/06%20-%20Admin%20-%20Supplier%20Management.png) |

| 07 - Stock & Batch Management | 08 - Purchase Order Tracking |
|:---:|:---:|
| ![Stock](docs/screenshots/07%20-%20Admin%20-%20Stock%20&%20Batch%20Management.png) | ![PO Details](docs/screenshots/08%20-%20Admin%20-%20Purchase%20Order%20Tracking.png) |

| 09 - User Control Panel | 10 - Profile Settings |
|:---:|:---:|
| ![Users](docs/screenshots/09%20-%20Admin%20-%20User%20Control%20Panel.png) | ![Profile](docs/screenshots/10%20-%20Admin%20-%20Profile%20Settings.png) |

---

---

# ⚙️ Architecture Overview

RetailSphere is built on a **Decoupled, Monorepo, Modular,(CSM) Layered Client-Server Architecture** designed for high throughput and stateless scalability.

### 🏛️ Structural Layers
- **Frontend**: A **React 18 SPA** powered by Vite, utilizing high-performance Axios interceptors for automated security handshakes.
- **Backend Layer**: A **Node.js/Express** environment strictly written in **TypeScript**, following a clean **Layered CSM (Controller-Service-Model)** pattern.
- **Persistence Layer**: Primary support for **MySQL 8.0** with a seamless **SQLite fallback** for local zero-config development, managed via the **Sequelize ORM**.

### 🛡️ Security & Authentication
The system implements **Stateless JWT Authentication**. RBAC (Role-Based Access Control) is strictly enforced via server-side middleware and dynamically Pruned UI components in the React layer.

[For full architectural diagrams and data-flow examples, see [Detailed System Architecture](docs/system_architecture.md)]

---

# 🧠 Engineering Lessons

Developing RetailSphere involved solving critical challenges in retail data integrity and system scalability:

- **Strict Type-Safety Migration**: Refactoring to TypeScript ensured that inventory batches and sales objects are structurally validated from the DB schema to the UI.
- **Business Logic Decoupling**: Transitioned to a **Service-Oriented** backend. Heavy logic—like reorder calculations and inventory FIFO—is isolated from API controllers for maximum testability.
- **Runtime Shielding**: Integrated **Zod** to validate every incoming request payload, preventing malformed data from ever reaching the persistence layer.
- **Stateless RBAC**: Implemented a scalable Auth guard that injects strictly-typed user identities into every internal request.

[See [Engineering Decisions Record](docs/engineering_decisions.md) for deeper technical trade-offs]

---

# 🔧 Key Design Decisions

1. **Strategic Branding (RetailSphere)**: Moved beyond generic "ERP" systems to a cohesive product brand, centering the user experience on a reliable, unified identity.
2. **"Push-Model" Analytics**: Designed the Dashboard on the philosophy that users should be *pushed* critical alerts (Low stock, Expiry) rather than having to *pull* manual reports.
3. **Atomic UI Consistency**: Leveraged **TailwindCSS v4** and a component-driven strategy to ensure that management tools and sales views share a high-performance design language.
4. **API Wrapper Abstraction**: Encapsulated all networking logic in dedicated wrappers to keep components lightweight and strictly focused on view state.

[Explore the [Design Decisions Log](docs/design_decisions.md) for UI/UX philosophy]

---

# 🗺️ Roadmap

Key upcoming features planned for RetailSphere:

- ✅ **DONE** Fullstack TypeScript Migration — Complete rewrite of backend/frontend for type safety.
- ✅ **DONE** Proactive Analytics Suite — Implementation of Inventory Valuation and Expiry forecasting.
- ✅ **DONE** ERP System Architecture — Implementation of ERP System Architecture.
- [/] **IN PROGRESS** Documentation Overhaul — Professionalizing README and architectural decision records.
- [ ] **NOT STARTED** Multi-store(branch) Support — Multi-store synchronization simulation.
- [ ] **NOT STARTED** Thermal Printing — Native driver support for thermal barcode and receipt printers.

---

# 🚀 Future Improvements

Planned enhancements include:

- **Mobile Companion App**: Barcode scanning and stock-taking via mobile devices.
- **Global Search**: "Spotlight-style" command palette for rapid navigation.
- **Dark Mode Support**: Aesthetic dark-themed UI for low-light environments.

---

## 📄 Documentations

Additional documentation is available in the `docs/` folder:

| File | Description |
|---|---|
| [**Engineering Decisions**](docs/engineering_decisions.md) | Technical trade-offs, TS migration, and CSM Patterns. |
| [**Design Decisions**](docs/design_decisions.md) | UI/UX philosophy, branding, and widget architectures. |
| [**Detailed Architecture**](docs/system_architecture.md) | Deep-dive into technical stack, data flow, and RBAC patterns. |

---

# 📝 License

This repository is published for **portfolio and educational review purposes**. 

The source code may not be accessed, copied, modified, distributed, or used without explicit permission from the author.

For detailed terms regarding use, reproduction, and distribution, please refer to the full [**PROPRIETARY LICENSE**](LICENSE).

© 2026 Viraj Tharindu — All Rights Reserved.

---

# 📩 Contact

If you are reviewing this project as part of a hiring process or are interested in the technical approach behind it, feel free to reach out.

I would be happy to discuss the architecture, design decisions, or provide a private walkthrough of the project.

**Opportunities for collaboration or professional roles are always welcome.**

📧 Email: [virajtharindu1997@gmail.com](mailto:virajtharindu1997@gmail.com)  
💼 LinkedIn: [viraj-tharindu](https://www.linkedin.com/in/viraj-tharindu/)  
🌐 Portfolio: [vjstyles.com](https://vjstyles.com)  
🐙 GitHub: [VirajTharindu](https://github.com/VirajTharindu)  

---

<p align="center">
  <em>Built with precision for the future of retail. 🚀📦💎</em>
</p>
