import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetails from './pages/Customers/CustomerDetails';
import ProductList from './pages/Products/ProductList';
import InvoiceList from './pages/Invoices/InvoiceList';
import CreateInvoice from './pages/Invoices/CreateInvoice';
import InvoiceDetails from './pages/Invoices/InvoiceDetails';
import PaymentList from './pages/Payments/PaymentList';
import CreditNoteList from './pages/CreditNotes/CreditNoteList';
import Reports from './pages/Reports/Reports';
import CustomerPortal from './pages/Portal/CustomerPortal';
import UserList from './pages/Users/UserList';
import BusinessSettings from './pages/Settings/BusinessSettings';
import UserProfile from './pages/Profile/UserProfile';
import PlaceholderPage from './pages/PlaceholderPage';

export function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        }
      />

      {/* Protected Application Routes with Fixed Sidebar & Top Navbar */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Page 3: Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Page 4: Customer Management */}
        <Route path="/customers" element={<CustomerList />} />

        {/* Customer Details & Ledger */}
        <Route path="/customers/details" element={<CustomerDetails />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />

        {/* Products and Services */}
        <Route path="/products" element={<ProductList />} />

        {/* Invoice Management */}
        <Route path="/invoices" element={<InvoiceList />} />

        {/* Page 7: Create Invoice */}
        <Route path="/invoices/create" element={<CreateInvoice />} />

        {/* Page 8: Invoice Details and PDF Preview */}
        <Route path="/invoices/details" element={<InvoiceDetails />} />
        <Route path="/invoices/:id" element={<InvoiceDetails />} />

        {/* Page 9: Payment Management */}
        <Route path="/payments" element={<PaymentList />} />

        {/* Page 10: Credit Notes */}
        <Route path="/credit-notes" element={<CreditNoteList />} />

        {/* Page 11: Reports & Analytics */}
        <Route path="/reports" element={<Reports />} />

        {/* Page 12: Customer Portal */}
        <Route path="/portal" element={<CustomerPortal />} />

        {/* Page 13: User Management */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserList />
            </ProtectedRoute>
          }
        />

        {/* Page 14: Business Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Business Owner']}>
              <BusinessSettings />
            </ProtectedRoute>
          }
        />

        {/* Page 15: User Profile */}
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
