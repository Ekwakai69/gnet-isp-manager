import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { tickets } from "@/services/api";
import { PageHeader, DataTable, StatusBadge } from "@/components/DataTable";
import { fmtDateTime } from "@/utils/formatters";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/tickets/")({
  component: TicketsList,
});

function TicketsList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["tickets", status],
    queryFn: async () => (await tickets.getAll({ status })).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  return (
    <div>
      <PageHeader title="Tickets" />
      <div className="mb-3">
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <DataTable
        isLoading={isLoading}
        rows={rows}
        onRowClick={(r: any) => navigate({ to: "/tickets/$id", params: { id: String(r.id) } })}
        columns={[
          { key: "number", label: "Ticket #", render: (r: any) => r.number || r.id },
          { key: "client", label: "Client", render: (r: any) => r.client?.name || r.client_name || "-" },
          { key: "subject", label: "Subject" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          { key: "created_at", label: "Created", render: (r: any) => fmtDateTime(r.created_at) },
        ]}
      />
    </div>
  );
}
