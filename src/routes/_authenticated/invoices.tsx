import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { invoices } from "@/services/api";
import { PageHeader, DataTable, StatusBadge } from "@/components/DataTable";
import { fmtKES, fmtDate } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/invoices")({
  component: InvoicesList,
});

function InvoicesList() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await invoices.getAll()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];

  const resend = async (id: string) => {
    try { await invoices.resendEmail(id); toast.success("Email resent"); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  return (
    <div>
      <PageHeader title="Invoices" actions={<Button variant="outline" onClick={() => refetch()}>Refresh</Button>} />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "number", label: "Invoice #", render: (r: any) => r.number || r.invoice_number || r.id },
          { key: "client", label: "Client", render: (r: any) => r.client?.name || r.client_name || "-" },
          { key: "amount", label: "Amount", render: (r: any) => fmtKES(r.amount || r.total) },
          { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          { key: "due", label: "Due", render: (r: any) => fmtDate(r.due_date || r.created_at) },
          { key: "actions", label: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => resend(r.id)}>Resend</Button> },
        ]}
      />
    </div>
  );
}
