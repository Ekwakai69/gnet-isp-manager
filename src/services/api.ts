import axios from "axios";

const baseURL =
  (typeof window !== "undefined" && (window as any).__API_URL__) ||
  "https://invoicingbackend.gnet.co.ke/api";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (
      err?.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/pay/")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ---- endpoints ----
export const auth = {
  login: (data: any) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const dashboard = {
  get: () => api.get("/dashboard"),
  aiRevenue: () => api.get("/dashboard/ai-revenue"),
};

export const clients = {
  getAll: (params?: any) => api.get("/clients", { params }),
  getOne: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post("/clients", data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  disable: (id: string) => api.post(`/clients/${id}/disable`),
  toggle: (id: string) => api.post(`/clients/${id}/toggle`),
  activateCash: (id: string, data: any) => api.post(`/clients/${id}/activate-cash`, data),
  activateMpesaManual: (id: string, data: any) =>
    api.post(`/clients/${id}/activate-mpesa-manual`, data),
  sendInvoice: (id: string, data: any) => api.post(`/clients/${id}/send-invoice`, data),
  modifyExpiry: (id: string, data: any) => api.post(`/clients/${id}/modify-expiry`, data),
};

export const invoices = {
  getAll: (params?: any) => api.get("/invoices", { params }),
  pay: (id: string, data: any) => api.post(`/invoices/${id}/pay`, data),
  resendEmail: (id: string) => api.post(`/invoices/${id}/resend-email`),
  getPDF: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: "blob" }),
  getByToken: (token: string) => api.get(`/invoices/public/${token}`),
  payByToken: (token: string, data: any) => api.post(`/invoices/public/${token}/pay`, data),
};

export const packagesApi = {
  getAll: () => api.get("/packages"),
  create: (data: any) => api.post("/packages", data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  archive: (id: string) => api.post(`/packages/${id}/archive`),
  syncMikrotik: (id: string) => api.post(`/packages/${id}/sync-mikrotik`),
  syncAllMikrotik: () => api.post("/packages/sync-all-mikrotik"),
};

export const hotspotPackages = {
  getAll: () => api.get("/hotspot/packages/admin"),
  create: (data: any) => api.post("/hotspot/packages", data),
  delete: (id: string) => api.delete(`/hotspot/packages/${id}`),
};

export const payments = {
  getAll: (params?: any) => api.get("/payments", { params }),
  initiateSTK: (data: any) => api.post("/payments/mpesa", data),
};

export const tickets = {
  getAll: (params?: any) => api.get("/tickets", { params }),
  getOne: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post("/tickets", data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  reply: (id: string, data: any) => api.post(`/tickets/${id}/reply`, data),
};

export const accessCodes = {
  getAll: (params?: any) => api.get("/access-codes", { params }),
  generate: (data: any) => api.post("/access-codes/generate", data),
  delete: (id: string) => api.delete(`/access-codes/${id}`),
};

export const sms = {
  getTemplates: () => api.get("/sms/templates"),
  createTemplate: (data: any) => api.post("/sms/templates", data),
  updateTemplate: (id: string, data: any) => api.put(`/sms/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/sms/templates/${id}`),
  getLocations: () => api.get("/sms/locations"),
  send: (data: any) => api.post("/sms/send", data),
  sendBulk: (data: any) => api.post("/sms/bulk", data),
};

export const expenses = {
  getAll: (params?: any) => api.get("/expenses", { params }),
  create: (data: any) => api.post("/expenses", data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const mikrotik = {
  getStatus: () => api.get("/mikrotik/status"),
  getSessions: () => api.get("/mikrotik/sessions"),
  kickSession: (sessionId: string) => api.post(`/mikrotik/kick/${sessionId}`),
  getHotspotSessions: () => api.get("/mikrotik/logs/hotspot-sessions"),
  getSystemLogs: (params?: any) => api.get("/mikrotik/logs/system", { params }),
  getPPPoEHistory: (params?: any) => api.get("/mikrotik/logs/pppoe-history", { params }),
  getIPPools: () => api.get("/mikrotik/ip-pools"),
  createIPPool: (data: any) => api.post("/mikrotik/ip-pools", data),
  autoSetupIPs: () => api.post("/mikrotik/auto-setup-ips"),
  syncAll: () => api.post("/mikrotik/sync"),
};

export const routersApi = {
  getAll: (params?: any) => api.get("/routers", { params }),
  getOne: (id: string) => api.get(`/routers/${id}`),
  getStatus: (id: string) => api.get(`/routers/${id}/status`),
  reboot: (id: string) => api.post(`/routers/${id}/reboot`),
  refresh: (id: string) => api.post(`/routers/${id}/refresh`),
  getWanIp: (id: string) => api.get(`/routers/${id}/wan-ip`),
  getDeviceInfo: (id: string) => api.get(`/routers/${id}/device-info`),
  delete: (id: string) => api.delete(`/routers/${id}`),
};

export const settingsApi = {
  get: () => api.get("/settings"),
  update: (data: any) => api.put("/settings", data),
};

export const superAdmin = {
  getISPs: () => api.get("/super-admin/isps"),
  createISP: (data: any) => api.post("/super-admin/isps", data),
  updateISP: (id: string, data: any) => api.put(`/super-admin/isps/${id}`, data),
  deleteISP: (id: string) => api.delete(`/super-admin/isps/${id}`),
};
