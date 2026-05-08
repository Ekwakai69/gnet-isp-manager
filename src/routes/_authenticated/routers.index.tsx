import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { routersApi } from "@/services/api";
import { PageHeader, DataTable, StatusBadge } from "@/components/DataTable";
import { fmtDateTime } from "@/utils/formatters";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/routers/")({
  component: RoutersList,
});

function RoutersList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["routers", status],
    queryFn: async () => (await routersApi.getAll({ status })).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  return (
    <div>
      <PageHeader title="Routers (TR-069)" />
      <div className="mb-3">
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>
      <DataTable
        isLoading={isLoading}
        rows={rows}
        onRowClick={(r: any) => navigate({ to: "/routers/$id", params: { id: String(r.id) } })}
        columns={[
          { key: "serial", label: "Serial #", render: (r: any) => r.serial_number || r.serial },
          { key: "model", label: "Model" },
          { key: "client", label: "Client", render: (r: any) => r.client?.name || r.client_name || "-" },
          { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.connection_status || r.status} /> },
          { key: "last", label: "Last contact", render: (r: any) => fmtDateTime(r.last_contact) },
        ]}
      />
    </div>
  );
}
