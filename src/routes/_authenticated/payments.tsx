import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { payments } from "@/services/api";
import { PageHeader, DataTable, StatusBadge } from "@/components/DataTable";
import { fmtKES, fmtDateTime } from "@/utils/formatters";

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsList,
});

function PaymentsList() {
  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => (await payments.getAll()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  return (
    <div>
      <PageHeader title="Payments" />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "client", label: "Client", render: (r: any) => r.client?.name || r.client_name || "-" },
          { key: "amount", label: "Amount", render: (r: any) => fmtKES(r.amount) },
          { key: "method", label: "Method" },
          { key: "reference", label: "Reference", render: (r: any) => r.reference || r.receipt || "-" },
          { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          { key: "created_at", label: "Date", render: (r: any) => fmtDateTime(r.created_at) },
        ]}
      />
    </div>
  );
}
