import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { mikrotik } from "@/services/api";
import { PageHeader, StatusBadge } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mikrotik/status")({
  component: MikroTikStatus,
});

function MikroTikStatus() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["mikrotik-status"],
    queryFn: async () => (await mikrotik.getStatus()).data,
  });
  const s: any = data?.data || data || {};
  const sync = useMutation({
    mutationFn: () => mikrotik.syncAll(),
    onSuccess: () => { toast.success("Sync started"); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <div>
      <PageHeader title="MikroTik Status" actions={
        <>
          <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
          <Button onClick={() => sync.mutate()}>Sync All</Button>
        </>
      } />
      {isLoading ? <div>Loading...</div> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card><CardHeader><CardTitle>Connection</CardTitle></CardHeader>
            <CardContent><StatusBadge status={s.connected ? "online" : "offline"} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Hostname</CardTitle></CardHeader>
            <CardContent>{s.hostname || s.identity || "-"}</CardContent></Card>
          <Card><CardHeader><CardTitle>Version</CardTitle></CardHeader>
            <CardContent>{s.version || "-"}</CardContent></Card>
          <Card><CardHeader><CardTitle>Uptime</CardTitle></CardHeader>
            <CardContent>{s.uptime || "-"}</CardContent></Card>
          <Card><CardHeader><CardTitle>CPU</CardTitle></CardHeader>
            <CardContent>{s.cpu_load !== undefined ? `${s.cpu_load}%` : "-"}</CardContent></Card>
          <Card><CardHeader><CardTitle>PPPoE Active</CardTitle></CardHeader>
            <CardContent>{s.active_users ?? s.pppoe?.active ?? "-"}</CardContent></Card>
        </div>
      )}
    </div>
  );
}
