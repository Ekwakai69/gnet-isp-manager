import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { clients } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, DataTable, StatusBadge } from "@/components/DataTable";
import { fmtDate } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_authenticated/clients/")({
  component: ClientsList,
});

function ClientsList() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["clients", search, status],
    queryFn: async () => (await clients.getAll({ search, status })).data,
  });

  const rows = Array.isArray(data) ? data : data?.data || data?.clients || [];

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage your subscribers"
        actions={
          can("create_clients") && (
            <Button asChild>
              <Link to="/clients/new">Add Client</Link>
            </Button>
          )
        }
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          placeholder="Search by name, phone, account..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <DataTable
        isLoading={isLoading}
        rows={rows}
        onRowClick={(r: any) => navigate({ to: "/clients/$id", params: { id: String(r.id) } })}
        columns={[
          { key: "account_number", label: "Account #", render: (r: any) => r.account_number || r.account_no || "-" },
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "package", label: "Package", render: (r: any) => r.package?.name || r.package_name || "-" },
          { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          { key: "expiry", label: "Expiry", render: (r: any) => fmtDate(r.expiry_date || r.expires_at) },
        ]}
      />
    </div>
  );
}
