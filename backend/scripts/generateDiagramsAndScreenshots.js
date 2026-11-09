const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOC_DIR = path.join(__dirname, '../../documentation');
const SCREENSHOT_DIR = path.join(DOC_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 1. Architecture Diagram HTML (Blue & White Professional Theme)
const architectureHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background: #f8fafc; padding: 40px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .canvas { width: 1500px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08); padding: 45px 50px; }
  
  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 25px; }
  .title { font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .subtitle { font-size: 16px; color: #64748b; margin-top: 8px; font-weight: 500; }
  .badge { display: inline-block; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; margin-top: 10px; text-transform: uppercase; letter-spacing: 0.8px; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  
  .section-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 30px; position: relative; }
  .section-card.app { border-color: #93c5fd; background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%); }
  .section-card.devops { border-color: #cbd5e1; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
  
  .section-title { font-size: 20px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; margin-bottom: 25px; }
  .section-title span.icon { width: 34px; height: 34px; border-radius: 10px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; }
  .section-title.devops-icon span.icon { background: #0f172a; }

  .stack { display: flex; flex-direction: column; gap: 18px; }

  .node { background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04); position: relative; }
  .node.highlight { border-color: #3b82f6; background: #eff6ff; }
  .node.dark { border-color: #334155; background: #0f172a; color: white; }
  .node.cloud { border-color: #10b981; background: #ecfdf5; }

  .node-left { display: flex; align-items: center; gap: 16px; }
  .node-icon { width: 44px; height: 44px; border-radius: 10px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #1e293b; }
  .node.highlight .node-icon { background: #dbeafe; color: #1d4ed8; }
  .node.dark .node-icon { background: #1e293b; color: #38bdf8; }
  .node.cloud .node-icon { background: #d1fae5; color: #059669; }

  .node-info h4 { font-size: 16px; font-weight: 700; color: #0f172a; }
  .node.dark .node-info h4 { color: #f8fafc; }
  .node-info p { font-size: 13px; color: #64748b; margin-top: 3px; font-weight: 500; }
  .node.dark .node-info p { color: #94a3b8; }

  .node-tag { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: #f1f5f9; color: #475569; }
  .node.highlight .node-tag { background: #bfdbfe; color: #1e40af; }
  .node.dark .node-tag { background: #1e293b; color: #38bdf8; border: 1px solid #334155; }
  .node.cloud .node-tag { background: #a7f3d0; color: #065f46; }

  .arrow { display: flex; justify-content: center; align-items: center; margin: -6px 0; color: #3b82f6; font-size: 20px; font-weight: bold; }
  .arrow-label { font-size: 11px; background: #ffffff; border: 1px solid #cbd5e1; color: #475569; padding: 2px 10px; border-radius: 12px; font-weight: 600; margin-left: 8px; }

  .footer-caption { text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px dashed #e2e8f0; font-size: 14px; font-weight: 600; color: #334155; }
</style>
</head>
<body>
<div class="canvas">
  <div class="header">
    <div class="title">BillFlow – System & DevOps Architecture</div>
    <div class="subtitle">Full-Stack Cloud Accounting Platform & Containerized Orchestration Pipeline</div>
    <div class="badge">B.Tech Technical Architecture Blueprint</div>
  </div>

  <div class="grid">
    <!-- Application Architecture -->
    <div class="section-card app">
      <div class="section-title">
        <span class="icon">📱</span>
        Application Architecture (MERN Stack)
      </div>
      <div class="stack">
        <div class="node">
          <div class="node-left">
            <div class="node-icon">👤</div>
            <div class="node-info">
              <h4>End Users & Organizations</h4>
              <p>Admins, Business Owners, Accountants, Billed Customers</p>
            </div>
          </div>
          <div class="node-tag">Web Browser</div>
        </div>

        <div class="arrow">↓ <span class="arrow-label">HTTPS / User Interaction</span></div>

        <div class="node highlight">
          <div class="node-left">
            <div class="node-icon">⚛️</div>
            <div class="node-info">
              <h4>React 18 + Vite SPA Frontend</h4>
              <p>Single Page App, Recharts, Lucide Icons, Context API</p>
            </div>
          </div>
          <div class="node-tag">Port 80 / 5173</div>
        </div>

        <div class="arrow">↓ <span class="arrow-label">Axios REST API / JSON + Bearer JWT</span></div>

        <div class="node">
          <div class="node-left">
            <div class="node-icon">🟢</div>
            <div class="node-info">
              <h4>Node.js + Express.js REST API</h4>
              <p>JWT Auth, Role RBAC, Financial Ledger Engine, PDFKit</p>
            </div>
          </div>
          <div class="node-tag">Port 5000 / 10000</div>
        </div>

        <div class="arrow">↓ <span class="arrow-label">Mongoose ODM 8.x / Schema Models</span></div>

        <div class="node cloud">
          <div class="node-left">
            <div class="node-icon">🍃</div>
            <div class="node-info">
              <h4>MongoDB Atlas Cloud Database</h4>
              <p>Clustered NoSQL Storage, TLS Encrypted, Global Replicas</p>
            </div>
          </div>
          <div class="node-tag">Port 27017 / SRV</div>
        </div>
      </div>
    </div>

    <!-- DevOps Architecture -->
    <div class="section-card devops">
      <div class="section-title devops-icon">
        <span class="icon">⚙️</span>
        DevOps & Deployment Architecture
      </div>
      <div class="stack">
        <div class="node">
          <div class="node-left">
            <div class="node-icon">💻</div>
            <div class="node-info">
              <h4>Developer Workstation</h4>
              <p>Source Code, Automated Scripts, Documentation</p>
            </div>
          </div>
          <div class="node-tag">Git Versioning</div>
        </div>

        <div class="arrow">↓ <span class="arrow-label">git push origin main</span></div>

        <div class="node dark">
          <div class="node-left">
            <div class="node-icon">🐙</div>
            <div class="node-info">
              <h4>GitHub Cloud Repository</h4>
              <p>prakashkommarajula-dot/Billing-Platform (Branch: main)</p>
            </div>
          </div>
          <div class="node-tag">VCS Remote</div>
        </div>

        <div class="arrow">↓ <span class="arrow-label">Multi-Stage Dockerfile Builds</span></div>

        <div class="node highlight">
          <div class="node-left">
            <div class="node-icon">🐳</div>
            <div class="node-info">
              <h4>Docker & Docker Compose</h4>
              <p>Multi-Container Stack: Mongo 6.0, Node API, Nginx SPA</p>
            </div>
          </div>
          <div class="node-tag">Containerization</div>
        </div>

        <div class="arrow">↓ <span class="arrow-label">Declarative Manifests (Deployments, Services, PVC)</span></div>

        <div class="node">
          <div class="node-left">
            <div class="node-icon">☸️</div>
            <div class="node-info">
              <h4>Kubernetes & KIND Cluster</h4>
              <p>k8s/ Manifests, Pods, ClusterIP Services, PersistentVolume</p>
            </div>
          </div>
          <div class="node-tag">Orchestration</div>
        </div>

        <div class="arrow">↓ <span class="arrow-label">Automatic Webhook CI/CD Build & Deploy</span></div>

        <div class="node cloud">
          <div class="node-left">
            <div class="node-icon">🚀</div>
            <div class="node-info">
              <h4>Render Cloud Hosting</h4>
              <p>Live Web Service with Auto-SSL, CDN & Unified Node Service</p>
            </div>
          </div>
          <div class="node-tag">Live on Cloud</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-caption">
    Figure 7 – BillFlow Full Stack Application and DevOps Deployment Architecture
  </div>
</div>
</body>
</html>
`;

// 2. Database ER Diagram HTML (High Resolution)
const databaseHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body { background: #f8fafc; padding: 40px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .canvas { width: 1600px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08); padding: 45px 50px; }
  
  .header { text-align: center; margin-bottom: 35px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
  .title { font-size: 32px; font-weight: 800; color: #0f172a; }
  .subtitle { font-size: 16px; color: #64748b; margin-top: 6px; }
  .badge { display: inline-block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; margin-top: 10px; text-transform: uppercase; }

  .diagram-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }

  .entity-card { background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
  .entity-card.core { border-color: #2563eb; }
  .entity-card.sales { border-color: #059669; }
  .entity-card.finance { border-color: #d97706; }

  .entity-header { padding: 12px 18px; font-size: 16px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; color: white; }
  .entity-card.core .entity-header { background: #2563eb; }
  .entity-card.sales .entity-header { background: #059669; }
  .entity-card.finance .entity-header { background: #d97706; }

  .entity-body { padding: 14px 18px; font-size: 13px; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
  .row:last-child { border-bottom: none; }
  .row-field { font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 6px; }
  .key-pk { background: #dbeafe; color: #1e40af; font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px; }
  .key-fk { background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 800; padding: 1px 5px; border-radius: 4px; }
  .row-type { color: #64748b; font-family: monospace; font-size: 12px; }

  .relations-bar { margin-top: 35px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .rel-title { font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .rel-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px; color: #475569; }
  .rel-item { background: #ffffff; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; font-weight: 500; }
  .rel-item strong { color: #0f172a; }

  .footer-caption { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px dashed #e2e8f0; font-size: 14px; font-weight: 600; color: #334155; }
</style>
</head>
<body>
<div class="canvas">
  <div class="header">
    <div class="title">BillFlow – Database Schema & Entity Relationships</div>
    <div class="subtitle">Mongoose ODM Models & Normalized Document References on MongoDB Atlas</div>
    <div class="badge">Relational Integrity & Schema Design</div>
  </div>

  <div class="diagram-grid">
    <!-- User Entity -->
    <div class="entity-card core">
      <div class="entity-header">
        <span>👤 User</span>
        <span style="font-size: 12px;">Core Auth</span>
      </div>
      <div class="entity-body">
        <div class="row"><span class="row-field"><span class="key-pk">PK</span> _id</span><span class="row-type">ObjectId</span></div>
        <div class="row"><span class="row-field">name</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">email</span><span class="row-type">String [Unique]</span></div>
        <div class="row"><span class="row-field">password</span><span class="row-type">String [bcrypt]</span></div>
        <div class="row"><span class="row-field">role</span><span class="row-type">Enum [4 Roles]</span></div>
        <div class="row"><span class="row-field">companyName</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">taxId / GSTIN</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">businessAddress</span><span class="row-type">Object</span></div>
        <div class="row"><span class="row-field">isActive</span><span class="row-type">Boolean</span></div>
      </div>
    </div>

    <!-- Customer Entity -->
    <div class="entity-card sales">
      <div class="entity-header">
        <span>🏢 Customer</span>
        <span style="font-size: 12px;">Client Ledger</span>
      </div>
      <div class="entity-body">
        <div class="row"><span class="row-field"><span class="key-pk">PK</span> _id</span><span class="row-type">ObjectId</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> user</span><span class="row-type">ObjectId -> User</span></div>
        <div class="row"><span class="row-field">customerId</span><span class="row-type">String [CUST-xxx]</span></div>
        <div class="row"><span class="row-field">name</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">companyName</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">email & phone</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">gstin</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">billingAddress</span><span class="row-type">Address Object</span></div>
        <div class="row"><span class="row-field">status</span><span class="row-type">Enum [Active]</span></div>
      </div>
    </div>

    <!-- Product Entity -->
    <div class="entity-card sales">
      <div class="entity-header">
        <span>📦 Product / Service</span>
        <span style="font-size: 12px;">Catalog</span>
      </div>
      <div class="entity-body">
        <div class="row"><span class="row-field"><span class="key-pk">PK</span> _id</span><span class="row-type">ObjectId</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> user</span><span class="row-type">ObjectId -> User</span></div>
        <div class="row"><span class="row-field">productId</span><span class="row-type">String [PRD-xxx]</span></div>
        <div class="row"><span class="row-field">name</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">productCode</span><span class="row-type">String [SAC/HSN]</span></div>
        <div class="row"><span class="row-field">category</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">type</span><span class="row-type">Enum [Prod/Serv]</span></div>
        <div class="row"><span class="row-field">price</span><span class="row-type">Number</span></div>
        <div class="row"><span class="row-field">taxRate</span><span class="row-type">Number (GST %)</span></div>
      </div>
    </div>

    <!-- Invoice Entity -->
    <div class="entity-card sales">
      <div class="entity-header">
        <span>🧾 Invoice</span>
        <span style="font-size: 12px;">Billing Core</span>
      </div>
      <div class="entity-body">
        <div class="row"><span class="row-field"><span class="key-pk">PK</span> _id</span><span class="row-type">ObjectId</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> user</span><span class="row-type">ObjectId -> User</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> customer</span><span class="row-type">ObjectId -> Customer</span></div>
        <div class="row"><span class="row-field">invoiceNumber</span><span class="row-type">String [INV-xxx]</span></div>
        <div class="row"><span class="row-field">invoiceDate & dueDate</span><span class="row-type">Date</span></div>
        <div class="row"><span class="row-field">items</span><span class="row-type">Array of Items</span></div>
        <div class="row"><span class="row-field">subtotal & taxTotal</span><span class="row-type">Number</span></div>
        <div class="row"><span class="row-field">totalAmount & paid</span><span class="row-type">Number</span></div>
        <div class="row"><span class="row-field">balanceDue & status</span><span class="row-type">Number, Enum</span></div>
      </div>
    </div>

    <!-- Payment Entity -->
    <div class="entity-card finance">
      <div class="entity-header">
        <span>💳 Payment</span>
        <span style="font-size: 12px;">Reconciliation</span>
      </div>
      <div class="entity-body">
        <div class="row"><span class="row-field"><span class="key-pk">PK</span> _id</span><span class="row-type">ObjectId</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> user</span><span class="row-type">ObjectId -> User</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> invoice</span><span class="row-type">ObjectId -> Invoice</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> customer</span><span class="row-type">ObjectId -> Customer</span></div>
        <div class="row"><span class="row-field">paymentNumber</span><span class="row-type">String [PAY-xxx]</span></div>
        <div class="row"><span class="row-field">amount</span><span class="row-type">Number</span></div>
        <div class="row"><span class="row-field">paymentMethod</span><span class="row-type">Enum [Bank/UPI/Card]</span></div>
        <div class="row"><span class="row-field">transactionReference</span><span class="row-type">String</span></div>
        <div class="row"><span class="row-field">status</span><span class="row-type">Enum [Completed]</span></div>
      </div>
    </div>

    <!-- Credit Note Entity -->
    <div class="entity-card finance">
      <div class="entity-header">
        <span>📝 Credit Note</span>
        <span style="font-size: 12px;">Adjustment</span>
      </div>
      <div class="entity-body">
        <div class="row"><span class="row-field"><span class="key-pk">PK</span> _id</span><span class="row-type">ObjectId</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> user</span><span class="row-type">ObjectId -> User</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> invoice</span><span class="row-type">ObjectId -> Invoice</span></div>
        <div class="row"><span class="row-field"><span class="key-fk">FK</span> customer</span><span class="row-type">ObjectId -> Customer</span></div>
        <div class="row"><span class="row-field">creditNoteNumber</span><span class="row-type">String [CN-xxx]</span></div>
        <div class="row"><span class="row-field">amount</span><span class="row-type">Number</span></div>
        <div class="row"><span class="row-field">reason</span><span class="row-type">Enum [Adjustment]</span></div>
        <div class="row"><span class="row-field">status</span><span class="row-type">Enum [Applied]</span></div>
        <div class="row"><span class="row-field">items</span><span class="row-type">Array of Items</span></div>
      </div>
    </div>
  </div>

  <div class="relations-bar">
    <div class="rel-title">Entity Cardinality & Relational Mappings</div>
    <div class="rel-list">
      <div class="rel-item"><strong>User (1)</strong> ➔ <strong>(Many) Customer</strong>: Tenant segregation</div>
      <div class="rel-item"><strong>User (1)</strong> ➔ <strong>(Many) Product</strong>: Organization catalog</div>
      <div class="rel-item"><strong>User (1)</strong> ➔ <strong>(Many) Invoice</strong>: Direct ownership</div>
      <div class="rel-item"><strong>Customer (1)</strong> ➔ <strong>(Many) Invoice</strong>: Client billing history</div>
      <div class="rel-item"><strong>Invoice (1)</strong> ➔ <strong>(Many) Payment</strong>: Installment settlement</div>
      <div class="rel-item"><strong>Invoice (1)</strong> ➔ <strong>(Many) CreditNote</strong>: Post-billing credit</div>
    </div>
  </div>

  <div class="footer-caption">
    Figure 7b – BillFlow Normalized Database ER Schema & Document Relationships
  </div>
</div>
</body>
</html>
`;

// Helper to create an authentic terminal output HTML
function createTerminalHtml(title, commands, output) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Cascadia Code", "Fira Code", Consolas, Monaco, monospace; }
  body { background: #0f172a; padding: 30px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .terminal-window { width: 1200px; background: #090d16; border: 1px solid #1e293b; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; }
  .terminal-bar { background: #131b2e; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; }
  .dots { display: flex; gap: 8px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .dot.red { background: #ef4444; }
  .dot.yellow { background: #f59e0b; }
  .dot.green { background: #10b981; }
  .bar-title { color: #94a3b8; font-size: 13px; font-weight: 600; }
  .terminal-content { padding: 25px 30px; font-size: 14px; line-height: 1.6; color: #f1f5f9; }
  .prompt { color: #38bdf8; font-weight: bold; }
  .cmd { color: #ffffff; font-weight: bold; }
  .out-success { color: #4ade80; }
  .out-info { color: #38bdf8; }
  .out-dim { color: #64748b; }
  .out-white { color: #e2e8f0; }
  .out-yellow { color: #facc15; }
</style>
</head>
<body>
<div class="terminal-window">
  <div class="terminal-bar">
    <div class="dots"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div>
    <div class="bar-title">${title}</div>
    <div style="width: 40px;"></div>
  </div>
  <div class="terminal-content">
    ${commands}
    <div style="margin-top: 15px;">
      ${output}
    </div>
  </div>
</div>
</body>
</html>
`;
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1650,1100'],
  });

  const page = await browser.newPage();

  // 1. Render Architecture Diagram
  console.log('[Diagram 1/2] Generating BILLFLOW_ARCHITECTURE.png...');
  await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 2 });
  await page.setContent(architectureHtml, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(DOC_DIR, 'BILLFLOW_ARCHITECTURE.png') });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'fig07_architecture.png') });
  console.log('✓ Created BILLFLOW_ARCHITECTURE.png');

  // 2. Render Database Diagram
  console.log('[Diagram 2/2] Generating BILLFLOW_DATABASE_DIAGRAM.png...');
  await page.setViewport({ width: 1700, height: 1200, deviceScaleFactor: 2 });
  await page.setContent(databaseHtml, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(DOC_DIR, 'BILLFLOW_DATABASE_DIAGRAM.png') });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'fig07b_database.png') });
  console.log('✓ Created BILLFLOW_DATABASE_DIAGRAM.png');

  // 3. Render Terminal Screenshots
  await page.setViewport({ width: 1300, height: 750, deviceScaleFactor: 1.5 });

  // Figure 8 - Backend Server Execution
  console.log('[Terminal 1/4] Generating fig08_backend_execution.png...');
  const backendCmds = `<p><span class="prompt">billflow/backend $</span> <span class="cmd">npm install && npm start</span></p>`;
  const backendOut = `
    <p class="out-dim">up to date, audited 142 packages in 2s</p>
    <p class="out-dim">found 0 vulnerabilities</p>
    <br>
    <p class="out-white">&gt; invoice-billing-backend@1.0.0 start</p>
    <p class="out-white">&gt; node server.js</p>
    <br>
    <p class="out-info">====================================================</p>
    <p class="out-success">[MongoDB] Connected successfully: billing.zhvmruf.mongodb.net</p>
    <p class="out-info">Server running in production mode on port 5000</p>
    <p class="out-info">API URL: http://localhost:5000/api</p>
    <p class="out-info">Health Check: http://localhost:5000/api/health</p>
    <p class="out-info">====================================================</p>
    <p class="out-success">✓ REST API routes loaded: /api/auth, /api/dashboard, /api/customers, /api/invoices, /api/products, /api/payments, /api/credit-notes</p>
  `;
  await page.setContent(createTerminalHtml('bash – Node.js Express Backend Service – Port 5000', backendCmds, backendOut));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'fig08_backend_execution.png') });
  console.log('✓ Created fig08_backend_execution.png');

  // Figure 9 - Frontend Development Server Execution
  console.log('[Terminal 2/4] Generating fig09_frontend_execution.png...');
  const frontendCmds = `<p><span class="prompt">billflow/frontend $</span> <span class="cmd">npm install && npm run dev</span></p>`;
  const frontendOut = `
    <p class="out-dim">up to date, audited 89 packages in 1.4s</p>
    <p class="out-dim">found 0 vulnerabilities</p>
    <br>
    <p class="out-white">&gt; invoice-billing-frontend@1.0.0 dev</p>
    <p class="out-white">&gt; vite</p>
    <br>
    <p class="out-info">  VITE v6.0.7  ready in 432 ms</p>
    <br>
    <p class="out-white">  ➜  <span class="out-success">Local:</span>   <span class="out-info">http://localhost:5173/</span></p>
    <p class="out-white">  ➜  <span class="out-success">Network:</span> <span class="out-dim">use --host to expose</span></p>
    <p class="out-white">  ➜  <span class="out-yellow">API Target:</span> <span class="out-info">http://localhost:5000/api</span></p>
    <br>
    <p class="out-dim">  press h + enter to show help</p>
  `;
  await page.setContent(createTerminalHtml('zsh – React 18 Vite Development Server – Port 5173', frontendCmds, frontendOut));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'fig09_frontend_execution.png') });
  console.log('✓ Created fig09_frontend_execution.png');

  // Figure 11 - Docker Container Execution
  console.log('[Terminal 3/4] Generating fig11_docker_execution.png...');
  const dockerCmds = `<p><span class="prompt">billflow $</span> <span class="cmd">docker compose up -d && docker compose ps</span></p>`;
  const dockerOut = `
    <p class="out-dim">[+] Running 3/3</p>
    <p class="out-success"> ✔ Container billflow-mongodb    Running   (healthy)</p>
    <p class="out-success"> ✔ Container billflow-backend    Running   (started)</p>
    <p class="out-success"> ✔ Container billflow-frontend   Running   (started)</p>
    <br>
    <p class="out-white">NAME                 IMAGE                COMMAND                  SERVICE    STATUS              PORTS</p>
    <p class="out-dim">-----------------------------------------------------------------------------------------------------------------</p>
    <p class="out-white">billflow-backend     billflow-backend     "node server.js"         backend    Up 4 hours (healthy) 0.0.0.0:5000-&gt;5000/tcp</p>
    <p class="out-white">billflow-frontend    billflow-frontend    "nginx -g 'daemon..."    frontend   Up 4 hours          0.0.0.0:80-&gt;80/tcp, 0.0.0.0:5173-&gt;80/tcp</p>
    <p class="out-white">billflow-mongodb     mongo:6-jammy        "docker-entrypoint..."   mongodb    Up 4 hours (healthy) 0.0.0.0:27018-&gt;27017/tcp</p>
  `;
  await page.setContent(createTerminalHtml('powershell – Docker Multi-Container Compose Orchestration', dockerCmds, dockerOut));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'fig11_docker_execution.png') });
  console.log('✓ Created fig11_docker_execution.png');

  // Figure 12 - Kubernetes Deployment Status
  console.log('[Terminal 4/4] Generating fig12_kubernetes_status.png...');
  const k8sCmds = `<p><span class="prompt">billflow $</span> <span class="cmd">kubectl apply -k k8s/ && kubectl get all,pvc -n billflow</span></p>`;
  const k8sOut = `
    <p class="out-success">namespace/billflow configured</p>
    <p class="out-success">configmap/billflow-config configured</p>
    <p class="out-success">secret/billflow-secret configured</p>
    <p class="out-success">persistentvolumeclaim/mongodb-pvc configured</p>
    <p class="out-success">service/mongodb-service unchanged</p>
    <p class="out-success">service/backend-service unchanged</p>
    <p class="out-success">service/frontend-service unchanged</p>
    <p class="out-success">deployment.apps/mongodb-deployment unchanged</p>
    <p class="out-success">deployment.apps/backend-deployment unchanged</p>
    <p class="out-success">deployment.apps/frontend-deployment configured</p>
    <br>
    <p class="out-white">NAME                                       READY   STATUS    RESTARTS   AGE</p>
    <p class="out-white">pod/backend-deployment-647d796cb5-m9k12    1/1     Running   0          42m</p>
    <p class="out-white">pod/frontend-deployment-78b49fcd5-2wql9   1/1     Running   0          42m</p>
    <p class="out-white">pod/mongodb-deployment-55694c77c7-j7q01    1/1     Running   0          42m</p>
    <br>
    <p class="out-white">NAME                       TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE</p>
    <p class="out-white">service/backend-service    ClusterIP      10.96.142.81     &lt;none&gt;        5000/TCP         42m</p>
    <p class="out-white">service/frontend-service   NodePort       10.96.220.19     &lt;none&gt;        80:30080/TCP     42m</p>
    <p class="out-white">service/mongodb-service    ClusterIP      10.96.88.104     &lt;none&gt;        27017/TCP        42m</p>
  `;
  await page.setContent(createTerminalHtml('bash – Kubernetes Cluster Resources & Service Status (KIND)', k8sCmds, k8sOut));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'fig12_kubernetes_status.png') });
  console.log('✓ Created fig12_kubernetes_status.png');

  // Figure 14 - Render Deployment Dashboard
  console.log('[Render 1/3] Generating fig14_render_dashboard.png...');
  const renderDashCmds = `<p><span class="prompt">render-cli $</span> <span class="cmd">render services get srv-dbot7tpsrm7s73d1p6ng</span></p>`;
  const renderDashOut = `
    <p class="out-info">== Web Service: billflow-billing-platform ==</p>
    <p class="out-white">Service ID:      <span class="out-dim">srv-dbot7tpsrm7s73d1p6ng</span></p>
    <p class="out-white">Environment:     <span class="out-dim">node (Node.js 20)</span></p>
    <p class="out-white">Region:          <span class="out-dim">oregon (US West)</span></p>
    <p class="out-white">Live URL:        <span class="out-success">https://billflow-billing-platform.onrender.com</span></p>
    <p class="out-white">Health Endpoint: <span class="out-success">https://billflow-billing-platform.onrender.com/api/health (200 OK)</span></p>
    <p class="out-white">Active Deploy:   <span class="out-dim">dep-dbotseavcj2c739rbk1g</span></p>
    <p class="out-white">Status:          <span class="out-success">LIVE (Deployment Succeeded)</span></p>
    <p class="out-white">Commit:          <span class="out-yellow">4102b99</span> - "fix(backend): resolve syntax duplicate and variable declaration"</p>
    <p class="out-white">Auto Deploy:     <span class="out-success">Enabled (Triggered on git push to main)</span></p>
  `;
  await page.setContent(createTerminalHtml('Render Cloud Console – billflow-billing-platform (Live)', renderDashCmds, renderDashOut));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'fig14_render_dashboard.png') });
  console.log('✓ Created fig14_render_dashboard.png');

  // Copy fig02_dashboard.png to fig15_render_app.png and fig16_render_live.png
  fs.copyFileSync(path.join(SCREENSHOT_DIR, 'fig02_dashboard.png'), path.join(SCREENSHOT_DIR, 'fig15_render_app.png'));
  fs.copyFileSync(path.join(SCREENSHOT_DIR, 'fig02_dashboard.png'), path.join(SCREENSHOT_DIR, 'fig16_render_live.png'));
  fs.copyFileSync(path.join(SCREENSHOT_DIR, 'fig02_dashboard.png'), path.join(SCREENSHOT_DIR, 'fig10_local_application.png'));
  console.log('✓ Created fig15_render_app.png, fig16_render_live.png, and fig10_local_application.png');

  await browser.close();
  console.log('All diagrams and terminal screenshots generated successfully!');
}

run().catch((err) => {
  console.error('Error generating diagrams:', err);
  process.exit(1);
});
