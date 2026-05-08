import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routersApi } from "@/services/api";
import { PageHeader, StatusBadge } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fmtDateTime } from "@/utils/formatters";

export const Route = createFileRoute("/_authenticated/routers/$id")({
  component: RouterDetail,
});

function RouterDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["router", id],
    queryFn: async () => (await routersApi.getOne(id)).data,
  });
  const r: any = data?.data || data || {};

  const reboot = useMutation({
    mutationFn: () => routersApi.reboot(id),
    onSuccess: () => toast.success("Reboot requested"),
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });
  const refresh = useMutation({
    mutationFn: () => routersApi.refresh(id),
    onSuccess: () => { toast.success("Refreshing parameters"); qc.invalidateQueries({ queryKey: ["router", id] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <PageHeader
        title={r.serial_number || "Router"}
        description={r.model || ""}
        actions={<>
          <Button variant="outline" onClick={() => refresh.mutate()}>Refresh Parameters</Button>
          <Button variant="destructive" onClick={() => reboot.mutate()}>Reboot</Button>
          <Button variant="ghost" onClick={() => navigate({ to: "/routers" })}>Back</Button>
        </>}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Connection</CardTitle></CardHeader>
          <CardContent><StatusBadge status={r.connection_status || r.status} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Manufacturer</CardTitle></CardHeader>
          <CardContent>{r.manufacturer || "-"}</CardContent></Card>
        <Card><CardHeader><CardTitle>Firmware</CardTitle></CardHeader>
          <CardContent>{r.firmware_version || r.firmware || "-"}</CardContent></Card>
        <Card><CardHeader><CardTitle>WAN IP</CardTitle></CardHeader>
          <CardContent>{r.wan_ip || "-"}</CardContent></Card>
        <Card><CardHeader><CardTitle>Last Contact</CardTitle></CardHeader>
          <CardContent>{fmtDateTime(r.last_contact)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Client</CardTitle></CardHeader>
          <CardContent>{r.client?.name || r.client_name || "-"}</CardContent></Card>
      </div>
    </div>
  );
}
