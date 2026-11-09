# Deploying BillFlow on Render (Step-by-Step Guide)

This guide provides end-to-end instructions for deploying the **BillFlow Enterprise Billing Platform** onto [Render](https://render.com) with high availability and zero cost on Render's Free Tier.

---

## 🚀 Quick Summary of Methods

| Deployment Method | Ease | Number of Services | Recommended For |
| :--- | :--- | :--- | :--- |
| **Method 1: Render Blueprint (`render.yaml`)** | ⭐⭐⭐⭐⭐ (1-Click) | 1 Unified Service | **Fastest & Easiest** (Automated IaC) |
| **Method 2: Manual Web Service** | ⭐⭐⭐⭐ (Simple) | 1 Unified Service | Full manual control over settings |
| **Method 3: Decoupled Services** | ⭐⭐⭐ (Advanced) | 2 Services (Web + Static) | Large scale distributed teams |

---

## 📋 Prerequisites

1. A free account on [Render](https://render.com).
2. A free MongoDB database from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (instructions below).
3. Access to your GitHub repository: [`https://github.com/prakashkommarajula-dot/Billing-Platform.git`](https://github.com/prakashkommarajula-dot/Billing-Platform.git).

---

## 🗄️ Step 0: Free MongoDB Atlas Database Setup (2 Minutes)

Since Render's free tier provides stateless compute, use MongoDB's official free cloud database (M0 Cluster):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Click **Create a Deployment** -> Select **M0 Free Tier** (AWS / any region).
3. Under **Database Access**, create a database user:
   - Username: `billflow_admin`
   - Password: `YourSecurePassword123!`
4. Under **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** -> Confirm.
5. In your cluster dashboard, click **Connect** -> **Drivers (Node.js)**:
   - Copy the connection string:
     ```text
     mongodb+srv://billflow_admin:YourSecurePassword123!@cluster0.abcde.mongodb.net/invoice_billing_platform?retryWrites=true&w=majority
     ```
   *(Keep this connection URI ready for Step 1).*

---

## ⚡ Method 1: 1-Click Deployment with Render Blueprint (Recommended)

The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint specification.

1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click the **New +** button in the top right corner and select **Blueprint**.
3. Connect your GitHub repository: `prakashkommarajula-dot/Billing-Platform`.
4. Render will automatically detect `render.yaml` and show:
   - **Service Name:** `billflow-billing-platform`
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, locate `MONGODB_URI` and paste your MongoDB Atlas connection string from Step 0.
6. Click **Apply**.
7. Render will automatically build the React Vite frontend, package the Express backend, run database migrations, and launch your live application!

Your live app will be accessible at:
```text
https://billflow-billing-platform.onrender.com
```

---

## 🛠️ Method 2: Manual Web Service Deployment

If you prefer to configure the service manually through Render's UI:

1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Select your repository: `prakashkommarajula-dot/Billing-Platform` (Branch: `main`).
3. Fill in the following settings:
   - **Name:** `billflow-billing-platform`
   - **Region:** Any (e.g. `Oregon (US West)` or `Frankfurt (EU Central)`)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank for repository root)*
   - **Runtime:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. Click **Advanced** -> **Add Environment Variable**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables optimized production mode |
   | `PORT` | `10000` | Port assigned by Render |
   | `JWT_SECRET` | `super_secret_jwt_key_billing_platform_render_2026` | Random secure string |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI |
5. Click **Create Web Service**.
6. Wait 1-2 minutes for the build to finish. Once you see `Server running in production mode`, your site is live!

---

## 🌐 Method 3: Decoupled Services (Separate Backend & Frontend)

If you prefer running the Frontend as a Render Static Site and Backend as a separate Web Service:

### 1. Deploy the Backend Web Service:
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Environment Variables:**
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: `mongodb+srv://...`
  - `JWT_SECRET`: `your_jwt_secret`
- **Resulting Backend URL:** `https://billflow-backend.onrender.com`

### 2. Deploy the Frontend Static Site:
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:**
  - `VITE_API_URL`: `https://billflow-backend.onrender.com/api`
- **Redirects/Rewrites (Under Settings):**
  - **Type:** `Rewrite`
  - **Source:** `/*`
  - **Destination:** `/index.html`

---

## ✅ Post-Deployment Verification

Once your service is deployed, test the following endpoints:

1. **Frontend Landing & Login:**
   ```text
   https://<your-render-url>.onrender.com/login
   ```
2. **Backend API Health Check:**
   ```text
   https://<your-render-url>.onrender.com/api/health
   ```
   *(Expected response: `{"status":"healthy","uptime":...}`)*
3. **Download Project Documentation PDF:**
   ```text
   https://<your-render-url>.onrender.com/docs/BillFlow_Comprehensive_Project_Documentation.pdf
   ```

---

## 🔑 Pre-Configured Demo Credentials

Use the 1-click preset login buttons on the login screen, or sign in with:

| Role | Email | Password | Landing Route |
| :--- | :--- | :--- | :--- |
| **Business Owner** | `owner@apexenterprises.com` | `Password123!` | `/dashboard` |
| **Customer** | `customer@globaltech.com` | `Password123!` | `/portal` |
| **Admin** | `admin@platform.com` | `Password123!` | `/users` |
| **Accountant** | `accountant@apexenterprises.com` | `Password123!` | `/reports` |
