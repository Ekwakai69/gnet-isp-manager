import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboard, clients, invoices, payments, tickets } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtKES } from "@/utils/formatters";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

// Pull a value from many possible keys / nested shapes
const pick = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = k.split(".").reduce((a: any, p) => (a == null ? a : a[p]), obj);
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
};

const asArray = (d: any): any[] => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items)) return d.items;
  for (const k of Object.keys(d || {})) if (Array.isArray(d[k])) return d[k];
  return [];
};

const isActive = (c: any) => {
  const s = String(pick(c, "status", "state", "account_status") || "").toLowerCase();
  if (s) return ["active", "online", "enabled", "connected"].includes(s);
  return pick(c, "is_active", "active") === true;
};

const expiryOf = (c: any) =>
  pick(c, "expiry_date", "expires_at", "expiry", "expiration", "next_due_date");

const amountOf = (p: any) =>
  Number(pick(p, "amount", "amount_paid", "total", "value") || 0);

const dateOf = (p: any) =>
  pick(p, "created_at", "paid_at", "date", "timestamp", "createdAt");

function DashboardPage() {
  const { user } = useAuth();

  const dashQ = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try { return (await dashboard.get()).data; } catch { return null; }
    },
  });
  const clientsQ = useQuery({
    queryKey: ["clients-all"],
    queryFn: async () => (await clients.getAll({ per_page: 1000 })).data,
  });
  const invoicesQ = useQuery({
    queryKey: ["invoices-all"],
    queryFn: async () => {
      try { return (await invoices.getAll({ per_page: 1000 })).data; } catch { return null; }
    },
  });
  const paymentsQ = useQuery({
    queryKey: ["payments-all"],
    queryFn: async () => {
      try { return (await payments.getAll({ per_page: 1000 })).data; } catch { return null; }
    },
  });
  const ticketsQ = useQuery({
    queryKey: ["tickets-all"],
    queryFn: async () => {
      try { return (await tickets.getAll({ per_page: 1000 })).data; } catch { return null; }
    },
  });

  const isLoading = dashQ.isLoading || clientsQ.isLoading;

  const dashStats = (dashQ.data?.stats || dashQ.data || {}) as any;
  const clientList = asArray(clientsQ.data);
  const invoiceList = asArray(invoicesQ.data);
  const paymentList = asArray(paymentsQ.data);
  const ticketList = asArray(ticketsQ.data);

  // Compute fallbacks
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const in7days = now.getTime() + 7 * 24 * 3600 * 1000;

  const computed = {
    totalClients: clientList.length,
    activeClients: clientList.filter(isActive).length,
    revenueToday: paymentList
      .filter((p) => { const d = new Date(dateOf(p) || 0).getTime(); return d >= startOfDay; })
      .reduce((s, p) => s + amountOf(p), 0),
    revenueMonth: paymentList
      .filter((p) => { const d = new Date(dateOf(p) || 0).getTime(); return d >= startOfMonth; })
      .reduce((s, p) => s + amountOf(p), 0),
    expiringSoon: clientList.filter((c) => {
      const e = expiryOf(c); if (!e) return false;
      const t = new Date(e).getTime();
      return t >= now.getTime() && t <= in7days;
    }).length,
    openTickets: ticketList.filter((t) => {
      const s = String(pick(t, "status") || "").toLowerCase();
      return s && !["closed", "resolved", "done"].includes(s);
    }).length,
    unpaidInvoices: invoiceList.filter((i) => {
      const s = String(pick(i, "status") || "").toLowerCase();
      return ["unpaid", "pending", "overdue"].includes(s);
    }).length,
  };

  const v = (apiKey: string[], computedVal: number) => {
    const got = pick(dashStats, ...apiKey);
    return got !== undefined ? got : computedVal;
  };

  const cards = [
    { label: "Total Clients", value: v(["totalClients", "total_clients", "clients_count"], computed.totalClients) },
    { label: "Active Clients", value: v(["activeClients", "active_clients"], computed.activeClients) },
    { label: "Revenue Today", value: fmtKES(v(["revenueToday", "revenue_today", "today_revenue"], computed.revenueToday) as number) },
    { label: "Revenue This Month", value: fmtKES(v(["revenueMonth", "revenue_month", "monthly_revenue"], computed.revenueMonth) as number) },
    { label: "Expiring Soon", value: v(["expiringSoon", "expiring_soon"], computed.expiringSoon) },
    { label: "Open Tickets", value: v(["openTickets", "open_tickets"], computed.openTickets) },
    { label: "Unpaid Invoices", value: v(["unpaidInvoices", "unpaid_invoices", "pending_invoices"], computed.unpaidInvoices) },
    { label: "Total Payments", value: paymentList.length },
  ];

  // Revenue trend (last 14 days from payments)
  const trendMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  paymentList.forEach((p) => {
    const d = dateOf(p); if (!d) return;
    const k = new Date(d).toISOString().slice(0, 10);
    if (trendMap.has(k)) trendMap.set(k, (trendMap.get(k) || 0) + amountOf(p));
  });
  const revenueTrend =
    dashQ.data?.revenueTrend || dashQ.data?.revenue_trend ||
    Array.from(trendMap, ([date, amount]) => ({ date: date.slice(5), amount }));

  // Top packages from clients
  const pkgCounts = new Map<string, number>();
  clientList.forEach((c) => {
    const name = pick(c, "package.name", "package_name", "plan", "subscription") || "Unknown";
    pkgCounts.set(String(name), (pkgCounts.get(String(name)) || 0) + 1);
  });
  const topPackages =
    dashQ.data?.topPackages || dashQ.data?.top_packages ||
    Array.from(pkgCounts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);

  const recentPayments =
    dashQ.data?.recentPayments || dashQ.data?.recent_payments ||
    [...paymentList].sort((a, b) =>
      new Date(dateOf(b) || 0).getTime() - new Date(dateOf(a) || 0).getTime()
    ).slice(0, 8);

  if (isLoading) return <div className="text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{user?.name ? `, ${user.name}` : user?.email ? `, ${user.email}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue Trend (14 days)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Packages</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPackages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-2">Client</th><th>Amount</th><th>Method</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No recent payments.</td></tr>
                )}
                {recentPayments.map((p: any, i: number) => (
                  <tr key={p.id || i} className="border-t">
                    <td className="py-2">{pick(p, "client_name", "client.name", "customer_name", "name") || "-"}</td>
                    <td>{fmtKES(amountOf(p))}</td>
                    <td>{pick(p, "method", "payment_method", "channel") || "-"}</td>
                    <td>{dateOf(p) ? new Date(dateOf(p)).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
