import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth, type Role } from "@/context/AuthContext";
import {
  LayoutDashboard, Users, Package, Ticket, FileText, Wallet,
  KeyRound, MessageSquare, TrendingDown, Server, Router as RouterIcon,
  Settings as Cog, Building2, ChevronDown, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  path?: string;
  icon?: any;
  children?: MenuItem[];
}

const MENUS: Record<Role, MenuItem[]> = {
  super_admin: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "ISPs", path: "/super-admin/isps", icon: Building2 },
  ],
  admin: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Clients", path: "/clients", icon: Users },
    { label: "Packages", path: "/packages", icon: Package },
    { label: "Hotspot Packages", path: "/hotspot-packages", icon: Ticket },
    { label: "Invoices", path: "/invoices", icon: FileText },
    { label: "Payments", path: "/payments", icon: Wallet },
    { label: "Access Codes", path: "/access-codes", icon: KeyRound },
    { label: "Tickets", path: "/tickets", icon: Ticket },
    { label: "Expenses", path: "/expenses", icon: TrendingDown },
    { label: "SMS", path: "/sms/templates", icon: MessageSquare },
    {
      label: "MikroTik", icon: Server, children: [
        { label: "Status", path: "/mikrotik/status" },
        { label: "PPPoE Sessions", path: "/mikrotik/pppoe-sessions" },
        { label: "Hotspot Sessions", path: "/mikrotik/hotspot-sessions" },
        { label: "IP Pools", path: "/mikrotik/ip-pools" },
        { label: "System Logs", path: "/mikrotik/logs" },
      ],
    },
    { label: "Routers", path: "/routers", icon: RouterIcon },
    { label: "Settings", path: "/settings", icon: Cog },
  ],
  sales_rep: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Clients", path: "/clients", icon: Users },
    { label: "Tickets", path: "/tickets", icon: Ticket },
    { label: "Access Codes", path: "/access-codes", icon: KeyRound },
  ],
  customer_service: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Clients", path: "/clients", icon: Users },
    { label: "Tickets", path: "/tickets", icon: Ticket },
    { label: "SMS", path: "/sms/templates", icon: MessageSquare },
  ],
  technician: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Tickets", path: "/tickets", icon: Ticket },
    {
      label: "MikroTik", icon: Server, children: [
        { label: "Status", path: "/mikrotik/status" },
        { label: "PPPoE Sessions", path: "/mikrotik/pppoe-sessions" },
        { label: "Hotspot Sessions", path: "/mikrotik/hotspot-sessions" },
        { label: "IP Pools", path: "/mikrotik/ip-pools" },
        { label: "System Logs", path: "/mikrotik/logs" },
      ],
    },
    { label: "Routers", path: "/routers", icon: RouterIcon },
  ],
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = user ? MENUS[user.role] || [] : [];

  return (
    <nav className="flex-1 overflow-y-auto py-3">
      <ul className="space-y-1 px-2">
        {items.map((item) =>
          item.children ? (
            <Group key={item.label} item={item} currentPath={path} onNavigate={onNavigate} />
          ) : (
            <li key={item.path}>
              <Link
                to={item.path!}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  path === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}

function Group({
  item,
  currentPath,
  onNavigate,
}: {
  item: MenuItem;
  currentPath: string;
  onNavigate?: () => void;
}) {
  const containsActive = item.children?.some((c) => c.path === currentPath);
  const [open, setOpen] = useState(!!containsActive);
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          containsActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent"
        )}
      >
        {item.icon && <item.icon className="h-4 w-4" />}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <ul className="ml-7 mt-1 space-y-1">
          {item.children!.map((c) => (
            <li key={c.path}>
              <Link
                to={c.path!}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm",
                  currentPath === c.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
