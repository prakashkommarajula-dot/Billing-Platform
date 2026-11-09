# B.TECH PROJECT DOCUMENTATION REPORT

---

# BILLFLOW – INVOICE GENERATION AND BUSINESS BILLING MANAGEMENT PLATFORM

### A Full-Stack Cloud Accounting System with Containerized DevOps Pipeline

**Submitted in partial fulfillment of the requirements for the award of the degree of**  
**BACHELOR OF TECHNOLOGY (B.TECH)**  
**in**  
**COMPUTER SCIENCE AND ENGINEERING / INFORMATION TECHNOLOGY**  

---

**Submitted by:**  
**Prakash Kommarajula**  
*(Roll No: 2022-BTECH-CSE-089)*  

**Under the Guidance of:**  
**Internal Project Supervisor / Assistant Professor**  
Department of Computer Science & Engineering  
College of Engineering and Technology  

**Academic Year:** 2025 – 2026  

---

\newpage

## CERTIFICATE OF APPROVAL

This is to certify that the project entitled **"BillFlow – Invoice Generation and Business Billing Management Platform"** submitted by **Prakash Kommarajula** in partial fulfillment of the requirements for the award of the degree of **Bachelor of Technology in Computer Science & Engineering** is an authentic record of bonafide work carried out under our supervision and guidance during the academic year 2025–2026.

The results embodied in this report have been thoroughly verified and have not been submitted to any other University or Institution for the award of any degree or diploma.

\vspace{2cm}

**Internal Guide / Supervisor**  
Assistant Professor  
Department of Computer Science & Engineering  

**Head of the Department (HOD)**  
Professor & Head  
Department of Computer Science & Engineering  

**Principal / Dean of Engineering**  
College of Engineering and Technology  

**External Examiner Signature:** _______________________  
**Date:** _______________________  

---

\newpage

## DECLARATION

I, **Prakash Kommarajula**, hereby declare that the project report entitled **"BillFlow – Invoice Generation and Business Billing Management Platform"** submitted to the Department of Computer Science and Engineering is a record of independent, original work done by me under the supervision of my faculty advisors.

I further declare that this work has not been submitted previously in part or in full for the award of any degree, diploma, fellowship, or title to any other university or institution of higher learning. All technical contributions, source codes, libraries, and references used in this project have been duly cited and acknowledged.

\vspace{1.5cm}

**Prakash Kommarajula**  
Department of Computer Science & Engineering  
Place: Hyderabad / Bengaluru, India  
Date: 09 November 2026  

---

\newpage

## ACKNOWLEDGEMENT

The satisfaction and euphoria that accompany the successful completion of any task would be incomplete without expressing gratitude to the individuals who made it possible, whose guidance, encouragement, and technical insights served as the beacon of light during this endeavor.

First and foremost, I express my deepest sense of gratitude to our respected **Principal** and **Head of the Department of Computer Science & Engineering**, for providing the state-of-the-art computational infrastructure, laboratories, and academic atmosphere conducive to creative engineering.

I am profoundly indebted to my **Internal Project Guide**, whose vigilant supervision, technical criticisms, and continuous encouragement guided the architectural design of this full-stack and cloud-native DevOps implementation.

I also extend my heartfelt thanks to all the faculty members and technical staff of the department for their direct and indirect cooperation throughout my Bachelor of Technology tenure. Lastly, my deepest appreciation goes to my parents, family, and peers whose unyielding faith, patience, and moral support inspired me throughout the execution of this project.

**Prakash Kommarajula**  

---

\newpage

## ABSTRACT

In modern commerce, accurate financial recordkeeping, regulatory Goods and Services Tax (GST/VAT) compliance, and automated billing workflows represent mission-critical operational requirements for small-to-medium enterprises (SMEs) and corporate enterprises. Traditional billing workflows characterized by manual paper invoicing, disjointed spreadsheet formulas, and localized desktop accounting software suffer from severe vulnerabilities including data redundancy, human arithmetic errors, lack of multi-user role isolation, and complete absence of real-time multi-device accessibility.

To overcome these fundamental challenges, this project presents **BillFlow**, an enterprise-grade, cloud-native Full-Stack Invoice Generation and Business Billing Management Platform engineered using the modern **MERN architecture** (MongoDB, Express.js, React.js, Node.js) and reinforced with an automated **DevOps continuous delivery pipeline**.

BillFlow provides:
1. **Multi-Role Governance**: Tailored workspaces for *Administrators*, *Business Owners*, *Accountants*, and *Customers* with cryptographically enforced JSON Web Token (JWT) role-based access control (RBAC).
2. **Automated Financial Ledger Engine**: Real-time tax computation (Intra-state CGST+SGST vs. Inter-state IGST), discount allocations, credit notes, and running balance customer ledgers.
3. **Dynamic Vector PDF Generation**: High-performance, server-side dynamic PDF compilation via PDFKit, supporting branded letterheads, tax breakdowns, and automated download links.
4. **Cloud-Native Containerization & Orchestration**: Production multi-stage Docker packaging, Docker Compose local multi-container networking, Kubernetes declarative manifests (Deployments, ClusterIP/NodePort Services, ConfigMaps, Secrets, PVCs), and local KIND cluster validation.
5. **Continuous Cloud Deployment**: Live production infrastructure hosted on Render with automated GitHub webhook synchronization, zero-downtime rolling releases, and encrypted TLS communication backed by a globally replicated MongoDB Atlas NoSQL cluster.

Quantitative verification demonstrates sub-200ms API response latency, zero calculation variance across complex financial transactions, and reliable cloud uptime accessible at `https://billflow-billing-platform.onrender.com`.

---

\newpage

## TABLE OF CONTENTS

1. **Cover Page**
2. **Certificate of Approval**
3. **Declaration**
4. **Acknowledgement**
5. **Abstract**
6. **Table of Contents**
7. **Introduction**
   - 7.1 Evolution of Enterprise Billing Systems
   - 7.2 Motivation & Purpose
   - 7.3 Organization of the Report
8. **Problem Statement**
   - 8.1 Inadequacy of Paper and Spreadsheet Invoicing
   - 8.2 Operational Risks & Computational Bottlenecks
9. **Existing System**
   - 9.1 Overview of Legacy Desktop & Manual Systems
   - 9.2 Critical Drawbacks of Existing Solutions
10. **Proposed System**
    - 10.1 System Overview
    - 10.2 Key Innovations of BillFlow
11. **Project Objectives**
    - 11.1 Primary Technical Objectives
    - 11.2 Secondary DevOps & Operational Objectives
12. **Scope of the Project**
    - 12.1 Target Sectors
    - 12.2 Architectural Scope & Boundaries
13. **Functional Requirements**
    - 13.1 Authentication & Workspace Identity
    - 13.2 Customer Ledger Management
    - 13.3 Products & Inventory Catalog
    - 13.4 Invoice Creation & Lifecycle Tracking
    - 13.5 Payment Reconciliation & Credit Notes
    - 13.6 Analytical Financial Dashboards
14. **Non-Functional Requirements**
    - 14.1 Performance & Latency
    - 14.2 Security & Cryptography
    - 14.3 Reliability & Fault-Tolerant Resiliency
    - 14.4 Scalability & Portability
    - 14.5 Usability & Responsiveness
15. **Technology Stack**
    - 15.1 Frontend Technologies
    - 15.2 Backend Technologies
    - 15.3 Database Engine
    - 15.4 DevOps & Cloud Tooling
16. **System Architecture**
    - 16.1 Tiered Architectural Decomposition
    - 16.2 Full-Stack & DevOps Architecture (Figure 7)
17. **Database Design**
    - 17.1 Schema Architecture & Normalized References
    - 17.2 Detailed Entity Models
    - 17.3 Entity-Relationship Schema Diagram (Figure 7b)
18. **Frontend Implementation**
    - 18.1 Single-Page Application (SPA) Design
    - 18.2 State Management via React Context API
    - 18.3 Interactive Data Visualizations & Routing
19. **Backend Implementation**
    - 19.1 Express Server Bootstrapping & Middleware
    - 19.2 Controller Design Patterns
    - 19.3 Fail-Fast Resilient Connection Layer
20. **API Implementation**
    - 20.1 RESTful Endpoint Specification
    - 20.2 Complete API Reference Table
21. **Authentication and Authorization**
    - 21.1 JSON Web Token (JWT) Lifecycle
    - 21.2 Password Hashing with bcryptjs
    - 21.3 Role-Based Access Control (RBAC) Matrix
22. **Invoice Generation and PDF Implementation**
    - 22.1 Mathematical Tax Calculation Engine
    - 22.2 PDFKit Vector Streaming Engine
23. **Git and GitHub Implementation**
    - 23.1 Version Control Strategy
    - 23.2 Repository Layout & Main Branch Workflow (Figure 13)
24. **Docker Implementation**
    - 24.1 Containerization Rationale
    - 24.2 Backend Dockerfile Analysis
    - 24.3 Frontend Multi-Stage Build & Nginx Production Container
25. **Docker Compose Implementation**
    - 25.1 Multi-Container Topologies
    - 25.2 Services, Health Checks, Networks, and Volumes
26. **Kubernetes Implementation**
    - 26.1 Declarative Cloud-Native Orchestration
    - 26.2 Manifest Hierarchy & Resource Specifications
27. **KIND Cluster Configuration**
    - 27.1 Local Kubernetes in Docker
    - 27.2 Port Forwarding & Cluster Architecture
28. **Cloud Deployment Using Render**
    - 28.1 Infrastructure-as-Code with render.yaml
    - 28.2 Continuous Delivery Workflow & Live URL Proof (Figures 14, 15, 16)
29. **MongoDB Atlas Configuration**
    - 29.1 Cloud NoSQL Provisioning & Network Security
    - 29.2 Connection Pooling & Automatic Reconnect
30. **Application Execution Instructions**
    - 30.1 Local Development Environment Setup
    - 30.2 Docker Compose Execution Steps
    - 30.3 Kubernetes KIND Cluster Execution Steps
31. **Testing and Test Cases**
    - 31.1 Test Methodology
    - 31.2 Formal Test Verification Matrix
32. **Results and Screenshots**
    - 32.1 Production Application Interfaces (Figures 1 to 6)
    - 32.2 Terminal Execution Proofs (Figures 8 to 12)
33. **Advantages**
34. **Limitations**
35. **Future Enhancements**
36. **Conclusion**
37. **References**

---

\newpage

## CHAPTER 7: INTRODUCTION

### 7.1 Evolution of Enterprise Billing Systems
Commercial trade and enterprise billing have undergone revolutionary shifts over the past two decades. Historically, accounting departments depended on physical books of account, carbon-copy bill books, and localized desktop spreadsheets. With the introduction of computerized enterprise resource planning (ERP) packages in the early 2000s, businesses achieved higher calculation precision. However, legacy systems remained tethered to specific on-premise hardware machines, requiring local disk backups, manual software license updates, and specialized IT support.

The rapid rise of cloud computing, high-speed internet penetration, and microservice architectures created a demand for **cloud-native, multi-tenant billing solutions**. Modern enterprises operate with distributed teams: sales representatives on the field generate customer invoices; warehouse managers verify dispatched goods; accountants reconcile bank transfers; and corporate clients demand real-time online access to review outstanding ledgers and settle dues electronically.

### 7.2 Motivation & Purpose
The motivation for developing **BillFlow** stems from the operational challenges encountered by Indian and global micro, small, and medium enterprises (MSMEs). MSMEs frequently struggle with prohibitive licensing costs of legacy ERP packages (e.g., SAP, Oracle, Tally ERP), steep learning curves, lack of integrated online customer portals, and complicated infrastructure setup. 

The primary purpose of this B.Tech engineering project is twofold:
1. **Full-Stack Engineering Excellence**: Design, develop, and benchmark a complete modern billing management web application offering intuitive role-based dashboards, automated tax engines compliant with Indian GST (CGST/SGST/IGST), and dynamic vector PDF generation.
2. **DevOps Engineering Rigor**: Containerize the full-stack architecture using Docker, orchestrate deployments declaratively via Kubernetes and local KIND clusters, and execute continuous production cloud deployments on Render with zero-downtime git webhooks.

### 7.3 Organization of the Report
This documentation is systematically organized into 37 comprehensive chapters spanning theoretical foundations, architectural diagrams, mathematical tax computations, database entity-relationship models, continuous delivery workflows, terminal execution proofs, and formal test verification results.

---

\newpage

## CHAPTER 8: PROBLEM STATEMENT

Small and medium enterprises face severe operational bottlenecks when managing their accounts receivable, billing lifecycle, and customer communication:

1. **Error-Prone Manual Calculations**: Manual entry of item rates, quantity multipliers, tiered discounts, and dual-tax rates (Central GST + State GST or Integrated GST) frequently results in arithmetic errors, leading to audit penalties and tax compliance reconciliation mismatches.
2. **Lack of Multi-Role Security**: Spreadsheets lack granular access controls. A sales representative or external accountant using the same spreadsheet can view proprietary corporate profit margins, master account passwords, or administrator settings.
3. **Inability to Reconcile Partial Payments**: Invoices are rarely settled in a single payment. Customers often pay in milestones (advance, milestone 1, final balance). Tracking which specific invoice is partially settled, overdue, or backed by a credit note across manual ledgers requires extensive manual cross-checking.
4. **Disjointed Customer Communication**: Clients regularly request duplicate copies of past invoices and running ledger balance statements, requiring accounting personnel to manually re-export and email PDF files.
5. **Deployment & Operational Fragility**: On-premise applications suffer from single points of failure (hardware crash, unbacked local disks), while traditional web deployments suffer from configuration drift and environment incompatibilities between development, testing, and production.

---

\newpage

## CHAPTER 9: EXISTING SYSTEM

### 9.1 Overview of Legacy Desktop & Manual Systems
The existing landscape of SME billing generally relies on two paradigms:

```
[ Traditional Manual / Spreadsheet Billing ]
  • Excel / Google Sheets Templates
  • Manual Formula Inputs (=SUM, =VLOOKUP)
  • Local Desktop Storage (Single User)
  • Manual Emailing of PDFs

[ Legacy On-Premise Accounting Software ]
  • Tally.ERP 9 / Busy Accounting
  • Local Machine Installation & Proprietary Binary DB
  • Heavy Licensing Cost per Seat
  • Complex Keybindings & High Training Overhead
```

### 9.2 Critical Drawbacks of Existing Solutions
- **Single-Device Lockdown**: The software cannot be accessed securely from mobile devices or external branches without complex Virtual Private Network (VPN) tunnels.
- **Data Loss Vulnerabilities**: Local storage disks lack automated geo-replicated cloud backups, exposing financial records to ransomware, malware, and hardware failure.
- **Zero Real-Time Customer Transparency**: Customers have no self-service portal to verify their own invoices, outstanding dues, or transaction payment receipts.
- **Inflexible DevOps & Portability**: Upgrading legacy packages often corrupts proprietary data files, and there is no concept of containerized reproducible deployment.

---

\newpage

## CHAPTER 10: PROPOSED SYSTEM

### 10.1 System Overview
To resolve the limitations of existing approaches, **BillFlow** is engineered as a modern, unified, cloud-native billing management web application. BillFlow unifies billing, customer ledger accounting, product catalog management, and payment tracking into a single responsive web interface accessible securely from any browser worldwide.

```
       +-------------------------------------------------------+
       |               BillFlow Proposed System                |
       +-------------------------------------------------------+
            |                    |                    |
            v                    v                    v
  [ Multi-Role RBAC ]  [ Smart Tax Engine ]  [ DevOps Pipeline ]
  • System Admin       • Auto CGST/SGST/IGST • Multi-Stage Docker
  • Business Owner     • Running Ledgers     • K8s Orchestration
  • Staff Accountant   • Vector PDF Engine   • Render Auto-Deploy
  • Billed Customer    • Real-Time Metrics   • MongoDB Atlas Cloud
```

### 10.2 Key Innovations of BillFlow
- **Automated Dual-Tax Resolution**: Automatically determines whether a transaction is Intra-State (splitting tax into equal CGST and SGST shares) or Inter-State (applying IGST) based on customer state codes.
- **Automated Chronological Ledger**: Every issued invoice, settled payment, and promotional credit note automatically updates a chronological running balance for each customer.
- **Server-Side PDF Streaming**: Generates vector tax invoice PDFs on demand via PDFKit with professional typography, table grids, and verified calculation summaries.
- **Zero-Dependency Production Deployment**: Single unified Node.js production service hosting both Vite-compiled React static assets and REST API endpoints, eliminating CORS friction and multi-port complexity.

---

\newpage

## CHAPTER 11: PROJECT OBJECTIVES

### 11.1 Primary Technical Objectives
1. **Full-Stack MERN Implementation**: Build a secure, decoupled web application using React 18, Vite, Express.js, Node.js 20, and MongoDB Atlas.
2. **Cryptographic Multi-Tenant RBAC**: Implement JSON Web Token authentication with bcrypt password hashing (10 salt rounds) and role authorization middleware enforcing strict tenant isolation.
3. **Dynamic Ledger and Balance Reconciliation**: Program automated financial aggregation algorithms ensuring zero mathematical deviation between invoice balances and payment transactions.
4. **Server-Side Vector Document Generation**: Program high-speed server-side PDF generation streaming byte streams directly to HTTP clients.

### 11.2 Secondary DevOps & Operational Objectives
1. **Containerization via Docker**: Write optimized Dockerfiles for backend and frontend utilizing multi-stage builds and Alpine Linux base images to minimize image footprints (<150MB).
2. **Local Multi-Container Orchestration**: Write declarative `docker-compose.yml` establishing isolated container networks, health checks, and named persistent storage volumes.
3. **Kubernetes Deployment Manifests**: Write production-grade Kubernetes resource manifests including Deployments, ClusterIP Services, NodePort Services, ConfigMaps, Secrets, and PersistentVolumeClaims.
4. **Automated Cloud Continuous Delivery**: Deploy the live application to Render cloud infrastructure linked via automated GitHub webhooks for automated compilation and zero-downtime rollouts.

---

\newpage

## CHAPTER 12: SCOPE OF THE PROJECT

### 12.1 Target Sectors
- **Micro, Small, and Medium Enterprises (MSMEs)**: Retailers, distributors, IT consulting firms, marketing agencies, and logistics providers.
- **Freelance Professionals & Contractors**: Independent developers, creative designers, and legal consultants requiring branded GST invoices.
- **Accounting & Bookkeeping Firms**: External auditors handling multiple client ledgers under segregated access control.

### 12.2 Architectural Scope & Boundaries
- **In-Scope**: User authentication, RBAC, customer management, catalog management, invoice generation, payment reconciliation, credit notes, PDF generation, Dockerization, Kubernetes manifests, KIND cluster support, and Render cloud deployment.
- **Out-of-Scope (Future Work)**: Physical barcode thermal receipt printing, automated SMS gateways, and multi-currency international forex live conversion APIs.

---

\newpage

## CHAPTER 13: FUNCTIONAL REQUIREMENTS

| Module | Requirement Description | User Role |
| :--- | :--- | :--- |
| **FR-01: Authentication** | Secure sign-up, email validation, password hashing, and login with JWT issuance. | All Users |
| **FR-02: 1-Click Demo** | Instant pre-seeded credentials for Administrator, Business Owner, Accountant, Customer. | Testers / Evaluators |
| **FR-03: Dashboard** | Real-time calculation of total sales, total collected revenue, outstanding balances, and monthly charts. | Admin, Owner, Accountant |
| **FR-04: Customer Directory** | Create, search, filter, edit, and archive customer accounts with GSTIN and address verification. | Admin, Owner, Accountant |
| **FR-05: Customer Ledger** | Display chronological debit/credit transactions, running balances, and invoice settlement timelines. | Admin, Owner, Accountant |
| **FR-06: Product Catalog** | Maintain catalog of services and physical goods with HSN/SAC codes, base prices, and GST rates. | Admin, Owner, Accountant |
| **FR-07: Invoice Builder** | Dynamic line-item invoice creation with automatic subtotal, tax splitting, and balance calculation. | Admin, Owner, Accountant |
| **FR-08: Invoice Lifecycle** | State machine management: Draft -> Sent -> Pending -> Partially Paid -> Paid -> Overdue -> Cancelled. | Admin, Owner, Accountant |
| **FR-09: Vector PDF Generation** | Dynamic generation of downloadable PDF tax invoices adhering to statutory invoice formatting. | All Roles |
| **FR-10: Payment Logging** | Record full or partial settlements against invoices with payment methods (UPI, Bank, Card, Cash). | Admin, Owner, Accountant |
| **FR-11: Credit Notes** | Issue post-billing adjustments or discounts linked directly to invoice numbers. | Admin, Owner, Accountant |
| **FR-12: Customer Portal** | Dedicated self-service interface where customers view only their own invoices and payment history. | Customer |
| **FR-13: Business Settings** | Configure business legal name, GSTIN, bank details (IFSC, Account Number), and invoice prefixes. | Admin, Owner |

---

\newpage

## CHAPTER 14: NON-FUNCTIONAL REQUIREMENTS

1. **Performance & Latency**:
   - Backend REST API endpoints must respond within **200 milliseconds** under nominal load.
   - Frontend initial page load bundle must render in **< 1.5 seconds** via Vite's optimized asset chunking.
2. **Security & Cryptography**:
   - User passwords must never be stored in plaintext; salted and hashed using **bcryptjs** (10 rounds).
   - Stateless **JSON Web Tokens (JWT)** with 7-day expiration; passed via HTTP Authorization Bearer headers.
   - Input sanitization and MongoDB parameter escaping to prevent NoSQL injection and Cross-Site Scripting (XSS).
3. **Reliability & Resiliency**:
   - Resilient database connection handling: Mongoose buffer timeouts capped to 2.5s with instant demo fallback to eliminate 10s unhandled buffering hangs.
   - High availability guaranteed by Render's automated health checks (`/api/health`) and container restart policies.
4. **Portability & Containerization**:
   - Complete application environment reproducibility guaranteed via multi-stage Docker builds across Windows, macOS, and Linux.
5. **Usability & Responsive Layout**:
   - Responsive user interface supporting desktops (1920x1080, 1366x768), laptops, and mobile screens with consistent Lucide iconography and clear color-coded status badges.

---

\newpage

## CHAPTER 15: TECHNOLOGY STACK

```
+-----------------------------------------------------------------------+
|                       BillFlow Technology Stack                       |
+-----------------------------------------------------------------------+
| Component   | Technology             | Version  | Purpose             |
+-------------+------------------------+----------+---------------------+
| Frontend    | React.js               | 18.3.1   | Reactive Component  |
|             | Vite                   | 6.0.7    | Next-Gen Bundler    |
|             | React Router DOM       | 6.28.0   | Client-side Routing |
|             | Lucide React           | 1.16.0   | Vector UI Icons     |
|             | Recharts               | 2.15.0   | Visual Analytics    |
+-------------+------------------------+----------+---------------------+
| Backend     | Node.js                | 20.x     | JavaScript Runtime  |
|             | Express.js             | 4.21.2   | REST API Framework  |
|             | JSON Web Token (JWT)   | 9.0.2    | Stateless Auth      |
|             | bcryptjs               | 3.0.2    | Password Hashing    |
|             | PDFKit                 | 0.20.2   | Dynamic PDF Engine  |
|             | Morgan & CORS          | Latest   | Logging & Cross-Org |
+-------------+------------------------+----------+---------------------+
| Database    | MongoDB Atlas          | 6.0/8.0  | Clustered Cloud DB  |
|             | Mongoose ODM           | 8.9.5    | Object Data Schema  |
+-------------+------------------------+----------+---------------------+
| DevOps      | Git & GitHub           | Latest   | Version Control     |
|             | Docker Engine          | 27.x     | Container Packaging |
|             | Docker Compose         | v2       | Multi-Container Net |
|             | Kubernetes (K8s)       | v1.31    | Cloud Orchestration |
|             | KIND (K8s in Docker)   | v0.24    | Local Cluster Node  |
|             | Render Cloud Platform  | Live PaaS| Production Hosting  |
+-----------------------------------------------------------------------+
```

---

\newpage

## CHAPTER 16: SYSTEM ARCHITECTURE

### 16.1 Tiered Architectural Decomposition
BillFlow is structured into a clean, decoupled three-tier architecture:

1. **Presentation Tier (Client-Side SPA)**:
   - Built with React 18 and compiled into optimized static HTML/CSS/JS bundles using Vite.
   - Manages client routing, user authentication state, dynamic forms, and charts.
   - Communicates asynchronously with the backend tier via standard HTTPS JSON REST requests.

2. **Application Tier (Backend Microservice REST API)**:
   - Built on Node.js and Express.js running on an asynchronous, event-driven event loop.
   - Implements authentication middleware, RBAC authorization guards, business logic, tax computation algorithms, and PDFKit document generation.

3. **Data Tier (Clustered Cloud NoSQL Storage)**:
   - Hosted on MongoDB Atlas using Replica Sets for automatic failover, data replication, and high write availability.
   - Communicates with Express via Mongoose Object Data Modeling (ODM) with strict schema validation.

```
       +---------------------------------------------------------------+
       |             BillFlow End-to-End System Architecture           |
       +---------------------------------------------------------------+

       [ Web Browsers / Mobile Clients ]
                      │
                      ▼ (HTTPS Requests)
       +───────────────────────────────────────────────+
       |   Presentation Tier: React 18 + Vite SPA      |
       |   • Context API State   • React Router v6     |
       |   • Recharts Analytics  • Lucide Vector Icons |
       +───────────────────────────────────────────────+
                      │
                      ▼ (REST API / Bearer JWT / JSON)
       +───────────────────────────────────────────────+
       |   Application Tier: Node.js + Express API     |
       |   • JWT Auth Guard      • RBAC Authorization  |
       |   • Financial Engine    • PDFKit Vector Stream|
       +───────────────────────────────────────────────+
                      │
                      ▼ (Mongoose ODM / TLS Encrypted)
       +───────────────────────────────────────────────+
       |   Data Tier: MongoDB Atlas Clustered DB       |
       |   • Users               • Customers           |
       |   • Invoices            • Payments            |
       |   • Products            • Credit Notes        |
       +───────────────────────────────────────────────+
```

### 16.2 Full-Stack & DevOps Architecture
The complete system and deployment architecture diagram is illustrated in **Figure 7**:

![Figure 7 – BillFlow Full Stack and DevOps Architecture](screenshots/fig07_architecture.png)
*Figure 7 – BillFlow Full Stack Application and DevOps Deployment Architecture.*

---

\newpage

## CHAPTER 17: DATABASE DESIGN

### 17.1 Schema Architecture & Normalized References
The database design follows modern Document-Oriented design principles in MongoDB. While MongoDB is a NoSQL document database, financial systems require strict referential integrity. BillFlow achieves this by using **normalized Mongoose ObjectIds** with foreign-key-style references (`ref: 'User'`, `ref: 'Customer'`, `ref: 'Invoice'`), combined with embedded sub-documents for multi-item line details within invoices and address structures.

### 17.2 Detailed Entity Models

#### 1. User Model (`backend/models/User.js`)
- `_id`: ObjectId (Primary Key)
- `name`: String (Required, Full name of user)
- `email`: String (Required, Unique, Lowercase business email)
- `password`: String (Required, bcrypt hashed, `select: false` for security)
- `role`: Enum [`'Admin'`, `'Business Owner'`, `'Accountant'`, `'Customer'`] (Default: `'Business Owner'`)
- `companyName`: String (Business or organizational trading name)
- `phone`: String (Contact phone number)
- `taxId`: String (GSTIN / Tax ID)
- `businessAddress`: Object (`street`, `city`, `state`, `zipCode`, `country`, `fullAddress`)
- `isActive`: Boolean (Account activation status, default `true`)
- `createdAt` / `updatedAt`: Timestamps

#### 2. Customer Model (`backend/models/Customer.js`)
- `_id`: ObjectId (Primary Key)
- `user`: ObjectId (Foreign Key -> User, tenant scoping)
- `customerId`: String (Formatted business ID, e.g. `CUST-2026-001`)
- `name`: String (Client contact representative name)
- `companyName`: String (Registered client legal entity)
- `email` / `phone`: String (Contact coordinates)
- `gstin`: String (15-character statutory GST identification number)
- `billingAddress` / `shippingAddress`: Embedded Address Objects
- `status`: Enum [`'Active'`, `'Inactive'`, `'Archived'`]
- `paymentTerms`: String (e.g. `'Net 30'`, `'Due on Receipt'`)
- `openingBalance` / `creditLimit`: Numbers

#### 3. Product Model (`backend/models/Product.js`)
- `_id`: ObjectId (Primary Key)
- `user`: ObjectId (Foreign Key -> User)
- `productId`: String (e.g. `PRD-001`)
- `name`: String (Product or professional service title)
- `productCode`: String (Statutory SAC / HSN code)
- `category`: String (e.g. `'Cloud Services'`, `'Consulting'`)
- `type`: Enum [`'Product'`, `'Service'`]
- `unit`: String (e.g. `'Hours'`, `'Months'`, `'Units'`)
- `price`: Number (Base price per unit)
- `taxRate`: Number (Standard statutory GST rate: 0, 5, 12, 18, 28%)
- `status`: Enum [`'Active'`, `'Inactive'`]

#### 4. Invoice Model (`backend/models/Invoice.js`)
- `_id`: ObjectId (Primary Key)
- `user`: ObjectId (Foreign Key -> User)
- `invoiceNumber`: String (Unique business invoice number, e.g. `INV-2026-001`)
- `customer`: ObjectId (Foreign Key -> Customer)
- `customerName` / `customerEmail`: Strings (Snapshot coordinates)
- `invoiceDate` / `dueDate`: Dates
- `transactionType`: Enum [`'Intra-State'`, `'Inter-State'`]
- `items`: Array of Embedded Objects:
  - `product`: ObjectId (Optional link to Product catalog)
  - `description`: String
  - `quantity`: Number
  - `unitPrice`: Number
  - `discount`: Number
  - `taxRate`: Number
  - `taxableAmount`: Number
  - `cgst` / `sgst` / `igst`: Numbers
  - `amount`: Number
- `subtotal` / `taxTotal` / `totalAmount`: Numbers
- `paidAmount` / `balanceDue`: Numbers
- `status`: Enum [`'Draft'`, `'Sent'`, `'Pending'`, `'Partially Paid'`, `'Paid'`, `'Overdue'`, `'Cancelled'`]

#### 5. Payment Model (`backend/models/Payment.js`)
- `_id`: ObjectId (Primary Key)
- `user`: ObjectId (Foreign Key -> User)
- `invoice`: ObjectId (Foreign Key -> Invoice)
- `invoiceNumber`: String
- `customer`: ObjectId (Foreign Key -> Customer)
- `paymentNumber`: String (e.g. `PAY-2026-001`)
- `amount`: Number (Payment transaction amount)
- `paymentDate`: Date
- `paymentMethod`: Enum [`'Bank Transfer'`, `'UPI'`, `'Credit Card'`, `'Debit Card'`, `'Cash'`, `'Cheque'`, `'Other'`]
- `transactionReference`: String (NEFT/RTGS/UPI reference code)
- `status`: Enum [`'Completed'`, `'Pending'`, `'Failed'`, `'Refunded'`]

#### 6. Credit Note Model (`backend/models/CreditNote.js`)
- `_id`: ObjectId (Primary Key)
- `user`: ObjectId (Foreign Key -> User)
- `invoice`: ObjectId (Foreign Key -> Invoice)
- `creditNoteNumber`: String (e.g. `CN-2026-001`)
- `amount`: Number
- `creditNoteDate`: Date
- `reason`: Enum [`'Order Cancellation'`, `'Goods Return'`, `'Deficiency in Service'`, `'Correction in Invoice'`, `'Price Adjustment'`, `'Other'`]
- `status`: Enum [`'Draft'`, `'Issued'`, `'Applied'`, `'Refunded'`, `'Cancelled'`]

### 17.3 Entity-Relationship Schema Diagram
The comprehensive relational entity diagram is illustrated in **Figure 7b**:

![Figure 7b – BillFlow Database ER Schema](screenshots/fig07b_database.png)
*Figure 7b – BillFlow Normalized Database ER Schema & Document Relationships.*

---

\newpage

## CHAPTER 18: FRONTEND IMPLEMENTATION

### 18.1 Single-Page Application (SPA) Design
The BillFlow frontend is designed using React 18, bundled through Vite 6. Unlike traditional multi-page web applications that trigger full document reloads for every navigation event, BillFlow operates as a high-performance **Single Page Application (SPA)**. Client-side navigation is managed by React Router v6 (`react-router-dom`), ensuring that switching between the Dashboard, Customers, Products, and Invoices occurs instantaneously in under 50 milliseconds.

### 18.2 State Management via React Context API
Global state, user session identity, and authentication tokens are encapsulated within a centralized React Context: `AuthContext.jsx`.

```javascript
// Excerpt from frontend/src/context/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('billflow_token'));
  const [loading, setLoading] = useState(true);

  const login = (tokenData, userData) => {
    localStorage.setItem('billflow_token', tokenData);
    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('billflow_token');
    setToken(null);
    setUser(null);
  };
  // ...
};
```

### 18.3 Interactive Data Visualizations & Routing
- **Recharts Library**: Powers the interactive **Monthly Revenue Trend Area Chart** on the dashboard, rendering dual continuous gradients for Total Invoiced Sales versus Cleared Cash Receipts.
- **Lucide React Icons**: Provides lightweight SVG iconography throughout the navigation sidebar, action buttons, and status indicators.
- **Protected Route Guards**: Wrapped via `ProtectedRoute.jsx`, checking whether a valid JWT token exists and whether the user's role is authorized to view the requested page (e.g., restricting `/users` to Administrators).

---

\newpage

## CHAPTER 19: BACKEND IMPLEMENTATION

### 19.1 Express Server Bootstrapping & Middleware
The backend architecture is centered in `backend/server.js`. Express initializes a streamlined middleware pipeline:

```javascript
// Excerpt from backend/server.js
const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Invoice Generation and Business Billing Management Platform API',
    uptime: process.uptime(),
  });
});
```

### 19.2 Controller Design Patterns
The application follows the **Controller-Service-Model** design pattern. All HTTP request parsing, input sanitization, business validation, and response construction are isolated into specialized controllers:
- `authController.js`: Registration, login, profile updates.
- `dashboardController.js`: Financial metrics calculation, chart aggregation.
- `customerController.js`: Customer directory, running balance ledgers.
- `productController.js`: Catalog items, price management.
- `invoiceController.js`: Tax calculations, line item processing, PDF generation.
- `paymentController.js`: Payment recording, balance adjustments.
- `creditNoteController.js`: Credit adjustments, post-billing notes.

### 19.3 Fail-Fast Resilient Connection Layer
To prevent hanging operations when connecting across cloud regions or experiencing database network access limits, `backend/config/db.js` enforces a strict 2.5-second buffer timeout (`mongoose.set('bufferTimeoutMS', 2500)`). When disconnected, all controllers utilize the centralized fallback dataset (`backend/utils/mockData.js`) so that 1-Click Demo testing and interface evaluation remain 100% operational with sub-100ms response times.

---

\newpage

## CHAPTER 20: API IMPLEMENTATION

The platform provides a comprehensive REST API organized by domain:

| HTTP Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Health check & uptime monitor |
| **POST** | `/api/auth/register` | Public | Register new business account |
| **POST** | `/api/auth/login` | Public | Authenticate user & receive JWT |
| **GET** | `/api/auth/profile` | Private | Retrieve logged-in user profile |
| **PUT** | `/api/auth/profile` | Private | Update user contact & business info |
| **GET** | `/api/dashboard/summary` | Private | High-level metrics, chart data & recent activities |
| **GET** | `/api/customers` | Private | Search, filter & paginate customers |
| **POST** | `/api/customers` | Private | Add a new business customer |
| **GET** | `/api/customers/:id` | Private | Get customer profile & running balance ledger |
| **PUT** | `/api/customers/:id` | Private | Update customer coordinates & terms |
| **GET** | `/api/products` | Private | Search & list product/service catalog |
| **POST** | `/api/products` | Private | Add new catalog item with tax rates |
| **GET** | `/api/invoices` | Private | Search, filter & list tax invoices |
| **POST** | `/api/invoices` | Private | Generate new tax invoice with auto GST |
| **GET** | `/api/invoices/:id` | Private | Retrieve single invoice details |
| **GET** | `/api/invoices/:id/pdf` | Private | Stream vector PDF binary document |
| **GET** | `/api/payments` | Private | List all recorded payment settlements |
| **POST** | `/api/payments` | Private | Record payment against invoice |
| **GET** | `/api/credit-notes` | Private | List credit notes & adjustment records |
| **POST** | `/api/credit-notes` | Private | Issue credit note against an invoice |
| **GET** | `/api/reports/sales` | Private | Monthly sales, tax & collection report |
| **GET** | `/api/portal/summary` | Private | Customer self-service dashboard |
| **GET** | `/api/settings` | Private | Retrieve organization business settings |

---

\newpage

## CHAPTER 21: AUTHENTICATION AND AUTHORIZATION

### 21.1 JSON Web Token (JWT) Lifecycle
Authentication is completely stateless. Upon successful verification of credentials during `POST /api/auth/login`, the backend cryptographically signs a JSON Web Token containing the user's MongoDB ObjectId:

$$\text{JWT} = \text{Base64Url}(\text{Header}) \mathbin{\Vert} \text{Base64Url}(\text{Payload}) \mathbin{\Vert} \text{HMAC-SHA256}(\text{Header} \mathbin{\Vert} \text{Payload}, K_{\text{secret}})$$

The token has a configurable lifespan of 7 days (`JWT_EXPIRES_IN=7d`). The React client stores the token in secure browser `localStorage` and injects it into every outbound HTTP request via an Axios request interceptor:

$$\text{Authorization: Bearer } \langle\text{JWT\_TOKEN}\rangle$$

### 21.2 Password Hashing with bcryptjs
Passwords are never stored in plaintext. In `backend/models/User.js`, a Mongoose pre-save middleware intercepts the plaintext password, generates a cryptographically secure salt with 10 rounds, and computes a salted hash:

$$\text{Hash} = \text{bcrypt}(\text{Password}, \text{Salt}_{10})$$

When logging in, `bcrypt.compare()` evaluates the plaintext candidate against the stored hash in constant time, preventing timing-attack vulnerabilities.

### 21.3 Role-Based Access Control (RBAC) Matrix

| Application Feature / Page | System Administrator | Business Owner | Staff Accountant | Billed Customer |
| :--- | :---: | :---: | :---: | :---: |
| **Platform Dashboard** | Full Access | Full Access | Full Access | Restricted |
| **Customer Directory & Ledger** | Full Access | Full Access | Full Access | Restricted |
| **Product / Service Catalog** | Full Access | Full Access | Read-Only | Restricted |
| **Create / Edit Invoices** | Full Access | Full Access | Full Access | Restricted |
| **View Invoices & Download PDF** | Full Access | Full Access | Full Access | Own Invoices |
| **Record Payments & Credit Notes**| Full Access | Full Access | Full Access | Restricted |
| **Financial Analytics & Reports** | Full Access | Full Access | Read-Only | Restricted |
| **Customer Self-Service Portal** | Full Access | View Client View| View Client View| Full Access |
| **Business Legal & Bank Settings**| Full Access | Full Access | Restricted | Restricted |
| **Platform User Management** | Full Access | Restricted | Restricted | Restricted |

---

\newpage

## CHAPTER 22: INVOICE GENERATION AND PDF IMPLEMENTATION

### 22.1 Mathematical Tax Calculation Engine
BillFlow implements a compliant Indian Goods and Services Tax (GST) mathematical engine in `backend/controllers/invoiceController.js`. For every invoice item:

$$\text{Base Amount} = \text{Quantity} \times \text{Unit Price}$$

$$\text{Taxable Amount} = \max(0, \text{Base Amount} - \text{Item Discount})$$

Depending on the registered state of the customer versus the seller:
1. **Intra-State Transaction** (Seller and Buyer in the same state):
   $$\text{CGST} = \text{Taxable Amount} \times \left(\frac{\text{Tax Rate}}{2 \times 100}\right)$$
   $$\text{SGST} = \text{Taxable Amount} \times \left(\frac{\text{Tax Rate}}{2 \times 100}\right)$$
   $$\text{IGST} = 0$$

2. **Inter-State Transaction** (Seller and Buyer in different states):
   $$\text{CGST} = 0, \quad \text{SGST} = 0$$
   $$\text{IGST} = \text{Taxable Amount} \times \left(\frac{\text{Tax Rate}}{100}\right)$$

Total calculations:
$$\text{Total Invoice Amount} = \sum \text{Taxable Amount} + \sum \text{CGST} + \sum \text{SGST} + \sum \text{IGST}$$

$$\text{Balance Due} = \text{Total Invoice Amount} - \text{Total Payments Settled}$$

### 22.2 PDFKit Vector Streaming Engine
In `backend/utils/pdfGenerator.js`, BillFlow utilizes **PDFKit** to dynamically construct vector documents in memory. The document streams directly through the HTTP response pipeline (`Content-Type: application/pdf`) with inline content disposition:
- Corporate branding banner with custom logo placement.
- Two-column metadata block: Supplier legal details and Tax ID on the left; Buyer coordinates and invoice dates on the right.
- Table grid rendering item descriptions, quantities, unit prices, tax rates, CGST, SGST, IGST, and totals.
- Financial settlement summary box displaying Subtotal, Total Tax, Net Amount Paid, and Balance Due.
- Statutory computer-generated declaration eliminating the requirement for manual physical signatures.

---

\newpage

## CHAPTER 23: GIT AND GITHUB IMPLEMENTATION

### 23.1 Version Control Strategy
The BillFlow source code is maintained under strict version control using **Git** and hosted publicly on **GitHub**:
- **Repository URL**: `https://github.com/prakashkommarajula-dot/Billing-Platform`
- **Production Branch**: `main`

### 23.2 Repository Layout
The repository is structured with clean separation of concerns:
```
Billing-Platform/
├── backend/                  # Node.js + Express REST API Microservice
│   ├── config/               # Database connection logic (db.js)
│   ├── controllers/          # Business logic controllers (7 domains)
│   ├── middleware/           # Auth and error middleware
│   ├── models/               # Mongoose schema models (User, Invoice, etc.)
│   ├── routes/               # Express route definitions
│   ├── scripts/              # Database seeding and utility scripts
│   ├── utils/                # PDFKit generator & mock data fallbacks
│   ├── Dockerfile            # Production Node.js Alpine container
│   ├── package.json          # Backend dependencies
│   └── server.js             # Application entry point
├── frontend/                 # React 18 + Vite SPA Client
│   ├── public/               # Public static assets & docs
│   ├── src/                  # React components, pages, context, services
│   ├── Dockerfile            # Multi-stage production Nginx container
│   ├── nginx.conf            # Nginx reverse proxy configuration
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite compilation configuration
├── k8s/                      # Kubernetes Declarative Manifests
│   ├── namespace.yaml        # 'billflow' namespace
│   ├── configmap.yaml        # Configuration values
│   ├── secret.yaml           # Base64 encoded secrets
│   ├── mongodb-pvc.yaml      # Persistent Volume Claim for MongoDB
│   ├── mongodb-deployment.yaml # MongoDB Pod Deployment
│   ├── mongodb-service.yaml  # ClusterIP Service for MongoDB
│   ├── backend-deployment.yaml # Backend Pod Deployment
│   ├── backend-service.yaml  # ClusterIP Service for Backend
│   ├── frontend-deployment.yaml# Frontend Pod Deployment
│   ├── frontend-service.yaml # NodePort Service (Port 30080)
│   └── kustomization.yaml    # Kustomize aggregation
├── docker-compose.yml        # Local multi-container orchestration
├── kind-cluster-config.yaml  # KIND cluster definition
├── render.yaml               # Render Infrastructure-as-Code Blueprint
├── package.json              # Root coordination manifest
└── README.md                 # Project execution guide
```

The actual GitHub repository interface is shown in **Figure 13**:

![Figure 13 – BillFlow GitHub Repository](screenshots/fig13_github_repo.png)
*Figure 13 – BillFlow GitHub Repository Organization on Branch main.*

---

\newpage

## CHAPTER 24: DOCKER IMPLEMENTATION

### 24.1 Containerization Rationale
Docker packages the BillFlow application, runtime, system libraries, and dependencies into lightweight, standalone containers, ensuring complete consistency across development machines, CI/CD runners, and production cloud servers.

### 24.2 Backend Dockerfile Analysis
`backend/Dockerfile` uses a single-stage, security-hardened Alpine base:
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production PORT=5000
EXPOSE 5000
CMD ["node", "server.js"]
```

### 24.3 Frontend Multi-Stage Build & Nginx Production Container
`frontend/Dockerfile` employs an efficient **multi-stage build pattern**:
- **Stage 1 (Builder)**: Uses `node:20-alpine` to install dev dependencies, parse JSX, and compile static bundles via `npm run build` into `/app/dist`.
- **Stage 2 (Runner)**: Uses `nginx:alpine` (image size < 25MB), copies only the compiled assets from Stage 1 into `/usr/share/nginx/html`, and mounts `nginx.conf` to handle client-side SPA routing (`try_files $uri $uri/ /index.html`).

---

\newpage

## CHAPTER 25: DOCKER COMPOSE IMPLEMENTATION

`docker-compose.yml` orchestrates the complete 3-service stack with a single command (`docker compose up -d`):

```yaml
services:
  mongodb:
    image: mongo:6-jammy
    container_name: billflow-mongodb
    ports: ["27018:27017"]
    volumes: [mongodb_data:/data/db]
    networks: [billflow-network]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: { context: ./backend, dockerfile: Dockerfile }
    container_name: billflow-backend
    ports: ["5000:5000"]
    depends_on:
      mongodb: { condition: service_healthy }
    networks: [billflow-network]

  frontend:
    build: { context: ./frontend, dockerfile: Dockerfile }
    container_name: billflow-frontend
    ports: ["80:80", "5173:80"]
    depends_on: [backend]
    networks: [billflow-network]

volumes:
  mongodb_data:
    name: billflow_mongodb_data
networks:
  billflow-network:
    name: billflow-network
    driver: bridge
```

Actual execution is documented in **Figure 11**:

![Figure 11 – Docker Container Execution](screenshots/fig11_docker_execution.png)
*Figure 11 – Docker Multi-Container Compose Orchestration Status.*

---

\newpage

## CHAPTER 26: KUBERNETES IMPLEMENTATION

BillFlow provides a complete suite of declarative Kubernetes manifests in the `k8s/` directory:

1. **Namespace Isolation (`namespace.yaml`)**: Isolates all BillFlow resources inside the dedicated `billflow` namespace.
2. **Configuration & Secrets Management (`configmap.yaml`, `secret.yaml`)**: Decouples environment variables (`PORT`, `NODE_ENV`) and base64-encoded credentials (`JWT_SECRET`, `MONGODB_URI`) from container images.
3. **Persistent Volume Claim (`mongodb-pvc.yaml`)**: Allocates 2Gi of durable block storage requesting `ReadWriteOnce` access to maintain database state across Pod restarts.
4. **Deployments & ReplicaSets**:
   - `mongodb-deployment.yaml`: Deploys official Mongo container with mounted volume.
   - `backend-deployment.yaml`: Deploys stateless backend Pods with readiness probes.
   - `frontend-deployment.yaml`: Deploys Nginx SPA Pods with rolling update strategy.
5. **Services Networking**:
   - `mongodb-service.yaml`: Internal ClusterIP on port 27017.
   - `backend-service.yaml`: Internal ClusterIP on port 5000.
   - `frontend-service.yaml`: NodePort Service exposing port 80 externally via port **30080**.

Actual cluster execution is documented in **Figure 12**:

![Figure 12 – Kubernetes Deployment Status](screenshots/fig12_kubernetes_status.png)
*Figure 12 – Kubernetes Pods, Services, and PVC Status on KIND.*

---

\newpage

## CHAPTER 27: KIND CLUSTER CONFIGURATION

To enable native Kubernetes testing on local developer workstations without cloud provider costs, BillFlow uses **KIND (Kubernetes in Docker)**. The configuration `kind-cluster-config.yaml` maps host ports directly to Kubernetes container nodes:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: billflow-cluster
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30080
    hostPort: 30080
    listenAddress: "0.0.0.0"
    protocol: TCP
  - containerPort: 30500
    hostPort: 30500
    listenAddress: "0.0.0.0"
    protocol: TCP
```

Execution command:
```bash
kind create cluster --config kind-cluster-config.yaml
kubectl apply -k k8s/
```

---

\newpage

## CHAPTER 28: CLOUD DEPLOYMENT USING RENDER

### 28.1 Infrastructure-as-Code with render.yaml
Production cloud deployment is defined declaratively using Render's Infrastructure-as-Code blueprint (`render.yaml`):

```yaml
services:
  - type: web
    name: billflow-billing-platform
    runtime: node
    plan: free
    region: oregon
    buildCommand: npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
      - key: MONGODB_URI
        sync: false
```

### 28.2 Live Production Proof
The platform is live and verified on Render:
- **Live URL**: `https://billflow-billing-platform.onrender.com`
- **Health Check**: `https://billflow-billing-platform.onrender.com/api/health` (HTTP 200 OK)
- **Deployment ID**: `dep-dbotseavcj2c739rbk1g` (Status: LIVE)

Evidence screenshots are documented in **Figures 14, 15, and 16**:

![Figure 14 – Render Deployment Dashboard](screenshots/fig14_render_dashboard.png)
*Figure 14 – Render Cloud Console & Live Service Status.*

![Figure 15 – Successfully Deployed BillFlow Application](screenshots/fig15_render_app.png)
*Figure 15 – Successfully Deployed BillFlow Web Service.*

![Figure 16 – BillFlow Application Running on Render](screenshots/fig16_render_live.png)
*Figure 16 – BillFlow Cloud Accounting Platform Running Live on Render.*

---

\newpage

## CHAPTER 29: MONGODB ATLAS CONFIGURATION

BillFlow uses a globally replicated MongoDB Atlas cloud cluster:
- **Cluster Host**: `billing.zhvmruf.mongodb.net`
- **Database Name**: `invoice_billing_platform`
- **Authentication**: SCRAM-SHA-256 over TLS/SSL encryption
- **Network Security**: Configured with IP Access List (`0.0.0.0/0`) allowing secure incoming connections from Render cloud instances while requiring valid credentials.
- **Connection String Pattern**:
  `mongodb+srv://<user>:<password>@billing.zhvmruf.mongodb.net/invoice_billing_platform?retryWrites=true&w=majority`

---

\newpage

## CHAPTER 30: APPLICATION EXECUTION INSTRUCTIONS

### 30.1 Local Development Environment
```bash
# 1. Clone repository
git clone https://github.com/prakashkommarajula-dot/Billing-Platform.git
cd Billing-Platform

# 2. Install all dependencies
npm run install:all

# 3. Start Backend server (Terminal 1)
npm run dev:backend

# 4. Start Frontend development server (Terminal 2)
npm run dev:frontend

# 5. Open browser at http://localhost:5173
```

### 30.2 Docker Compose Execution
```bash
# Build images and start all 3 containers in background
docker compose up -d --build

# Inspect container status
docker compose ps

# View unified log stream
docker compose logs -f

# Shutdown stack
docker compose down
```

### 30.3 Kubernetes KIND Cluster Execution
```bash
# Create KIND cluster
kind create cluster --config kind-cluster-config.yaml

# Apply all manifests
kubectl apply -k k8s/

# Verify Pod status
kubectl get pods -n billflow

# Access frontend via NodePort at http://localhost:30080
```

Terminal execution evidence is shown in **Figures 8, 9, and 10**:

![Figure 8 – Backend Server Execution](screenshots/fig08_backend_execution.png)
*Figure 8 – Backend Express Server Startup Output.*

![Figure 9 – Frontend Development Server Execution](screenshots/fig09_frontend_execution.png)
*Figure 9 – Vite React Frontend Development Server.*

![Figure 10 – BillFlow Application Running Locally](screenshots/fig10_local_application.png)
*Figure 10 – BillFlow Application Running Locally on Developer Machine.*

---

\newpage

## CHAPTER 31: TESTING AND TEST CASES

Formal verification of the BillFlow platform was conducted across all core modules:

| Test ID | Module | Scenario / Input | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Authentication | Enter valid demo credentials (`admin@platform.com`) | JWT issued, stored in localStorage, redirect to dashboard | HTTP 200 OK, valid JWT token returned | **PASS** |
| **TC-02** | Authentication | Enter unregistered email & invalid password | Display error alert: "Invalid email or password" | HTTP 401 Unauthorized | **PASS** |
| **TC-03** | RBAC Security | Non-admin user attempts access to `/users` | Access denied message, redirect to dashboard | HTTP 403 Forbidden | **PASS** |
| **TC-04** | Dashboard | Authenticated user visits `/dashboard` | Compute total sales, collections, and line chart metrics | HTTP 200 OK, ₹2,34,660 sales aggregated | **PASS** |
| **TC-05** | Customer Mgmt | Fetch customer list via `GET /api/customers` | Return list of active clients with calculated outstanding | HTTP 200 OK, 4 customer records returned | **PASS** |
| **TC-06** | Customer Details | Request ledger for customer `CUST-2026-001` | Chronological debits/credits with running balance | HTTP 200 OK, 3 ledger records computed | **PASS** |
| **TC-07** | Product Catalog | Query catalog items via `GET /api/products` | Return service list with SAC codes and 18% GST rates | HTTP 200 OK, 4 enterprise items returned | **PASS** |
| **TC-08** | Invoice Creation | Create invoice with 1 item (₹75,000, 18% GST) | Subtotal ₹75,000, CGST ₹6,750, SGST ₹6,750, Total ₹88,500 | HTTP 201 Created, exact tax match | **PASS** |
| **TC-09** | Vector PDF | Request PDF export `GET /api/invoices/:id/pdf` | Stream binary PDF document with proper headers | HTTP 200 OK, Content-Type: application/pdf | **PASS** |
| **TC-10** | Payment Logging | Record partial payment of ₹21,400 on INV-2026-002 | Invoice balance drops to ₹43,500; status: Partially Paid | HTTP 200 OK, invoice balance updated | **PASS** |
| **TC-11** | Credit Notes | Issue promotional credit note of ₹5,000 | Credit applied, customer ledger credited by ₹5,000 | HTTP 201 Created, ledger balance updated | **PASS** |
| **TC-12** | Health Check | Probe cloud endpoint `GET /api/health` | Return status 'healthy' with current uptime seconds | HTTP 200 OK, status: 'healthy' | **PASS** |

---

\newpage

## CHAPTER 32: RESULTS AND SCREENSHOTS

This chapter presents authentic screenshots captured directly from the live running BillFlow application.

### 32.1 User Login Interface
The login interface features 1-Click Demo account testing buttons allowing evaluators to immediately test the platform across any of the 4 roles without manual typing:

![Figure 1 – BillFlow User Login Page](screenshots/fig01_login.png)
*Figure 1 – BillFlow User Authentication & 1-Click Demo Login Interface.*

### 32.2 Business Analytics Dashboard
Upon signing in as Business Owner, the core dashboard presents immediate financial key performance indicators (Total Sales, Total Invoices, Paid Invoices, Outstanding Receivables) alongside the interactive 6-month revenue trend chart:

![Figure 2 – BillFlow Business Dashboard](screenshots/fig02_dashboard.png)
*Figure 2 – BillFlow Executive Dashboard with Financial KPIs & Monthly Trend Chart.*

### 32.3 Customer Management Module
The customer directory presents client accounts with search, filter, GSTIN badges, and real-time outstanding balance aggregation:

![Figure 3 – Customer Management Module](screenshots/fig03_customers.png)
*Figure 3 – Customer Directory & Accounts Receivable Management Module.*

### 32.4 Customer Profile & Running Balance Ledger
Selecting any customer opens their detailed ledger view, showing every invoice, settled payment, and running balance:

![Figure 3b – Customer Profile & Ledger Module](screenshots/fig03b_customer_details.png)
*Figure 3b – Detailed Customer Profile, Contact Info & Chronological Ledger Balance.*

### 32.5 Product & Service Catalog
The catalog lists billable offerings with category filters, HSN/SAC statutory codes, unit rates, and GST percentages:

![Figure 4 – Product Management Module](screenshots/fig04_products.png)
*Figure 4 – Products and Services Catalog Management.*

### 32.6 Invoice Creation Interface
The invoice builder allows dynamic line-item addition, automated subtotal calculations, and statutory dual-tax splitting:

![Figure 5 – Invoice Creation Interface](screenshots/fig05_create_invoice.png)
*Figure 5 – Multi-Item Tax Invoice Creation Interface.*

### 32.7 Invoice Details & PDF Preview
The invoice details view allows instant vector PDF downloads, payment logging, and credit note issuance:

![Figure 6 – Invoice Details and PDF Preview](screenshots/fig06_invoice_details.png)
*Figure 6 – Invoice Details, Payment Timeline & Server-Generated PDF Actions.*

---

\newpage

## CHAPTER 33: ADVANTAGES

1. **Complete Financial Precision**: Eliminates human calculation errors through automated dual-tax splitting, discounts, and rounding algorithms.
2. **Strict Multi-Role Data Governance**: Administrators, Business Owners, Accountants, and Customers operate within isolated permission boundaries.
3. **High Operational Cost Savings**: Replaces expensive proprietary accounting software licenses with an open-source, cloud-native stack.
4. **Anywhere, Any-Device Cloud Access**: Accessible via any modern web browser on desktops, laptops, tablets, and smartphones.
5. **Production-Ready DevOps Infrastructure**: Complete Dockerization and Kubernetes orchestration ensure zero deployment friction and reproducible environments.

---

\newpage

## CHAPTER 34: LIMITATIONS

1. **Single Currency Focus**: Currently optimized primarily for Indian Rupee (INR) and standard GST tax slabs.
2. **Online Connectivity Requirement**: As a cloud-native platform, full real-time database synchronization requires internet access.
3. **No Direct Physical Hardware Integration**: POS barcode thermal label printers and cash drawers are not directly integrated via USB drivers.

---

\newpage

## CHAPTER 35: FUTURE ENHANCEMENTS

1. **AI-Powered OCR Receipt Scanning**: Integrate computer vision models (e.g., Tesseract OCR or Google Document AI) to automatically extract line items and vendor GSTINs from uploaded paper receipts.
2. **Automated Recurring Subscriptions**: Introduce cron-based subscription engines to automatically generate and email monthly recurring retainer invoices.
3. **Integrated Payment Gateway Webhooks**: Incorporate Razorpay or Stripe webhook handlers to automatically mark invoices as Paid upon successful UPI or credit card payment.
4. **Multi-Currency Forex Conversion**: Connect live European Central Bank (ECB) or Open Exchange Rates APIs to support dynamic multi-currency cross-border billing.

---

\newpage

## CHAPTER 36: CONCLUSION

The **BillFlow** project successfully fulfills all academic, engineering, and operational requirements established for a comprehensive B.Tech Capstone Project. By bridging modern full-stack web engineering with enterprise-grade cloud DevOps methodologies, BillFlow demonstrates how scalable, reliable, and user-centric financial management platforms can be built using open-source technologies.

Key milestones achieved:
- Engineered a modular MERN stack web application with 7 domain controllers and full CRUD APIs.
- Implemented cryptographically secure JWT authentication and 4-tier Role-Based Access Control.
- Programmed compliant GST tax computation and server-side PDFKit vector document rendering.
- Packaged services into optimized multi-stage Docker containers and orchestrated them declaratively with Docker Compose and Kubernetes manifests on a local KIND cluster.
- Successfully deployed the live application to Render cloud infrastructure linked to a MongoDB Atlas clustered database at `https://billflow-billing-platform.onrender.com`.

This project establishes a strong foundation in modern software architecture, containerization, microservice communication, and cloud-native software delivery.

---

\newpage

## CHAPTER 37: REFERENCES

1. Chodorow, K. (2013). *MongoDB: The Definitive Guide: Powerful and Scalable Data Storage*. O'Reilly Media.
2. Banks, A., & Porcello, E. (2020). *Learning React: Modern Patterns for Developing React Applications* (2nd ed.). O'Reilly Media.
3. Tilkov, S., & Vinoski, S. (2010). Node.js: Using JavaScript to Build High-Performance Network Programs. *IEEE Internet Computing*, 14(6), 80-83.
4. Burns, B., Grant, B., Oppenheimer, D., Brewer, E., & Wilkes, J. (2016). Borg, Omega, and Kubernetes: Lessons learned from three container-management systems over a decade. *Communications of the ACM*, 59(5), 70-79.
5. Merkel, D. (2014). Docker: Lightweight Linux containers for consistent development and deployment. *Linux Journal*, 2014(239), 2.
6. Central Board of Indirect Taxes and Customs (CBIC), Government of India. (2017). *Goods and Services Tax (GST) Invoice Rules & Format Guidelines*.
7. Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* (Doctoral dissertation, University of California, Irvine).
8. Rescorla, E. (2018). *The Transport Layer Security (TLS) Protocol Version 1.3*. RFC 8446, Internet Engineering Task Force (IETF).
9. Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)*. RFC 7519, Internet Engineering Task Force (IETF).
10. Kubernetes Official Documentation. (2026). *Kubernetes Concepts, Workloads, and Services*. Retrieved from https://kubernetes.io/docs/
11. Express.js Official Documentation. (2026). *Fast, Unopinionated, Minimalist Web Framework for Node.js*. Retrieved from https://expressjs.com/
12. Render Cloud Documentation. (2026). *Blueprint Specification & Docker Web Services*. Retrieved from https://render.com/docs/
