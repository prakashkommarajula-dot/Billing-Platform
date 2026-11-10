const rawBase = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = rawBase.replace(/\/+$/, '');

/**
 * Enhanced fetch client with auto Bearer token inclusion and JSON handling
 */
export async function apiFetch(endpoint, options = {}) {
  const token =
    localStorage.getItem('billflow_token') ||
    sessionStorage.getItem('billflow_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please ensure backend is running.');
    }
    throw error;
  }
}

export const authAPI = {
  getBusinesses: () => apiFetch('/auth/businesses'),

  login: (credentials) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getProfile: () => apiFetch('/auth/profile'),

  updateProfile: (profileData) =>
    apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  seedDemoUsers: () =>
    apiFetch('/auth/seed', {
      method: 'POST',
    }),
};

export const dashboardAPI = {
  getSummary: () => apiFetch('/dashboard/summary'),
};

export const customerAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/customers${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiFetch(`/customers/${id}`),
  create: (data) =>
    apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id, archiveOnly = false) =>
    apiFetch(`/customers/${id}${archiveOnly ? '?archiveOnly=true' : ''}`, {
      method: 'DELETE',
    }),
};

export const productAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/products${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiFetch(`/products/${id}`),
  create: (data) =>
    apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id, archiveOnly = false) =>
    apiFetch(`/products/${id}${archiveOnly ? '?archiveOnly=true' : ''}`, {
      method: 'DELETE',
    }),
};

export async function downloadInvoicePDF(invoiceId, invoiceNumber = 'INV') {
  const token =
    localStorage.getItem('billflow_token') ||
    sessionStorage.getItem('billflow_token');
  
  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to download PDF invoice');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}

export const invoiceAPI = {
  getNextNumber: () => apiFetch('/invoices/next-number'),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/invoices${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiFetch(`/invoices/${id}`),
  create: (data) =>
    apiFetch('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancel: (id, reason) =>
    apiFetch(`/invoices/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  delete: (id) =>
    apiFetch(`/invoices/${id}`, {
      method: 'DELETE',
    }),
  getPDF: (id) => apiFetch(`/invoices/${id}/pdf?format=json`),
  downloadPDF: (id, invoiceNumber) => downloadInvoicePDF(id, invoiceNumber),
  recordPayment: (id, data) =>
    apiFetch(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPayments: (id) => apiFetch(`/invoices/${id}/payments`),
  createCreditNote: (id, data) =>
    apiFetch(`/invoices/${id}/credit-notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const paymentAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/payments${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiFetch(`/payments/${id}`),
  getEligibleInvoices: () => apiFetch('/payments/eligible-invoices'),
  record: (data) =>
    apiFetch('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export async function downloadCreditNotePDF(creditNoteId, creditNoteNumber = 'CN') {
  const token =
    localStorage.getItem('billflow_token') ||
    sessionStorage.getItem('billflow_token');
  
  const response = await fetch(`${API_BASE_URL}/credit-notes/${creditNoteId}/pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to download Credit Note PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CreditNote-${creditNoteNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}

export const creditNoteAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/credit-notes${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiFetch(`/credit-notes/${id}`),
  getEligibleInvoices: () => apiFetch('/credit-notes/eligible-invoices'),
  create: (data) =>
    apiFetch('/credit-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  downloadPDF: (id, creditNoteNumber) => downloadCreditNotePDF(id, creditNoteNumber),
};

export const reportAPI = {
  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/reports/sales${query ? `?${query}` : ''}`);
  },
  getReceivables: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/reports/receivables${query ? `?${query}` : ''}`);
  },
  getTaxSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/reports/tax-summary${query ? `?${query}` : ''}`);
  },
  getCustomerLedger: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/reports/customer-ledger${query ? `?${query}` : ''}`);
  },
};

export const portalAPI = {
  payInvoice: (paymentData) =>
    apiFetch('/portal/pay', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/portal/summary${query ? `?${query}` : ''}`);
  },
  getInvoices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/portal/invoices${query ? `?${query}` : ''}`);
  },
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/portal/payments${query ? `?${query}` : ''}`);
  },
  getCreditNotes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/portal/credit-notes${query ? `?${query}` : ''}`);
  },
  getStatement: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/portal/statement${query ? `?${query}` : ''}`);
  },
  updateProfile: (data) =>
    apiFetch('/portal/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const userManagementAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/users${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiFetch(`/users/${id}`),
  create: (data) =>
    apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleStatus: (id) =>
    apiFetch(`/users/${id}/status`, {
      method: 'PUT',
    }),
  resetPassword: (id, newPassword) =>
    apiFetch(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
  delete: (id) =>
    apiFetch(`/users/${id}`, {
      method: 'DELETE',
    }),
};

export const settingsAPI = {
  getSettings: () => apiFetch('/settings'),
  updateSettings: (data) =>
    apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadLogo: (logo) =>
    apiFetch('/settings/logo', {
      method: 'POST',
      body: JSON.stringify({ logo }),
    }),
};

export const profileAPI = {
  getProfile: () => apiFetch('/profile'),
  updateProfile: (data) =>
    apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  changePassword: (currentPassword, newPassword) =>
    apiFetch('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  updateAvatar: (avatar) =>
    apiFetch('/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatar }),
    }),
};
