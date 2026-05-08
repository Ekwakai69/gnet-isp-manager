import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sms } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sms/templates")({
  component: SMSTemplates,
});

function SMSTemplates() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => (await sms.getTemplates()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  const remove = useMutation({
    mutationFn: (id: string) => sms.deleteTemplate(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["sms-templates"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <div>
      <PageHeader title="SMS Templates" actions={
        <>
          <SendSMSDialog />
          <NewTemplate onSaved={() => qc.invalidateQueries({ queryKey: ["sms-templates"] })} />
        </>
      } />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "body", label: "Body", render: (r: any) => <span className="line-clamp-2">{r.body || r.message}</span> },
          { key: "actions", label: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>Delete</Button> },
        ]}
      />
    </div>
  );
}

function NewTemplate({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();
  const submit = async (v: any) => {
    try { await sms.createTemplate(v); toast.success("Saved"); reset(); setOpen(false); onSaved(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ Template</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div><Label className="text-xs">Name</Label><Input required {...register("name")} /></div>
          <div><Label className="text-xs">Body</Label><Textarea required rows={4} {...register("body")} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SendSMSDialog() {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();
  const submit = async (v: any) => {
    try { await sms.send(v); toast.success("SMS sent"); reset(); setOpen(false); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">Send SMS</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Send SMS</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div><Label className="text-xs">Phone(s) — comma separated</Label><Input required {...register("phones")} /></div>
          <div><Label className="text-xs">Message</Label><Textarea required rows={4} {...register("message")} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Send</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
