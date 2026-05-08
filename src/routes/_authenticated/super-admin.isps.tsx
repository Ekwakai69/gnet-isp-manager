import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superAdmin } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/isps")({
  component: ISPsList,
});

function ISPsList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["isps"],
    queryFn: async () => (await superAdmin.getISPs()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  const remove = useMutation({
    mutationFn: (id: string) => superAdmin.deleteISP(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["isps"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <div>
      <PageHeader title="ISPs" actions={<NewISP onSaved={() => qc.invalidateQueries({ queryKey: ["isps"] })} />} />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "actions", label: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && remove.mutate(r.id)}>Delete</Button> },
        ]}
      />
    </div>
  );
}

function NewISP({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();
  const submit = async (v: any) => {
    try { await superAdmin.createISP(v); toast.success("ISP created"); reset(); setOpen(false); onSaved(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ ISP</Button></DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New ISP</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Section title="Basics">
            <div className="grid grid-cols-2 gap-3">
              <F label="Name"><Input required {...register("name")} /></F>
              <F label="Email"><Input type="email" required {...register("email")} /></F>
              <F label="Phone"><Input {...register("phone")} /></F>
              <F label="Currency"><Input defaultValue="KES" {...register("currency")} /></F>
              <F label="Business Name"><Input {...register("business_name")} /></F>
              <F label="Logo URL"><Input {...register("logo_url")} /></F>
              <F label="Customer Prefix"><Input {...register("customer_prefix")} /></F>
              <F label="Invoice Prefix"><Input {...register("invoice_prefix")} /></F>
            </div>
          </Section>
          <Section title="Admin Login">
            <div className="grid grid-cols-2 gap-3">
              <F label="Admin Email"><Input type="email" required {...register("admin_email")} /></F>
              <F label="Admin Password"><Input required {...register("admin_password")} /></F>
            </div>
          </Section>
          <Section title="MikroTik">
            <div className="grid grid-cols-2 gap-3">
              <F label="Host"><Input {...register("mikrotik_host")} /></F>
              <F label="Port"><Input defaultValue={8728} {...register("mikrotik_port")} /></F>
              <F label="User"><Input {...register("mikrotik_user")} /></F>
              <F label="Password"><Input {...register("mikrotik_password")} /></F>
            </div>
          </Section>
          <Section title="M-Pesa">
            <div className="grid grid-cols-2 gap-3">
              <F label="Shortcode"><Input {...register("mpesa_shortcode")} /></F>
              <F label="Environment">
                <select className="h-9 w-full rounded-md border border-input bg-background px-3" {...register("mpesa_env")}>
                  <option value="sandbox">sandbox</option>
                  <option value="production">production</option>
                </select>
              </F>
              <F label="Consumer Key"><Input {...register("mpesa_key")} /></F>
              <F label="Consumer Secret"><Input {...register("mpesa_secret")} /></F>
              <F label="Passkey"><Input {...register("mpesa_passkey")} /></F>
            </div>
          </Section>
          <Section title="SMS">
            <div className="grid grid-cols-2 gap-3">
              <F label="API Key"><Input {...register("sms_api_key")} /></F>
              <F label="Sender ID"><Input {...register("sms_sender_id")} /></F>
            </div>
          </Section>
          <Section title="SMTP">
            <div className="grid grid-cols-2 gap-3">
              <F label="Host"><Input {...register("smtp_host")} /></F>
              <F label="Port"><Input defaultValue={587} {...register("smtp_port")} /></F>
              <F label="User"><Input {...register("smtp_user")} /></F>
              <F label="Password"><Input {...register("smtp_password")} /></F>
              <F label="From Email"><Input type="email" {...register("smtp_from")} /></F>
            </div>
          </Section>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Create ISP</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: any) {
  return <div><h3 className="mb-2 text-sm font-semibold">{title}</h3>{children}</div>;
}
function F({ label, children }: any) {
  return <div><Label className="mb-1 block text-xs">{label}</Label>{children}</div>;
}
