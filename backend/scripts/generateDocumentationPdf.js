const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateDocumentation() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true,
  });

  const outputFileName = 'BillFlow_Comprehensive_Project_Documentation.pdf';
  const rootOutputPath = path.join(__dirname, '..', '..', outputFileName);
  const frontendDocsDir = path.join(__dirname, '..', '..', 'frontend', 'public', 'docs');
  
  if (!fs.existsSync(frontendDocsDir)) {
    fs.mkdirSync(frontendDocsDir, { recursive: true });
  }
  const frontendOutputPath = path.join(frontendDocsDir, outputFileName);

  const writeStreamRoot = fs.createWriteStream(rootOutputPath);
  doc.pipe(writeStreamRoot);

  // Palette
  const PRIMARY = '#1e3a8a';     // Deep Navy Blue
  const SECONDARY = '#2563eb';   // Royal Blue
  const ACCENT = '#0284c7';      // Light Blue
  const TEXT_DARK = '#0f172a';   // Slate Dark
  const TEXT_MUTED = '#475569';  // Slate Gray
  const BG_LIGHT = '#f8fafc';    // Card / Section background
  const BORDER_COLOR = '#e2e8f0';
  const SUCCESS = '#16a34a';

  // Helper Functions
  function drawHeaderBanner(title, subtitle) {
    doc.rect(0, 0, 595.28, 110).fill(PRIMARY);
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(title, 50, 30);
    if (subtitle) {
      doc.fillColor('#93c5fd').fontSize(11).font('Helvetica').text(subtitle, 50, 62);
    }
    doc.rect(0, 110, 595.28, 4).fill(SECONDARY);
    doc.y = 135;
  }

  function sectionTitle(title, icon = '') {
    doc.moveDown(0.8);
    const y = doc.y;
    doc.rect(50, y, 4, 18).fill(SECONDARY);
    doc.fillColor(PRIMARY).fontSize(14).font('Helvetica-Bold').text(`${icon ? icon + ' ' : ''}${title}`, 62, y + 2);
    doc.moveDown(0.6);
  }

  function subSectionTitle(title) {
    doc.moveDown(0.4);
    doc.fillColor(SECONDARY).fontSize(11).font('Helvetica-Bold').text(title, 50);
    doc.moveDown(0.3);
  }

  function bodyParagraph(text) {
    doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica').text(text, 50, doc.y, {
      align: 'justify',
      lineGap: 3,
      width: 495,
    });
    doc.moveDown(0.4);
  }

  function bulletPoint(title, desc) {
    const y = doc.y;
    doc.fillColor(SECONDARY).fontSize(10).font('Helvetica-Bold').text('•', 55, y);
    doc.fillColor(TEXT_DARK).fontSize(9.5).font('Helvetica-Bold').text(title + ': ', 68, y, { continued: true });
    doc.font('Helvetica').text(desc, { width: 477, lineGap: 2 });
    doc.moveDown(0.3);
  }

  function drawTable(headers, rows, colWidths) {
    const startX = 50;
    let currentY = doc.y;

    // Header Row
    doc.rect(startX, currentY, 495, 20).fill(BG_LIGHT);
    doc.rect(startX, currentY, 495, 20).stroke(BORDER_COLOR);

    let currentX = startX;
    headers.forEach((h, i) => {
      doc.fillColor(PRIMARY).fontSize(8.5).font('Helvetica-Bold').text(h, currentX + 5, currentY + 6, {
        width: colWidths[i] - 10,
        align: 'left',
      });
      currentX += colWidths[i];
    });

    currentY += 20;

    // Data Rows
    rows.forEach((row, rowIndex) => {
      if (currentY > 740) {
        doc.addPage();
        currentY = 50;
      }

      if (rowIndex % 2 === 1) {
        doc.rect(startX, currentY, 495, 18).fill('#f1f5f9');
      }
      doc.rect(startX, currentY, 495, 18).stroke(BORDER_COLOR);

      let colX = startX;
      row.forEach((cell, cellIndex) => {
        doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica').text(String(cell), colX + 5, currentY + 5, {
          width: colWidths[cellIndex] - 10,
          align: 'left',
        });
        colX += colWidths[cellIndex];
      });

      currentY += 18;
    });

    doc.y = currentY + 10;
  }

  // ==========================================
  // PAGE 1: TITLE & COVER PAGE
  // ==========================================
  doc.rect(0, 0, 595.28, 841.89).fill('#0f172a'); // Dark background
  doc.rect(50, 50, 495.28, 8).fill(SECONDARY);

  doc.fillColor('#ffffff').fontSize(32).font('Helvetica-Bold').text('BillFlow Platform', 50, 160);
  doc.fillColor('#60a5fa').fontSize(16).font('Helvetica-Bold').text('Enterprise Invoicing & Business Billing Management System', 50, 205);

  doc.rect(50, 240, 495, 1).fill('#334155');

  doc.fillColor('#cbd5e1').fontSize(11).font('Helvetica').text(
    'A production-ready, full-stack micro-enterprise billing platform featuring automated multi-tier GST calculations, comprehensive customer ledger accounting, real-time financial reporting, client self-service portal, multi-container Docker architecture, and high-availability Kubernetes cluster orchestration.',
    50,
    260,
    { width: 495, lineGap: 5 }
  );

  // Key Badges Box
  doc.rect(50, 350, 495, 120).fill('#1e293b');
  doc.rect(50, 350, 495, 120).stroke('#3b82f6');

  doc.fillColor('#38bdf8').fontSize(12).font('Helvetica-Bold').text('KEY SYSTEM HIGHLIGHTS', 70, 368);
  doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica').text('• Full-Stack Decoupled Architecture: React 18 Vite SPA + Node.js 20 Express REST API', 70, 392);
  doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica').text('• 15 Built Pages: CRM, Invoicing, Ledger, Payments, Credit Notes, Reports, Portal, Users', 70, 408);
  doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica').text('• Multi-Container Docker Orchestration: Node.js 20 Alpine, Nginx SPA Reverse Proxy, Mongo 6', 70, 424);
  doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica').text('• Kubernetes (K8s) Cluster: Pods, Persistent Volumes (PVC), NodePort/ClusterIP, Ingress', 70, 440);

  // Metadata Footer Box
  const metaY = 620;
  doc.rect(50, metaY, 495, 140).fill('#1e293b');
  doc.rect(50, metaY, 495, 140).stroke('#475569');

  doc.fillColor('#94a3b8').fontSize(10).font('Helvetica-Bold').text('PROJECT METADATA & REPOSITORY INFORMATION', 70, metaY + 15);
  doc.fillColor('#e2e8f0').fontSize(9).font('Helvetica-Bold').text('GitHub Remote URL: ', 70, metaY + 38, { continued: true });
  doc.font('Helvetica').text('https://github.com/prakashkommarajula-dot/Billing-Platform.git');

  doc.fillColor('#e2e8f0').fontSize(9).font('Helvetica-Bold').text('Repository Branch: ', 70, metaY + 54, { continued: true });
  doc.font('Helvetica').text('main (Latest Pushed & Verified)');

  doc.fillColor('#e2e8f0').fontSize(9).font('Helvetica-Bold').text('Local Execution: ', 70, metaY + 70, { continued: true });
  doc.font('Helvetica').text('Frontend :80 / :5173 / :3000 | Backend :5000 | MongoDB :27018');

  doc.fillColor('#e2e8f0').fontSize(9).font('Helvetica-Bold').text('Kubernetes Cluster: ', 70, metaY + 86, { continued: true });
  doc.font('Helvetica').text('Frontend NodePort :30080 | Backend NodePort :30500 | Namespace: billflow');

  doc.fillColor('#e2e8f0').fontSize(9).font('Helvetica-Bold').text('Date & Version: ', 70, metaY + 102, { continued: true });
  doc.font('Helvetica').text('November 2026 | Release v1.0.0 Production');

  // ==========================================
  // PAGE 2: EXECUTIVE SUMMARY & ARCHITECTURE
  // ==========================================
  doc.addPage();
  drawHeaderBanner('1. Project Overview & Architecture', 'Objectives, System Topology & Component Interactions');

  sectionTitle('1.1 Executive Summary & Core Objectives');
  bodyParagraph(
    'BillFlow is an enterprise-grade web application engineered to solve critical operational bottlenecks encountered by growing businesses: manual tax calculation errors, unorganized client billing histories, delayed receivable collections, and lack of transparency. The platform bridges the gap between client relationship management (CRM) and financial accounting by providing real-time ledger updates, automated GST computation, and seamless invoice-to-settlement workflows.'
  );

  bulletPoint('Automated Multi-Slab GST Engine', 'Dynamically computes CGST + SGST (intra-state) or IGST (inter-state) based on customer state origin and product HSN/SAC codes across 0%, 5%, 12%, 18%, and 28% slabs.');
  bulletPoint('Integrated Client Ledger Accounting', 'Maintains an immutable double-entry style chronological ledger detailing Opening Balance, Invoices (+), Payments (-), and Credit Notes (-) with accurate running balances.');
  bulletPoint('Secure Role-Based Access Control', 'Enforces strict API and UI boundary isolation between Business Owners, Staff Accountants, Platform Admins, and Customer Portal users.');
  bulletPoint('Instant PDFKit Document Generation', 'Generates server-side vector PDF tax invoices, credit notes, and account statements directly in the browser with 1-click download capabilities.');

  sectionTitle('1.2 High-Level Multi-Tier Architecture');
  bodyParagraph(
    'The application follows a modern cloud-native decoupled 3-tier architecture designed for horizontal scalability, zero-downtime rolling updates, and complete failure isolation.'
  );

  drawTable(
    ['Tier / Layer', 'Component Name', 'Underlying Technology', 'Network & Port Mapping'],
    [
      ['Presentation Tier', 'billflow-frontend', 'React 18, Vite 6, Nginx 1.31', 'Host Port 80, 5173, 3000 (K8s NodePort 30080)'],
      ['Gateway / Proxy', 'Nginx Reverse Proxy', 'Nginx Alpine (try_files)', 'Internal proxy pass of /api/* -> backend:5000'],
      ['Application Tier', 'billflow-backend', 'Node.js 20, Express 4, Mongoose 8', 'Port 5000 (K8s NodePort 30500)'],
      ['Persistence Tier', 'billflow-mongodb', 'MongoDB 6 Jammy + PVC Volume', 'Port 27017 (K8s ClusterIP / Host 27018)'],
      ['Security Tier', 'JWT & Bcrypt Engine', 'HMAC SHA-256 + Salted Hashing', 'Stateless Bearer Header in all REST calls'],
    ],
    [95, 110, 140, 150]
  );

  // ==========================================
  // PAGE 3: TECHNOLOGY STACK BREAKDOWN
  // ==========================================
  doc.addPage();
  drawHeaderBanner('2. Technology Stack & Directory Structure', 'Comprehensive Breakdown of Tools, Libraries & Codebase Organization');

  sectionTitle('2.1 Complete Technology Matrix');

  subSectionTitle('Frontend Technologies');
  drawTable(
    ['Package / Library', 'Version', 'Role & Architectural Responsibility'],
    [
      ['React', '^18.3.1', 'Component-driven reactive UI library with Hooks state management'],
      ['Vite', '^6.0.5', 'Next-generation ES module bundler and fast HMR development server'],
      ['React Router DOM', '^6.28.0', 'Declarative client-side routing with role-guarded private routes'],
      ['Lucide React', '^0.468.0', 'Scalable modern vector icon suite across all 15 page interfaces'],
      ['Recharts', '^2.15.4', 'Interactive SVG charts for monthly revenue trends and receivables aging'],
      ['CSS3 Custom Variables', 'Native', 'Zero-dependency design system with responsive layouts and tokens'],
    ],
    [110, 65, 320]
  );

  subSectionTitle('Backend & Database Technologies');
  drawTable(
    ['Package / Library', 'Version', 'Role & Architectural Responsibility'],
    [
      ['Node.js LTS', '20.x Alpine', 'High-performance asynchronous JavaScript server runtime'],
      ['Express', '^4.21.2', 'Lightweight REST API framework for routing and middleware pipelines'],
      ['Mongoose', '^8.9.5', 'ODM library for MongoDB schema enforcement, hooks, and indexing'],
      ['JSON Web Tokens (JWT)', '^9.0.2', 'Stateless HMAC-SHA256 authenticated session token generation'],
      ['bcryptjs', '^3.0.2', 'Cryptographic salted hashing for user credentials and passwords'],
      ['PDFKit', '^0.20.2', 'High-fidelity server-side vector PDF generator for invoices & receipts'],
      ['MongoDB', '6.0 Jammy', 'Document-oriented database with ACID transactions and schema validation'],
    ],
    [110, 65, 320]
  );

  sectionTitle('2.2 Clean Repository Separation');
  bodyParagraph(
    'The project maintains strict structural separation between frontend and backend source trees to prevent dependency leakage and support independent CI/CD pipelines.'
  );

  bulletPoint('backend/', 'Contains Express routes, controllers, Mongoose schemas, auth middleware, and PDF generator.');
  bulletPoint('frontend/', 'Contains React pages, layout wrappers (Sidebar, Navbar), services/api.js, and CSS files.');
  bulletPoint('k8s/', 'Houses all declarative Kubernetes manifests including Deployments, Services, ConfigMaps, and Ingress.');
  bulletPoint('docker-compose.yml', 'Root orchestration file connecting MongoDB, Backend, and Frontend containers.');

  // ==========================================
  // PAGE 4: DETAILED MODULES BREAKDOWN (PAGES 1-7)
  // ==========================================
  doc.addPage();
  drawHeaderBanner('3. Detailed Module Specifications (Part 1)', 'Implementation Details for Pages 1 through 7');

  sectionTitle('Page 1 – Secure Authentication & 1-Click Role Switcher');
  bodyParagraph('• Route: /login | Backend: POST /api/auth/login');
  bodyParagraph('Features: JWT Bearer authentication with encrypted password comparison. Includes 1-click preset login buttons for instant evaluation across Business Owner, Accountant, Admin, and Customer roles.');

  sectionTitle('Page 2 – Multi-Step Business Registration');
  bodyParagraph('• Route: /register | Backend: POST /api/auth/register');
  bodyParagraph('Features: Comprehensive business onboarding form collecting Full Name, Legal Company Name, Email, Phone, Business Address, State, Postal Code, and GSTIN. Enforces strict input validation and role assignments.');

  sectionTitle('Page 3 – Executive Financial Dashboard');
  bodyParagraph('• Route: /dashboard | Backend: GET /api/dashboard/stats');
  bodyParagraph('Features: 4 KPI summary cards (Total Revenue, Outstanding Receivables, Total Invoices, Overdue Accounts), interactive Recharts Monthly Revenue Trend chart, Recent Invoices table, and quick creation action pills.');

  sectionTitle('Page 4 – Customer Relationship Management (CRM)');
  bodyParagraph('• Route: /customers | Backend: GET /api/customers, POST /api/customers');
  bodyParagraph('Features: Client directory displaying Customer ID, Company Name, Contact Person, Email, Phone, City, GSTIN, and Outstanding Balance. Filterable by status (Active/Inactive), search by name or GSTIN.');

  sectionTitle('Page 5 – Customer Profile & Financial Ledger');
  bodyParagraph('• Route: /customers/:id or /customers/details | Backend: GET /api/customers/:id');
  bodyParagraph('Features: 360-degree client view displaying billing terms and an audited chronological financial ledger table detailing Opening Balance, Invoices (+), Payments (-), and Credit Notes (-) with real-time running balances.');

  sectionTitle('Page 6 – Products & Services Catalog');
  bodyParagraph('• Route: /products | Backend: GET /api/products, POST /api/products');
  bodyParagraph('Features: Item catalog supporting SKU codes, Category (Goods vs Services), Unit Price, HSN/SAC classification, and GST rate assignment (0%, 5%, 12%, 18%, 28%) with real-time stock and pricing edits.');

  sectionTitle('Page 7 – Dynamic Tax Invoice Generator');
  bodyParagraph('• Route: /invoices/create | Backend: POST /api/invoices');
  bodyParagraph('Features: Multi-line invoice creator with automated numbering (INV-YYYY-XXXX), customer selection, item lookups, automated CGST/SGST vs IGST calculation based on customer state, discounts, and payment terms.');

  // ==========================================
  // PAGE 5: DETAILED MODULES BREAKDOWN (PAGES 8-15)
  // ==========================================
  doc.addPage();
  drawHeaderBanner('4. Detailed Module Specifications (Part 2)', 'Implementation Details for Pages 8 through 15');

  sectionTitle('Page 8 – Invoice Details & Vector PDF Export');
  bodyParagraph('• Route: /invoices/:id | Backend: GET /api/invoices/:id, GET /api/invoices/:id/pdf');
  bodyParagraph('Features: Formal A4 invoice preview showing invoice status (Draft, Sent, Paid, Partially Paid, Overdue), itemized tax breakdown, payment settlement history, and instant browser download of a vector PDF.');

  sectionTitle('Page 9 – Payment Collections & Receipt Slips');
  bodyParagraph('• Route: /payments | Backend: GET /api/payments, POST /api/payments');
  bodyParagraph('Features: Record full or partial settlements against outstanding invoices with transaction references, payment method (Bank Transfer, UPI, Credit Card, Cheque, Cash), and immediate balance recalculation.');

  sectionTitle('Page 10 – Credit Notes Management');
  bodyParagraph('• Route: /credit-notes | Backend: GET /api/credit-notes, POST /api/credit-notes');
  bodyParagraph('Features: Issue credit adjustments linked to original invoices. Includes validation to prevent credit amounts exceeding outstanding balance, ledger updates, and downloadable credit note PDF generation.');

  sectionTitle('Page 11 – Reports & Analytics (4 Reporting Tabs)');
  bodyParagraph('• Route: /reports | Backend: GET /api/reports/*');
  bodyParagraph('Features: 1) Sales Invoice Report, 2) Outstanding Receivables Aging Report, 3) Tax Summary Report (CGST, SGST, IGST totals), and 4) Customer Transaction Ledger. Supports date filtering, CSV export, and PDF printing.');

  sectionTitle('Page 12 – Dedicated Client Self-Service Portal');
  bodyParagraph('• Route: /portal | Backend: GET /api/portal/*');
  bodyParagraph('Features: Client-scoped dashboard allowing customers to view their invoices, check outstanding balances, inspect payment history, and download statements without administrative access.');

  sectionTitle('Page 13 – User Management & Role-Based Access Control');
  bodyParagraph('• Route: /users | Backend: GET /api/users, POST /api/users');
  bodyParagraph('Features: Administrative user table, role assignment (Admin, Business Owner, Accountant, Customer), account status toggling (Active vs Suspended), and secure password reset workflows.');

  sectionTitle('Page 14 – Business Settings & Legal Compliance');
  bodyParagraph('• Route: /settings | Backend: GET /api/settings, PUT /api/settings');
  bodyParagraph('Features: Configure enterprise business branding, logo upload, registered GSTIN, invoice prefix, next numbering sequence, default tax slabs, and custom terms & conditions.');

  sectionTitle('Page 15 – User Profile & Account Security');
  bodyParagraph('• Route: /profile | Backend: GET /api/profile, PUT /api/profile');
  bodyParagraph('Features: Manage personal profile information, update profile picture, and change passwords with current password verification and bcrypt hashing.');

  // ==========================================
  // PAGE 6: DOCKER CONTAINERIZATION GUIDE
  // ==========================================
  doc.addPage();
  drawHeaderBanner('5. Docker & Containerization', 'Multi-Stage Builds, Nginx Reverse Proxy & Compose Orchestration');

  sectionTitle('5.1 Multi-Container Docker Architecture');
  bodyParagraph(
    'BillFlow is containerized into a cohesive three-service architecture managed via Docker Compose. The setup guarantees identical runtime environments across local development and production deployments.'
  );

  drawTable(
    ['Container Service', 'Base Docker Image', 'Build Strategy & Config', 'Port & Volume Bindings'],
    [
      ['billflow-mongodb', 'mongo:6-jammy', 'Official Jammy image with automated ping healthcheck', 'Host: 27018:27017 | Vol: billflow_mongodb_data'],
      ['billflow-backend', 'node:20-alpine', 'Alpine base, native build tools, production deps only', 'Host: 5000:5000 | Env: MONGO_URI, JWT_SECRET'],
      ['billflow-frontend', 'nginx:alpine', 'Multi-stage build (Stage 1 Vite -> Stage 2 Nginx)', 'Host: 80, 5173, 3000 -> Container Port 80'],
    ],
    [95, 100, 150, 150]
  );

  sectionTitle('5.2 Frontend Multi-Stage Build & Reverse Proxy');
  bodyParagraph(
    'The frontend Dockerfile utilizes a multi-stage compilation pattern. Stage 1 executes `npm run build` using Node 20 to generate optimized static chunks in `/app/dist`. Stage 2 copies these compiled assets into a minimal Nginx Alpine image, resulting in a compressed 26MB production image. Nginx is configured to handle SPA routing fallback (`try_files $uri /index.html`) and reverse proxy all `/api/*` HTTP requests directly to `http://backend:5000/api/`.'
  );

  sectionTitle('5.3 Essential Docker CLI Commands');
  bodyParagraph('Run the following commands in the workspace root:');
  bulletPoint('docker compose build', 'Compiles frontend Vite bundle and installs backend production dependencies.');
  bulletPoint('docker compose up -d', 'Starts MongoDB, Backend API, and Frontend Nginx in detached mode.');
  bulletPoint('docker compose ps', 'Verifies running containers, port bindings, and healthy status.');
  bulletPoint('docker compose logs -f', 'Streams live container execution logs across all services.');
  bulletPoint('docker compose down', 'Gracefully stops and terminates container instances.');

  // ==========================================
  // PAGE 7: KUBERNETES ORCHESTRATION GUIDE
  // ==========================================
  doc.addPage();
  drawHeaderBanner('6. Kubernetes (K8s) Orchestration', 'Declarative Manifests, Pods, Services, PVCs & Ingress');

  sectionTitle('6.1 Kubernetes Workload Topology');
  bodyParagraph(
    'The application is fully container-orchestrated using Kubernetes manifests located in the `k8s/` directory. All resources are encapsulated within a dedicated `billflow` namespace.'
  );

  drawTable(
    ['K8s Resource Type', 'Resource Name', 'Replicas / Spec', 'Purpose & Target Endpoints'],
    [
      ['Namespace', 'billflow', '1', 'Logical isolation boundary for all application workloads'],
      ['ConfigMap', 'billflow-config', 'N/A', 'Centralized config: PORT, NODE_ENV, MONGODB_URI'],
      ['Secret', 'billflow-secret', 'N/A', 'Opaque cryptographically secured JWT_SECRET'],
      ['PVC', 'mongodb-pvc', '1Gi (RWO)', 'Standard storage claim for database persistence'],
      ['Deployment', 'mongodb', '1 Replica', 'MongoDB 6 with TCP socket readiness/liveness probes'],
      ['Service', 'mongodb', 'ClusterIP', 'Internal cluster DNS discovery on port 27017'],
      ['Deployment', 'backend', '2 Replicas', 'Express REST API with HTTP /api/health probes'],
      ['Service', 'backend', 'NodePort (30500)', 'External NodePort access & internal ClusterIP'],
      ['Deployment', 'frontend', '2 Replicas', 'Nginx SPA containers with HTTP / health probes'],
      ['Service', 'frontend', 'NodePort (30080)', 'External NodePort access for web browser traffic'],
      ['Ingress', 'billflow-ingress', 'N/A', 'Routing rules forwarding / and /api/ to services'],
    ],
    [80, 100, 85, 230]
  );

  sectionTitle('6.2 Kubernetes Deployment Commands');
  bulletPoint('kubectl apply -k k8s/', 'Deploys all resources via Kustomize in a single declarative command.');
  bulletPoint('kubectl get all,pvc -n billflow', 'Displays status of all Pods, Services, Deployments, and PVCs.');
  bulletPoint('kubectl rollout status deployment backend -n billflow', 'Monitors zero-downtime rolling updates.');
  bulletPoint('kubectl logs -l app=backend -n billflow -f', 'Streams logs across all active backend replica pods.');
  bulletPoint('kubectl delete -k k8s/', 'Gracefully terminates and cleans up cluster workloads.');

  // ==========================================
  // PAGE 8: VERIFICATION, TESTING & CREDENTIALS
  // ==========================================
  doc.addPage();
  drawHeaderBanner('7. Verification, Testing & Quick Reference', 'End-to-End Validation, Port Matrix & Evaluation Presets');

  sectionTitle('7.1 Live Execution & Testing Results');
  bodyParagraph('All application layers have undergone automated and end-to-end integration testing:');

  bulletPoint('Health Check Endpoints', 'Backend HTTP probe at /api/health returns HTTP 200 with service uptime.');
  bulletPoint('Authentication & Registration', 'Verified user registration, bcrypt password hashing, and JWT token issuance.');
  bulletPoint('Database Operations', 'Verified Customer creation (CUST-001) and MongoDB persistence via PVC.');
  bulletPoint('Reverse Proxy Routing', 'Verified Nginx reverse proxy routes all /api/ endpoints to backend container.');
  bulletPoint('Kubernetes NodePort Access', 'Verified browser access at http://localhost:30080 and API at :30500.');

  sectionTitle('7.2 Pre-Configured Demo Credentials');
  drawTable(
    ['Role', 'Email Address', 'Password', 'Default Landing Route'],
    [
      ['Business Owner', 'owner@apexenterprises.com', 'Password123!', '/dashboard (Executive KPIs & Charts)'],
      ['Customer Portal', 'customer@globaltech.com', 'Password123!', '/portal (Client Invoices & Statement)'],
      ['System Admin', 'admin@platform.com', 'Password123!', '/users (User Management & Roles)'],
      ['Accountant', 'accountant@apexenterprises.com', 'Password123!', '/reports (Financial & Tax Ledgers)'],
    ],
    [95, 160, 100, 140]
  );

  sectionTitle('7.3 Port Matrix Quick Reference');
  drawTable(
    ['Service / Component', 'Local Dev Port', 'Docker Compose Port', 'Kubernetes NodePort'],
    [
      ['Frontend Web App', 'http://localhost:5173', 'http://localhost:80 (5173/3000)', 'http://localhost:30080'],
      ['Backend REST API', 'http://localhost:5000', 'http://localhost:5000', 'http://localhost:30500'],
      ['MongoDB Database', 'localhost:27017', 'localhost:27018', 'Internal ClusterIP :27017'],
    ],
    [130, 115, 125, 125]
  );

  // Global Page Numbering Footer
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    // Footer separator line
    doc.rect(50, 790, 495, 0.5).fill('#cbd5e1');
    doc.fillColor(TEXT_MUTED).fontSize(8).font('Helvetica').text(
      'BillFlow Enterprise Billing Platform — Comprehensive Technical Project Documentation',
      50,
      800,
      { width: 350 }
    );
    doc.text(`Page ${i + 1} of ${range.count}`, 400, 800, { align: 'right', width: 145 });
  }

  doc.end();

  writeStreamRoot.on('finish', () => {
    // Copy to frontend public docs
    fs.copyFileSync(rootOutputPath, frontendOutputPath);
    console.log(`[PDF Generator] Documentation PDF successfully created:`);
    console.log(` -> Root: ${rootOutputPath}`);
    console.log(` -> Frontend Public: ${frontendOutputPath}`);
  });
}

generateDocumentation();
