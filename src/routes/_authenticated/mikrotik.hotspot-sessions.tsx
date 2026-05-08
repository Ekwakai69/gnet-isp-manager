import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { mikrotik } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";

export const Route = createFileRoute("/_authenticated/mikrotik/hotspot-sessions")({
  component: HotspotSessions,
});

function HotspotSessions() {
  const { data, isLoading } = useQuery({
    queryKey: ["hotspot-sessions"],
    queryFn: async () => (await mikrotik.getHotspotSessions()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  return (
    <div>
      <PageHeader title="Hotspot Sessions" />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "user", label: "User", render: (r: any) => r.user || r.username },
          { key: "mac", label: "MAC", render: (r: any) => r.mac_address || r.mac },
          { key: "ip", label: "IP", render: (r: any) => r.address || r.ip },
          { key: "uptime", label: "Uptime" },
          { key: "bytes_in", label: "In" },
          { key: "bytes_out", label: "Out" },
        ]}
      />
    </div>
  );
}
