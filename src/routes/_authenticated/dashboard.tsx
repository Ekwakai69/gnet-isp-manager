import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboard } from "@/services/api";
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

function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await dashboard.get()).data,
  });

  if (isLoading) return <div className="text-muted-foreground">Loading dashboard...</div>;
  if (error)
    return <div className="text-destructive">Failed to load dashboard.</div>;

  const stats = data?.stats || data || {};
  const revenueTrend = data?.revenueTrend || data?.revenue_trend || [];
  const topPackages = data?.topPackages || data?.top_packages || [];
  const recentPayments = data?.recentPayments || data?.recent_payments || [];

  const cards = [
    { label: "Total Clients", value: stats.totalClients ?? stats.total_clients ?? 0 },
    { label: "Active Clients", value: stats.activeClients ?? stats.active_clients ?? 0 },
    { label: "Revenue Today", value: fmtKES(stats.revenueToday ?? stats.revenue_today ?? 0) },
    { label: "Revenue This Month", value: fmtKES(stats.revenueMonth ?? stats.revenue_month ?? 0) },
    { label: "Expiring Soon", value: stats.expiringSoon ?? stats.expiring_soon ?? 0 },
    { label: "Open Tickets", value: stats.openTickets ?? stats.open_tickets ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
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
                    <td className="py-2">{p.client_name || p.client?.name || "-"}</td>
                    <td>{fmtKES(p.amount)}</td>
                    <td>{p.method || "-"}</td>
                    <td>{p.created_at ? new Date(p.created_at).toLocaleString() : "-"}</td>
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
