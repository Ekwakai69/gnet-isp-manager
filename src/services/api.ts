import axios from "axios";

const API_BASE =
  (typeof window !== "undefined" && (window as any).__API_URL__) ||
  "https://invoicingbackend.gnet.co.ke/api";

// Root (no /api prefix) — used for public /pay/:token endpoints
const ROOT_BASE = API_BASE.replace(/\/api\/?$/, "");

export const api = axios.create({ baseURL: API_BASE });
export const rootApi = axios.create({ baseURL: ROOT_BASE });

const attachToken = (config: any) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};
api.interceptors.request.use(attachToken);

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

// ---------- Auth ----------
export const auth = {
  login: (data: any) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// ---------- Dashboard ----------
export const dashboard = {
  get: () => api.get("/dashboard"),
  stats: () => api.get("/dashboard/stats"),
  aiRevenue: () => api.get("/dashboard/ai-revenue"),
};

// ---------- Clients ----------
export const clients = {
  getAll: (params?: any) => api.get("/clients", { params }),
  getOne: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post("/clients", data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  activate: (id: string, data: any) => api.post(`/clients/${id}/activate`, data),
  activateCash: (id: string, data: any) => api.post(`/clients/${id}/activate-cash`, data),
  activateMpesaManual: (id: string, data: any) =>
    api.post(`/clients/${id}/activate-mpesa-manual`, data),
  disable: (id: string) => api.post(`/clients/${id}/disable`),
  toggle: (id: string) => api.post(`/clients/${id}/toggle`),
  modifyExpiry: (id: string, data: any) => api.post(`/clients/${id}/modify-expiry`, data),
  sendInvoice: (id: string, data: any) => api.post(`/clients/${id}/send-invoice`, data),
  // CPE / live
  getRouters: (id: string) => api.get(`/clients/${id}/routers`),
  registerRouter: (id: string, data: any) => api.post(`/clients/${id}/routers`, data),
  getConnection: (id: string) => api.get(`/clients/${id}/connection`),
  ping: (id: string) => api.post(`/clients/${id}/ping`),
  disconnect: (id: string) => api.post(`/clients/${id}/disconnect`),
  speedTest: (id: string) => api.post(`/clients/${id}/speed-test`),
  getQueue: (id: string) => api.get(`/clients/${id}/queue`),
  setQueue: (id: string, data: any) => api.post(`/clients/${id}/queue`, data),
  removeQueue: (id: string) => api.delete(`/clients/${id}/queue`),
  addAddressList: (id: string, data: any) => api.post(`/clients/${id}/address-list`, data),
  removeAddressList: (id: string) => api.delete(`/clients/${id}/address-list`),
  ipHistory: (id: string) => api.get(`/clients/${id}/ip-history`),
};

// ---------- Invoices ----------
export const invoices = {
  getAll: (params?: any) => api.get("/invoices", { params }),
  pay: (id: string, data: any) => api.post(`/invoices/${id}/pay`, data),
  resendEmail: (id: string) => api.post(`/invoices/${id}/resend-email`),
  getPDF: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: "blob" }),
  bulkPDF: (data: any) => api.post("/invoices/bulk-pdf", data, { responseType: "blob" }),
  // Public payment (mounted at root, not /api)
  getByToken: (token: string) => rootApi.get(`/pay/${token}`),
  payByToken: (token: string, data: any) => rootApi.post(`/pay/${token}/stk`, data),
};

// ---------- Packages ----------
export const packagesApi = {
  getAll: () => api.get("/packages"),
  create: (data: any) => api.post("/packages", data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  archive: (id: string) => api.post(`/packages/${id}/archive`),
  syncMikrotik: (id: string) => api.post(`/packages/${id}/sync-mikrotik`),
  syncAllMikrotik: () => api.post("/packages/sync-all-mikrotik"),
};

// ---------- Hotspot ----------
export const hotspotPackages = {
  getPublic: () => api.get("/hotspot/packages"),
  getAll: () => api.get("/hotspot/packages/admin"),
  create: (data: any) => api.post("/hotspot/packages", data),
  delete: (id: string) => api.delete(`/hotspot/packages/${id}`),
};

// ---------- Payments ----------
export const payments = {
  getAll: (params?: any) => api.get("/payments", { params }),
  initiateSTK: (data: any) => api.post("/payments/mpesa", data),
  c2bRegister: () => api.post("/mpesa/c2b/register"),
  c2bSimulate: (data: any) => api.post("/mpesa/c2b/simulate", data),
};

// ---------- Tickets ----------
export const tickets = {
  getAll: (params?: any) => api.get("/tickets", { params }),
  getOne: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post("/tickets", data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  reply: (id: string, data: any) => api.post(`/tickets/${id}/reply`, data),
};

// ---------- Access Codes / Vouchers ----------
export const accessCodes = {
  getAll: (params?: any) => api.get("/access-codes", { params }),
  generate: (data: any) => api.post("/access-codes/generate", data),
  delete: (id: string) => api.delete(`/access-codes/${id}`),
};

// ---------- SMS ----------
export const sms = {
  getTemplates: () => api.get("/sms/templates"),
  createTemplate: (data: any) => api.post("/sms/templates", data),
  updateTemplate: (id: string, data: any) => api.put(`/sms/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/sms/templates/${id}`),
  getLocations: () => api.get("/sms/locations"),
  send: (data: any) => api.post("/sms/send", data),
  sendBulk: (data: any) => api.post("/sms/bulk", data),
};

// ---------- Expenses ----------
export const expenses = {
  getAll: (params?: any) => api.get("/expenses", { params }),
  create: (data: any) => api.post("/expenses", data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// ---------- MikroTik ----------
export const mikrotik = {
  getStatus: () => api.get("/mikrotik/status"),
  syncAll: () => api.post("/mikrotik/sync"),
  getSessions: () => api.get("/mikrotik/sessions"),
  kickSession: (sessionId: string) => api.post(`/mikrotik/kick/${sessionId}`),
  getIPPools: () => api.get("/mikrotik/ip-pools"),
  createIPPool: (data: any) => api.post("/mikrotik/ip-pools", data),
  autoSetupIPs: () => api.post("/mikrotik/auto-setup-ips"),
  getPPPoEUsers: () => api.get("/mikrotik/pppoe/users"),
  importUsers: () => api.post("/mikrotik/import-users"),
  fixPasswords: () => api.post("/mikrotik/fix-passwords"),
  validateProfiles: () => api.post("/mikrotik/profiles/validate"),
  getProfiles: () => api.get("/mikrotik/profiles"),
  getOrphanedProfiles: () => api.get("/mikrotik/profiles/orphaned"),
  cleanupProfiles: () => api.post("/mikrotik/profiles/cleanup"),
  getSystemLogs: (params?: any) => api.get("/mikrotik/logs/system", { params }),
  getPPPoESessions: () => api.get("/mikrotik/logs/pppoe-sessions"),
  getHotspotSessions: () => api.get("/mikrotik/logs/hotspot-sessions"),
  getPPPoEHistory: (params?: any) => api.get("/mikrotik/logs/pppoe-history", { params }),
  disconnect: (data: any) => api.post("/mikrotik/logs/disconnect", data),
};

// ---------- Routers (CPE) ----------
export const routersApi = {
  getAll: (params?: any) => api.get("/routers", { params }),
  getOne: (id: string) => api.get(`/routers/${id}`),
  update: (id: string, data: any) => api.put(`/routers/${id}`, data),
  delete: (id: string) => api.delete(`/routers/${id}`),
};

// ---------- TR-069 / GenieACS ----------
export const acs = {
  getStatus: () => api.get("/acs/status"),
  getDevices: () => api.get("/acs/devices"),
  getDevice: (id: string) => api.get(`/acs/devices/${id}`),
  link: (clientId: string, data: any) => api.post(`/clients/${clientId}/acs/link`, data),
  unlink: (clientId: string) => api.delete(`/clients/${clientId}/acs/link`),
  info: (clientId: string) => api.get(`/clients/${clientId}/acs/info`),
  getWifi: (clientId: string) => api.get(`/clients/${clientId}/acs/wifi`),
  setWifi: (clientId: string, data: any) => api.put(`/clients/${clientId}/acs/wifi`, data),
  getParams: (clientId: string) => api.get(`/clients/${clientId}/acs/params`),
  setParams: (clientId: string, data: any) => api.put(`/clients/${clientId}/acs/params`, data),
  reboot: (clientId: string) => api.post(`/clients/${clientId}/acs/reboot`),
  factoryReset: (clientId: string) => api.post(`/clients/${clientId}/acs/factory-reset`),
  firmware: (clientId: string, data: any) => api.post(`/clients/${clientId}/acs/firmware`, data),
  batchReboot: (data: any) => api.post("/acs/batch/reboot", data),
};

// ---------- NetPoints ----------
export const netpoints = {
  getAll: () => api.get("/netpoints"),
  getOne: (clientId: string) => api.get(`/netpoints/${clientId}`),
  redeem: (clientId: string, data: any) => api.post(`/netpoints/${clientId}/redeem`, data),
};

// ---------- Settings & Users ----------
export const settingsApi = {
  get: () => api.get("/settings"),
  update: (data: any) => api.put("/settings", data),
};

export const users = {
  getAll: () => api.get("/users"),
  create: (data: any) => api.post("/users", data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// ---------- Super Admin ----------
export const superAdmin = {
  getISPs: () => api.get("/super-admin/isps"),
  createISP: (data: any) => api.post("/super-admin/isps", data),
  updateISP: (id: string, data: any) => api.put(`/super-admin/isps/${id}`, data),
  deleteISP: (id: string) => api.delete(`/super-admin/isps/${id}`),
};
