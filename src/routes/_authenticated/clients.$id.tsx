import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { useState } from "react";
import { clients, packagesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader, StatusBadge } from "@/components/DataTable";
import { fmtDate, fmtKES } from "@/utils/formatters";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_authenticated/clients/$id")({
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => (await clients.getOne(id)).data,
  });

  const c: any = client?.data || client?.client || client || {};
  const [editing, setEditing] = useState<any | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["client", id] });

  const toggle = useMutation({
    mutationFn: () => clients.toggle(id),
    onSuccess: () => { toast.success("Status updated"); refresh(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  const cashActivate = async () => {
    const amount = prompt("Cash amount (0 allowed):", "0");
    if (amount === null) return;
    try {
      await clients.activateCash(id, { amount: Number(amount) });
      toast.success("Activated by cash");
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  };

  const mpesaManual = async () => {
    const receipt = prompt("M-Pesa receipt number:");
    if (!receipt) return;
    const amount = prompt("Amount:", "0");
    if (amount === null) return;
    try {
      await clients.activateMpesaManual(id, { receipt, amount: Number(amount) });
      toast.success("Activated (M-Pesa manual)");
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  };

  const saveProfile = async (values: any) => {
    try {
      await clients.update(id, values);
      toast.success("Saved");
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <PageHeader
        title={c.name || "Client"}
        description={c.account_number || c.account_no}
        actions={
          <>
            {can("send_invoices") && <SendInvoiceModal clientId={id} />}
            {can("process_payments") && (
              <>
                <Button variant="outline" onClick={cashActivate}>Activate Cash</Button>
                <Button variant="outline" onClick={mpesaManual}>M-Pesa Manual</Button>
              </>
            )}
            {can("edit_clients") && (
              <Button variant="outline" onClick={() => toggle.mutate()}>
                {c.status === "disabled" ? "Enable" : "Disable"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate({ to: "/clients" })}>Back</Button>
          </>
        }
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="routers">Routers</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Profile</CardTitle>
              {can("edit_clients") && !editing && (
                <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Edit</Button>
              )}
            </CardHeader>
            <CardContent>
              {!editing ? (
                <dl className="grid gap-3 md:grid-cols-2 text-sm">
                  <Row label="Name" value={c.name} />
                  <Row label="Phone" value={c.phone} />
                  <Row label="Email" value={c.email} />
                  <Row label="Location" value={c.location} />
                  <Row label="PPPoE Username" value={c.pppoe_username} />
                  <Row label="Status" value={<StatusBadge status={c.status} />} />
                  <Row label="Package" value={c.package?.name || c.package_name || "-"} />
                  <Row label="Expiry" value={fmtDate(c.expiry_date || c.expires_at)} />
                  <Row label="Installation Fee" value={fmtKES(c.installation_fee)} />
                </dl>
              ) : (
                <ProfileEditor initial={editing} onCancel={() => setEditing(null)} onSave={saveProfile} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices"><EmptyTab label="invoices" data={c.invoices} /></TabsContent>
        <TabsContent value="payments"><EmptyTab label="payments" data={c.payments} /></TabsContent>
        <TabsContent value="tickets"><EmptyTab label="tickets" data={c.tickets} /></TabsContent>
        <TabsContent value="routers"><EmptyTab label="routers" data={c.routers} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "-"}</dd>
    </div>
  );
}

function EmptyTab({ label, data }: { label: string; data?: any[] }) {
  if (!data || data.length === 0)
    return <div className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">No {label}.</div>;
  return (
    <div className="overflow-x-auto rounded-md border bg-card p-3">
      <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function ProfileEditor({ initial, onCancel, onSave }: any) {
  const { register, handleSubmit } = useForm({ defaultValues: initial });
  const { data: pkgs } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => (await packagesApi.getAll()).data,
  });
  const list = Array.isArray(pkgs) ? pkgs : pkgs?.data || [];
  return (
    <form onSubmit={handleSubmit(onSave)} className="grid gap-3 md:grid-cols-2 text-sm">
      <F label="Name"><Input {...register("name")} /></F>
      <F label="Phone"><Input {...register("phone")} /></F>
      <F label="Email"><Input {...register("email")} /></F>
      <F label="Location"><Input {...register("location")} /></F>
      <F label="PPPoE Username"><Input {...register("pppoe_username")} /></F>
      <F label="PPPoE Password"><Input {...register("pppoe_password")} /></F>
      <F label="Package">
        <select className="h-9 w-full rounded-md border border-input bg-background px-3" {...register("package_id")}>
          <option value="">-- none --</option>
          {list.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </F>
      <F label="Expiry Date"><Input type="date" {...register("expiry_date")} /></F>
      <F label="Installation Fee"><Input type="number" {...register("installation_fee")} /></F>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

function F({ label, children }: any) {
  return (
    <div>
      <Label className="mb-1 block text-xs">{label}</Label>
      {children}
    </div>
  );
}

import { useFieldArray, useForm } from "react-hook-form";

function SendInvoiceModal({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const { data: pkgs } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => (await packagesApi.getAll()).data,
    enabled: open,
  });
  const list = Array.isArray(pkgs) ? pkgs : pkgs?.data || [];
  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { package_id: "", installation_fee: 0, router_cost: 0, line_items: [] as any[] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "line_items" });

  const submit = async (values: any) => {
    try {
      await clients.sendInvoice(clientId, values);
      toast.success("Invoice sent to client's email");
      setOpen(false);
      reset();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Send Invoice</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Send Invoice</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <F label="Package">
            <select className="h-9 w-full rounded-md border border-input bg-background px-3" required {...register("package_id", { required: true })}>
              <option value="">-- choose --</option>
              {list.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {fmtKES(p.price)}</option>)}
            </select>
          </F>
          <F label="Installation Fee"><Input type="number" {...register("installation_fee", { valueAsNumber: true })} /></F>
          <F label="Router Cost"><Input type="number" {...register("router_cost", { valueAsNumber: true })} /></F>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-xs">Additional line items</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => append({ name: "", amount: 0 })}>+ Add</Button>
            </div>
            {fields.map((f, i) => (
              <div key={f.id} className="mb-2 flex gap-2">
                <Input placeholder="Name" {...register(`line_items.${i}.name` as const)} />
                <Input type="number" placeholder="Amount" {...register(`line_items.${i}.amount` as const, { valueAsNumber: true })} />
                <Button type="button" variant="ghost" onClick={() => remove(i)}>×</Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Send</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
