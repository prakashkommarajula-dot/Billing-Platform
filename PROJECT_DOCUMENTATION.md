# BillFlow – Complete Project Documentation
## Enterprise Invoice Generation & Business Billing Management Platform

---

### Executive Overview

- **Project Title:** BillFlow – Enterprise Invoice Generation & Business Billing Management Platform
- **Repository Remote:** [https://github.com/prakashkommarajula-dot/Billing-Platform.git](https://github.com/prakashkommarajula-dot/Billing-Platform.git)
- **Default Branch:** `main`
- **Architecture:** Full-Stack Decoupled Multi-Tier System (React 18 SPA + Node.js 20 Express REST API + MongoDB 6 Database)
- **Containerization:** Docker & Docker Compose with Nginx Reverse Proxy
- **Orchestration:** Kubernetes (K8s) with Pods, Deployments, ClusterIP/NodePort Services, ConfigMaps, Secrets, and Persistent Volumes
- **Deployment Status:** 100% Operational across Local Development, Docker Containers, and Kubernetes Cluster

---

## 1. Project Objectives & Problem Statement

Modern micro, small, and medium enterprises (MSMEs) as well as growing corporate entities frequently struggle with fragmented invoicing tools, manual tax calculation errors, delayed receivable collections, and lack of client self-service. 

**BillFlow** solves these challenges through an integrated, enterprise-grade cloud billing platform designed with the following core objectives:
1. **Automated Tax Invoicing:** Real-time multi-tier Goods and Services Tax (GST) computation (CGST, SGST, IGST) with support for HSN/SAC classification, item discounts, and dynamic currency formatting.
2. **End-to-End Receivable Lifecycle:** Seamless progression from Customer CRM -> Quotation/Invoice -> Partial/Full Payment Settlements -> Payment Receipts -> Credit Note Adjustments.
3. **Audited Financial Ledger:** Real-time customer transaction ledgers with running balances, opening balances, debits, credits, and closing balances.
4. **Client Self-Service Portal:** Restricted, customer-authenticated portal allowing clients to view their invoices, check outstanding balances, and download statements without accessing administrative controls.
5. **Role-Based Access Control (RBAC):** Strict authorization separation across four operational roles: `Admin`, `Business Owner`, `Accountant`, and `Customer`.
6. **Cloud-Native Containerization & Orchestration:** Production-ready Docker containerization and Kubernetes cluster deployment with zero-downtime rolling updates and self-healing health probes.

---

## 2. System Architecture

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 18 Single Page Application (SPA) | Vite 6 Build Engine | Modern Blue CSS3  |
+-----------------------------------------+-----------------------------------------+
                                          |
                        HTTP / Reverse Proxy (:80 / :30080)
                                          v
+-----------------------------------------------------------------------------------+
|                            REVERSE PROXY & GATEWAY                                |
|  Nginx 1.31 Alpine | Client Routing (try_files) | Gzip Compression | API Routing  |
+-----------------------------------------+-----------------------------------------+
                                          |
                              Proxy Pass to /api/* (:5000)
                                          v
+-----------------------------------------------------------------------------------+
|                                APPLICATION TIER                                   |
|  Node.js 20 LTS | Express 4 RESTful API Engine | JWT Bearer Authentication        |
|  Role-Based Access Control (RBAC) | PDFKit Server-Side Engine | Mongoose 8 ODM    |
+-----------------------------------------+-----------------------------------------+
                                          |
                          Mongoose Connection (:27017)
                                          v
+-----------------------------------------------------------------------------------+
|                                   DATA TIER                                       |
|  MongoDB 6 Jammy Database | Named Persistent Volume (ReadWriteOnce PVC)          |
|  Collections: Users, Customers, Products, Invoices, Payments, CreditNotes,        |
|               BusinessSettings                                                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

### Frontend Technologies
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^18.3.1` | Component-driven declarative user interface |
| **Build Tool** | Vite | `^6.0.5` | Next-generation fast frontend bundler & dev server |
| **Routing** | React Router DOM | `^6.28.0` | Client-side SPA navigation & protected route guards |
| **Icons** | Lucide React | `^0.468.0` | Enterprise vector icon system |
| **Data Visualization**| Recharts | `^2.15.0` | Interactive revenue trend and sales area/bar charts |
| **Styling** | Vanilla CSS3 | Custom | Design system using CSS variables, flexbox, and responsive grid |

### Backend Technologies
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `20 LTS (Alpine)` | High-throughput asynchronous JavaScript runtime |
| **Web Framework** | Express | `^4.21.2` | REST API routing and middleware pipeline |
| **Database ODM** | Mongoose | `^8.9.5` | Schema validation, modeling, and MongoDB interaction |
| **Authentication** | JSON Web Tokens | `^9.0.2` | Stateless cryptographic token-based session handling |
| **Password Security**| bcryptjs | `^3.0.2` | Salted SHA-512 password hashing |
| **Document Export** | PDFKit | `^0.20.2` | Server-side vector tax invoice and credit note PDF generation |
| **Logging & CORS** | Morgan / CORS | Standard | HTTP request auditing and cross-origin resource sharing |

### Database & Storage
| Component | Technology | Details |
| :--- | :--- | :--- |
| **Database Engine** | MongoDB | `6.0 Jammy` standard enterprise document store |
| **Persistent Volume**| Kubernetes PVC | 1Gi ReadWriteOnce standard storage class |
| **Container Volume** | Docker Volume | Named volume `billflow_mongodb_data` |

### DevOps, Containerization & Orchestration
| Component | Technology | Details |
| :--- | :--- | :--- |
| **Container Engine** | Docker Engine | Version `29.9.2` |
| **Multi-Container** | Docker Compose | Version `v2.40.4` |
| **Web Server** | Nginx | `1.31 Alpine` serving SPA + reverse proxying `/api/` |
| **Orchestrator** | Kubernetes | Version `v1.31.2` control-plane via `kind` |
| **Manifest Tool** | Kustomize | Single command cluster declaration (`kubectl apply -k k8s/`) |

---

## 4. Module Implementation Details (Pages 1 to 15)

### Page 1 – Secure Authentication & 1-Click Role Switcher
- **Route:** `/login`
- **Features:** Email and password credentials verification, salted bcrypt validation, JWT session token generation, remember-me persistence.
- **Demo Presets:** 1-Click instant switch buttons for **Business Owner**, **Accountant**, **Admin**, and **Customer** roles.

### Page 2 – Business Registration
- **Route:** `/register`
- **Features:** Comprehensive onboarding form with fields for Full Name, Business/Company Name, Email, Phone, Physical Business Address, State, Postal Code, and GSTIN.
- **Validation:** Automatic duplicate email prevention, role restrictions, and sanitized input validation.

### Page 3 – Executive Financial Dashboard
- **Route:** `/dashboard`
- **Features:** Real-time KPI summary cards (Total Revenue, Outstanding Receivables, Paid Invoices, Overdue Invoices), Recharts Monthly Revenue Trends, Recent Invoices Table, Quick Action shortcuts.

### Page 4 – Customer Relationship Management (CRM)
- **Route:** `/customers`
- **Features:** Customer directory displaying Customer ID, Company Name, Contact Person, Email, Phone, City, State, GSTIN, and Outstanding Balance. Filter by status, search by name/email/ID, and modal for adding new customers.

### Page 5 – Customer Profile & Financial Ledger
- **Route:** `/customers/:id` or `/customers/details`
- **Features:** Complete 360-degree client dossier with billing address, GSTIN, payment terms, and real-time chronological ledger table (Opening Balance, Invoices, Payments, Credit Notes, Running Balance).

### Page 6 – Products & Services Catalog
- **Route:** `/products`
- **Features:** Product catalog management with SKU/Product Code, Description, Category (Goods vs Services), Unit of Measure, Unit Price, HSN/SAC Code, and GST Slab selection (0%, 5%, 12%, 18%, 28%).

### Page 7 – Dynamic Tax Invoice Generator
- **Route:** `/invoices/create`
- **Features:** Multi-item dynamic invoice creation with auto-incremented invoice numbers (`INV-YYYY-XXXX`), customer dropdown, invoice & due dates, line items with automatic GST breakdown (CGST/SGST for intra-state, IGST for inter-state), discount, and terms & conditions.

### Page 8 – Invoice Details & PDF Generation
- **Route:** `/invoices/:id` or `/invoices/details`
- **Features:** Printable tax invoice view with status badge (`Draft`, `Sent`, `Paid`, `Partially Paid`, `Overdue`), items table, tax summary, payment timeline, and server-side PDFKit vector PDF download.

### Page 9 – Payment Collections & Reconciliation
- **Route:** `/payments`
- **Features:** Record settlements against outstanding invoices with Payment Reference ID, Payment Date, Amount, Payment Method (`Bank Transfer`, `UPI`, `Credit Card`, `Cheque`, `Cash`), and transaction receipts. Automatic invoice balance recalculation.

### Page 10 – Credit Notes Management
- **Route:** `/credit-notes`
- **Features:** Issue credit notes linked to original invoices for returns, pricing adjustments, or billing corrections. Validation prevents credit note values from exceeding invoice balance. Generates downloadable credit note PDFs.

### Page 11 – Reports & Analytics
- **Route:** `/reports`
- **Features:** 4 dedicated reporting tabs:
  1. *Sales Invoice Report:* Total sales, paid amounts, invoice status breakdown.
  2. *Outstanding Receivables:* Aging report with days overdue, pending balance, and customer risk analysis.
  3. *Tax Summary Report:* Taxable turnover, CGST, SGST, IGST totals with date filtering.
  4. *Customer Ledger:* Complete transactional statement with running balances.
- **Export Options:** Downloadable CSV spreadsheets and print-ready PDF reports.

### Page 12 – Dedicated Client Self-Service Portal
- **Route:** `/portal`
- **Features:** Restricted view for client accounts displaying total invoices, paid amounts, outstanding balances, invoice history, payment records, and account statement PDF downloads without administrative exposure.

### Page 13 – User Management & RBAC
- **Route:** `/users`
- **Features:** Administrator console for user accounts, role assignment (`Admin`, `Business Owner`, `Accountant`, `Customer`), status toggling (Active vs Suspended), and secure password reset.

### Page 14 – Business Settings & Legal Compliance
- **Route:** `/settings`
- **Features:** Configure enterprise branding, business logo, registered address, GSTIN, default tax rate, invoice numbering prefix, default payment terms, and custom legal notes.

### Page 15 – User Profile & Account Security
- **Route:** `/profile`
- **Features:** Personal profile information, profile picture update, change password with current password verification, and session logout.

---

## 5. Execution Instructions

### Local Development Setup
```bash
# 1. Install dependencies for all tiers
npm run install:all

# 2. Start Backend API Server (Port 5000)
npm run dev:backend

# 3. Start Frontend Development Server (Port 5173)
npm run dev:frontend
```

### Docker Compose Multi-Container Execution
```bash
# Build and run containers in detached mode
docker compose up -d --build

# Inspect running containers
docker compose ps

# View live container logs
docker compose logs -f

# Stop containers
docker compose down
```
- Frontend: `http://localhost:80` (or `http://localhost:5173` / `http://localhost:3000`)
- Backend API: `http://localhost:5000/api/health`

### Kubernetes (K8s) Cluster Execution
```bash
# Apply all manifests via Kustomize
kubectl apply -k k8s/

# Verify cluster resources
kubectl get all,pvc -n billflow

# View backend logs
kubectl logs -l app=backend -n billflow -f

# Tear down deployment
kubectl delete -k k8s/
```
- Frontend Web: `http://localhost:30080`
- Backend API Direct: `http://localhost:30500/api/health`
- Reverse Proxied API: `http://localhost:30080/api/health`

---

## 6. Demo Accounts & Credentials

| Role | Email | Password | Target View |
| :--- | :--- | :--- | :--- |
| **Business Owner** | `owner@apexenterprises.com` | `Password123!` | Executive Dashboard (`/dashboard`) |
| **Customer** | `customer@globaltech.com` | `Password123!` | Customer Portal (`/portal`) |
| **Admin** | `admin@platform.com` | `Password123!` | User Management (`/users`) |
| **Accountant** | `accountant@apexenterprises.com` | `Password123!` | Reports & Payments (`/reports`) |
