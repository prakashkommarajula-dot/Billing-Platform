# BillFlow – Multi-Business & Role-Based Demonstration Directory

This directory provides authorized test accounts and workspaces for demonstration and faculty evaluation.

---

## 🏢 1. Pre-Configured Multi-Business Workspaces

| Business Name | Workspace Code | Business Owner | Owner Email | Registered Tax ID | Workspace Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Apex Enterprises Pvt Ltd** | `APEX-2026` | Rajesh Sharma | `owner@apexenterprises.com` | `29ABCDE1234F1Z5` | IT & Consulting Services |
| **Global Tech Solutions** | `GLOBAL-2026` | David Miller | `david@globaltech.com` | `27AABCG1234H1Z8` | Enterprise Software & Cloud |
| **Sunrise Solutions** | `SUNRISE-2026` | Vikram Malhotra | `vikram@sunrisesolutions.com` | `36AABCS1234K1Z2` | Hardware, Retail & POS |

---

## 👥 2. Ready-to-Test Accounts Across All 4 Roles

All predefined accounts share the unified password: **`Password123!`**

| User Role | Full Name | Login Email | Landing Page | Workspace / Company | Key Features to Demonstrate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System Admin** | Platform Administrator | `admin@platform.com` | `/users` | Global Platform Governance | System-wide User Management, Account Deactivation/Activation, Secure Password Reset, Platform-wide KPI counters. |
| **Business Owner** | Rajesh Sharma | `owner@apexenterprises.com` | `/dashboard` | Apex Enterprises Pvt Ltd (`APEX-2026`) | Executive Dashboard, MoM Revenue Growth chart, Customer Directory & Ledgers, Product Catalog, Workspace Code sharing (`APEX-2026`), Team Accountant Delegation. |
| **Accountant** | Ananya Roy | `accountant@apexenterprises.com` | `/reports` | Apex Enterprises Pvt Ltd (`APEX-2026`) | Financial Reports & GST Returns (GSTR-1, GSTR-3B), UTF-8 CSV Statement Exports, Sequential Invoice Generation (`/invoices/create`), Credit Note Issuance. |
| **Customer** | Sarah Connor | `customer@globaltech.com` | `/portal` | Global Tech Solutions | Customer Self-Service Portal, Outstanding Balance inspection, Unpaid Invoice listing, **Pay Now Modal (UPI / Bank Transfer / Card)**, **Official Payment Receipt generator**. |

---

## 🆕 3. Testing New User Registration (Self-Service)

To test creating a new account:
1. Navigate to `/register`.
2. **Step 1: Role Selection**:
   - Choose **Business Owner**, **Accountant**, or **Customer**.
3. **Step 2: Role-Tailored Details**:
   - **Business Owner**: Enter Business Name, Address, GSTIN & credentials &rarr; auto-creates independent business workspace.
   - **Accountant**: Select target business dropdown or enter Workspace Invitation Code (e.g., `APEX-2026`) &rarr; delegates access to the selected business.
   - **Customer**: Select vendor business &rarr; links to customer account and opens `/portal`.

---

## 💳 4. Testing Customer Due Payments ("Pay Now" & Receipts)

1. Sign in as `customer@globaltech.com` (password: `Password123!`).
2. Redirected to `/portal` (Customer Portal).
3. Under **My Invoices** or **Recent Invoices**, locate an invoice with an outstanding balance.
4. Click **Pay Now**:
   - Enter payment amount (full balance or partial down to ₹1.00).
   - Select payment mode (UPI, Bank Transfer, Card, Cash).
   - Click **Auto-Gen UTR** to populate reference code.
   - Click **Confirm & Pay**.
5. The **Official Payment Receipt** modal immediately appears with receipt number (`RCPT-2026-XXXX`), settled status, and one-click printable slip.
6. The customer ledger balance and invoice status (`Paid` or `Partially Paid`) update in real time!
