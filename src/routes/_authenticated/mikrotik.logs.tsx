import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { mikrotik } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";
import { fmtDateTime } from "@/utils/formatters";

export const Route = createFileRoute("/_authenticated/mikrotik/logs")({
  component: SystemLogs,
});

function SystemLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["mikrotik-logs"],
    queryFn: async () => (await mikrotik.getSystemLogs()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  return (
    <div>
      <PageHeader title="System Logs" />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "time", label: "Time", render: (r: any) => fmtDateTime(r.time || r.created_at) },
          { key: "topics", label: "Topics" },
          { key: "message", label: "Message" },
        ]}
      />
    </div>
  );
}
