import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { clients } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/DataTable";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clients/new")({
  component: ClientForm,
});

function ClientForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<any>();

  const onSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const phone = values.phone.trim();
      if (!/^(07\d{8}|2547\d{8})$/.test(phone)) {
        toast.error("Phone must be 07XXXXXXXX or 2547XXXXXXXX");
        return;
      }
      const { data } = await clients.create({
        ...values,
        installation_fee: Number(values.installation_fee || 0),
      });
      toast.success("Client created. Now you can send an invoice.");
      const id = data?.id || data?.data?.id || data?.client?.id;
      if (id) navigate({ to: "/clients/$id", params: { id: String(id) } });
      else navigate({ to: "/clients" });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Client" description="Package is selected later when sending the invoice." />
      <Card>
        <CardHeader><CardTitle>Client details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <Field label="Name" error={errors.name?.message as string}>
              <Input {...register("name", { required: "Required" })} />
            </Field>
            <Field label="Phone" error={errors.phone?.message as string}>
              <Input {...register("phone", { required: "Required" })} placeholder="0712345678" />
            </Field>
            <Field label="Email" error={errors.email?.message as string}>
              <Input type="email" {...register("email", { required: "Required" })} />
            </Field>
            <Field label="Location">
              <Input {...register("location")} />
            </Field>
            <Field label="PPPoE Username" error={errors.pppoe_username?.message as string}>
              <Input {...register("pppoe_username", { required: "Required" })} />
            </Field>
            <Field label="PPPoE Password" error={errors.pppoe_password?.message as string}>
              <Input {...register("pppoe_password", { required: "Required" })} />
            </Field>
            <Field label="Installation Fee (KES)">
              <Input type="number" step="1" min="0" {...register("installation_fee")} defaultValue={0} />
            </Field>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/clients" })}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Create Client"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: any) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
