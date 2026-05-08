import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tickets } from "@/services/api";
import { PageHeader, StatusBadge } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { fmtDateTime } from "@/utils/formatters";

export const Route = createFileRoute("/_authenticated/tickets/$id")({
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => (await tickets.getOne(id)).data,
  });
  const t: any = data?.data || data || {};
  const [reply, setReply] = useState("");

  const send = async () => {
    if (!reply.trim()) return;
    try {
      await tickets.reply(id, { message: reply });
      toast.success("Reply sent");
      setReply("");
      qc.invalidateQueries({ queryKey: ["ticket", id] });
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  const setStatus = async (status: string) => {
    try {
      await tickets.update(id, { status });
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["ticket", id] });
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t.subject || "Ticket"}
        description={`#${t.number || t.id}`}
        actions={<>
          <Button variant="outline" onClick={() => setStatus("resolved")}>Mark Resolved</Button>
          <Button variant="outline" onClick={() => setStatus("closed")}>Close</Button>
          <Button variant="ghost" onClick={() => navigate({ to: "/tickets" })}>Back</Button>
        </>}
      />
      <Card className="mb-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Details</CardTitle>
          <StatusBadge status={t.status} />
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <div><div className="text-xs text-muted-foreground">Client</div><div>{t.client?.name || t.client_name || "-"}</div></div>
            <div><div className="text-xs text-muted-foreground">Priority</div><div>{t.priority || "-"}</div></div>
            <div><div className="text-xs text-muted-foreground">Created</div><div>{fmtDateTime(t.created_at)}</div></div>
          </div>
          {t.description && <p className="mt-3 whitespace-pre-wrap text-sm">{t.description}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Conversation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(t.replies || t.messages || []).map((m: any, i: number) => (
            <div key={m.id || i} className="rounded-md border p-3 text-sm">
              <div className="mb-1 text-xs text-muted-foreground">{m.author || m.user?.name || "User"} · {fmtDateTime(m.created_at)}</div>
              <p className="whitespace-pre-wrap">{m.message || m.body}</p>
            </div>
          ))}
          <Textarea placeholder="Write a reply..." value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
          <Button onClick={send}>Send Reply</Button>
        </CardContent>
      </Card>
    </div>
  );
}
