import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/services/api";
import { PageHeader } from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
});

function Settings() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await settingsApi.get()).data,
  });
  const cfg = data?.data || data || {};
  const { register, handleSubmit, reset } = useForm<any>();
  useEffect(() => { reset(cfg); }, [cfg, reset]);

  const submit = async (v: any) => {
    try { await settingsApi.update(v); toast.success("Settings saved"); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader><CardTitle>Business</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} className="grid gap-3 md:grid-cols-2">
            <F label="Business Name"><Input {...register("business_name")} /></F>
            <F label="Currency"><Input {...register("currency")} defaultValue="KES" /></F>
            <F label="Logo URL"><Input {...register("logo_url")} /></F>
            <F label="Customer Prefix"><Input {...register("customer_prefix")} /></F>
            <F label="Invoice Prefix"><Input {...register("invoice_prefix")} /></F>
            <F label="Support Phone"><Input {...register("support_phone")} /></F>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function F({ label, children }: any) {
  return <div><Label className="mb-1 block text-xs">{label}</Label>{children}</div>;
}
