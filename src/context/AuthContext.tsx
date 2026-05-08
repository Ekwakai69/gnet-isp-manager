import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth as authApi } from "@/services/api";

export type Role =
  | "super_admin"
  | "admin"
  | "sales_rep"
  | "customer_service"
  | "technician";

export interface User {
  id: string;
  name?: string;
  email: string;
  role: Role;
  isp_id?: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  can: (perm: Permission) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export type Permission =
  | "manage_isps"
  | "manage_users"
  | "create_clients"
  | "edit_clients"
  | "view_clients"
  | "send_invoices"
  | "process_payments"
  | "view_payments"
  | "manage_packages"
  | "create_tickets"
  | "view_tickets"
  | "resolve_tickets"
  | "manage_access_codes"
  | "view_mikrotik"
  | "manage_ip_pools"
  | "kick_sessions"
  | "manage_expenses"
  | "send_sms"
  | "manage_sms_templates"
  | "manage_routers"
  | "settings";

const PERMS: Record<Role, Permission[]> = {
  super_admin: [
    "manage_isps", "manage_users", "create_clients", "edit_clients", "view_clients",
    "send_invoices", "process_payments", "view_payments", "manage_packages",
    "create_tickets", "view_tickets", "resolve_tickets", "manage_access_codes",
    "view_mikrotik", "manage_ip_pools", "kick_sessions", "manage_expenses",
    "send_sms", "manage_sms_templates", "manage_routers", "settings",
  ],
  admin: [
    "manage_users", "create_clients", "edit_clients", "view_clients",
    "send_invoices", "process_payments", "view_payments", "manage_packages",
    "create_tickets", "view_tickets", "resolve_tickets", "manage_access_codes",
    "view_mikrotik", "manage_ip_pools", "kick_sessions", "manage_expenses",
    "send_sms", "manage_sms_templates", "manage_routers", "settings",
  ],
  sales_rep: [
    "create_clients", "view_clients", "send_invoices", "process_payments",
    "view_payments", "create_tickets", "view_tickets", "manage_access_codes",
    "send_sms",
  ],
  customer_service: [
    "view_clients", "view_payments", "create_tickets", "view_tickets", "send_sms",
  ],
  technician: [
    "create_tickets", "view_tickets", "resolve_tickets", "view_mikrotik",
    "manage_ip_pools", "kick_sessions", "manage_routers",
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t) setToken(t);
    if (u) {
      try { setUser(JSON.parse(u)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    const t = data.token || data.access_token;
    const u = data.user || data;
    if (!t) throw new Error("No token returned");
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  const hasRole = (...roles: Role[]) => !!user && roles.includes(user.role);
  const can = (perm: Permission) =>
    !!user && (PERMS[user.role] || []).includes(perm);

  return (
    <Ctx.Provider value={{ user, token, loading, login, logout, hasRole, can }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
