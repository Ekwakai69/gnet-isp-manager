import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mikrotik } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mikrotik/pppoe-sessions")({
  component: PPPoESessions,
});

function PPPoESessions() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["pppoe-sessions"],
    queryFn: async () => (await mikrotik.getSessions()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  const kick = useMutation({
    mutationFn: (id: string) => mikrotik.kickSession(id),
    onSuccess: () => { toast.success("Session kicked"); qc.invalidateQueries({ queryKey: ["pppoe-sessions"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <div>
      <PageHeader title="Active PPPoE Sessions" />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "username", label: "Username", render: (r: any) => r.user || r.username },
          { key: "address", label: "IP", render: (r: any) => r.address || r.ip },
          { key: "uptime", label: "Uptime" },
          { key: "client", label: "Client", render: (r: any) => r.client?.name || r.client_name || "-" },
          { key: "actions", label: "", render: (r: any) => <Button size="sm" variant="destructive" onClick={() => kick.mutate(r.id || r[".id"] || r.session_id)}>Kick</Button> },
        ]}
      />
    </div>
  );
}
