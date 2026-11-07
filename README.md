# BillFlow – Enterprise Invoice Generation & Business Billing Management Platform

A production-grade, full-stack business billing, accounting, and invoice management web platform.

---

## 📁 Repository Architecture: Frontend & Backend Separation

This repository is structured cleanly into two dedicated directories:

```
invoice-billing-platform/
├── backend/                             # All Backend APIs, Database Models, and Business Logic
│   ├── config/
│   │   └── db.js                        # MongoDB Mongoose local connection
│   ├── controllers/                     # REST API Controller Handlers
│   │   ├── authController.js            # Login, registration, JWT authentication
│   │   ├── customerController.js        # Customer CRM, profile & ledger balance
│   │   ├── productController.js         # Products & services catalog with GST rates
│   │   ├── invoiceController.js         # Invoice creation, calculation & PDFKit export
│   │   ├── paymentController.js         # Payment settlements & receipt slips
│   │   ├── creditNoteController.js      # Credit adjustments & invoice reconciliation
│   │   ├── reportController.js          # Sales, receivables, tax summary & ledger reports
│   │   ├── portalController.js          # Dedicated client self-service portal APIs
│   │   ├── userController.js            # Administrative staff & role management
│   │   ├── settingsController.js        # Business profile, legal details & invoice defaults
│   │   └── profileController.js         # User personal profile & password management
│   ├── middleware/
│   │   ├── authMiddleware.js            # JWT protection & Role-Based Access Control (RBAC)
│   │   └── errorMiddleware.js           # Global error handling middleware
│   ├── models/                          # Mongoose Database Schemas
│   │   ├── User.js                      # User credentials with bcryptjs hashing
│   │   ├── Customer.js                  # Customer CRM records & billing addresses
│   │   ├── Product.js                   # Product catalog with HSN/SAC codes & GST slabs
│   │   ├── Invoice.js                   # Tax invoices with CGST/SGST/IGST breakdown
│   │   ├── Payment.js                   # Payment settlements & transaction references
│   │   ├── CreditNote.js                # Credit notes linked to invoices
│   │   └── BusinessSettings.js          # Enterprise profile, logo, and bank details
│   ├── routes/                          # Express REST API Route Definitions
│   │   ├── authRoutes.js                # /api/auth/*
│   │   ├── customerRoutes.js            # /api/customers/*
│   │   ├── productRoutes.js             # /api/products/*
│   │   ├── invoiceRoutes.js             # /api/invoices/*
│   │   ├── paymentRoutes.js             # /api/payments/*
│   │   ├── creditNoteRoutes.js          # /api/credit-notes/*
│   │   ├── reportRoutes.js              # /api/reports/*
│   │   ├── portalRoutes.js              # /api/portal/*
│   │   ├── userRoutes.js                # /api/users/*
│   │   ├── settingsRoutes.js            # /api/settings/*
│   │   ├── profileRoutes.js             # /api/profile/*
│   │   └── dashboardRoutes.js           # /api/dashboard/*
│   ├── utils/
│   │   └── pdfGenerator.js              # PDFKit server-side A4 tax invoice generator
│   ├── .env                             # Environment config
│   ├── .env.example
│   ├── package.json                     # Backend dependencies & scripts
│   └── server.js                        # Express HTTP application entry point
│
├── frontend/                            # All Frontend React UI, Components & Styling
│   ├── public/                          # Static web assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                  # Reusable UI Design System (Button, Card, Input, Badge, Alert)
│   │   │   │   ├── Alert.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   └── common.css
│   │   │   └── layout/                  # Fixed Left Sidebar, Top Navbar, ProtectedRoute
│   │   │       ├── AppLayout.jsx
│   │   │       ├── Navbar.jsx
│   │   │       ├── ProtectedRoute.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # User authentication state & role checks
│   │   ├── pages/                       # Complete Application Page Modules
│   │   │   ├── Auth/                    # Page 1: Login & Page 2: Registration
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── auth.css
│   │   │   ├── Dashboard/               # Page 3: Business Dashboard (Recharts)
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── dashboard.css
│   │   │   ├── Customers/               # Page 4: Customer Directory & Customer Details
│   │   │   │   ├── CustomerList.jsx
│   │   │   │   ├── CustomerDetails.jsx
│   │   │   │   ├── customers.css
│   │   │   │   └── customer-details.css
│   │   │   ├── Products/                # Page 5: Products & Services Management
│   │   │   │   ├── ProductList.jsx
│   │   │   │   └── products.css
│   │   │   ├── Invoices/                # Page 6: Invoice Register, Page 7: Create Invoice, Page 8: Details & PDF
│   │   │   │   ├── InvoiceList.jsx
│   │   │   │   ├── CreateInvoice.jsx
│   │   │   │   ├── InvoiceDetails.jsx
│   │   │   │   ├── invoices.css
│   │   │   │   ├── create-invoice.css
│   │   │   │   └── invoice-details.css
│   │   │   ├── Payments/                # Page 9: Payment Management & Receipts
│   │   │   │   ├── PaymentList.jsx
│   │   │   │   └── payments.css
│   │   │   ├── CreditNotes/             # Page 10: Credit Notes Management
│   │   │   │   ├── CreditNoteList.jsx
│   │   │   │   └── credit-notes.css
│   │   │   ├── Reports/                 # Page 11: Reports & Analytics (4 Tabs + CSV/PDF)
│   │   │   │   ├── Reports.jsx
│   │   │   │   └── reports.css
│   │   │   ├── Portal/                  # Page 12: Customer Billing Portal
│   │   │   │   ├── CustomerPortal.jsx
│   │   │   │   └── portal.css
│   │   │   ├── Users/                   # Page 13: Staff & User Management
│   │   │   │   ├── UserList.jsx
│   │   │   │   └── users.css
│   │   │   ├── Settings/                # Page 14: Business Settings & Invoicing Preferences
│   │   │   │   ├── BusinessSettings.jsx
│   │   │   │   └── settings.css
│   │   │   └── Profile/                 # Page 15: User Profile & Security
│   │   │       ├── UserProfile.jsx
│   │   │       └── profile.css
│   │   ├── services/
│   │   │   └── api.js                   # Unified Fetch API Client with Bearer Token interceptor
│   │   ├── styles/
│   │   │   ├── index.css                # Global styles reset
│   │   │   ├── layout.css               # Fixed dark-navy sidebar & navbar responsive layout
│   │   │   └── variables.css            # SaaS color design tokens
│   │   ├── App.jsx                      # React Router DOM (v6) route registry
│   │   └── main.jsx                     # Vite React entry point
│   ├── index.html                       # HTML5 entry with Inter font
│   ├── vite.config.js                   # Vite dev server with /api proxy to port 5000
│   └── package.json                     # Frontend dependencies & scripts
│
├── .gitignore                           # Git ignore rules for node_modules, dist, .env
├── package.json                         # Root orchestration scripts
└── README.md
```

---

## 🚀 Running the Application

### Option A: Run Both Together from Project Root
```bash
# 1. Install dependencies
npm run install:all

# 2. Start Backend API Server (Port 5000)
npm run dev:backend

# 3. Start Frontend Development Server (Port 5173)
npm run dev:frontend
```

### Option B: Run Individually

**Backend (`backend/`):**
```bash
cd backend
npm install
npm run dev
# Running at http://localhost:5000
```

**Frontend (`frontend/`):**
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173
```

---

## 🔑 Pre-Configured Demo Credentials

The login screen provides **1-Click Preset Buttons** for instant evaluation across all roles:

| Role | Email | Password | Default View |
| :--- | :--- | :--- | :--- |
| **Business Owner** | `owner@apexenterprises.com` | `Password123!` | Business Dashboard (`/dashboard`) |
| **Customer** | `customer@globaltech.com` | `Password123!` | Customer Portal (`/portal`) |
| **Admin** | `admin@platform.com` | `Password123!` | User Management & Overview (`/dashboard`, `/users`) |
| **Accountant** | `accountant@apexenterprises.com` | `Password123!` | Reports, Payments & Invoices (`/reports`) |
