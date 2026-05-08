import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { packagesApi } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";
import { fmtKES } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/packages")({
  component: PackagesList,
});

function PackagesList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => (await packagesApi.getAll()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];

  const syncAll = useMutation({
    mutationFn: () => packagesApi.syncAllMikrotik(),
    onSuccess: () => toast.success("Synced all to MikroTik"),
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <div>
      <PageHeader title="Packages" actions={
        <>
          <Button variant="outline" onClick={() => syncAll.mutate()}>Sync All to MikroTik</Button>
          <PackageFormDialog onSaved={() => qc.invalidateQueries({ queryKey: ["packages"] })} />
        </>
      } />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "speed", label: "Speed", render: (r: any) => `${r.upload || "?"} / ${r.download || "?"} Mbps` },
          { key: "price", label: "Price", render: (r: any) => fmtKES(r.price) },
          { key: "duration", label: "Duration", render: (r: any) => `${r.duration_days || r.duration || "-"} days` },
          { key: "actions", label: "", render: (r: any) => (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => packagesApi.syncMikrotik(r.id).then(() => toast.success("Synced")).catch((e: any) => toast.error(e?.response?.data?.message || "Failed"))}>Sync</Button>
              <Button size="sm" variant="ghost" onClick={() => packagesApi.archive(r.id).then(() => { toast.success("Archived"); qc.invalidateQueries({ queryKey: ["packages"] }); }).catch((e: any) => toast.error(e?.response?.data?.message || "Failed"))}>Archive</Button>
            </div>
          ) },
        ]}
      />
    </div>
  );
}

function PackageFormDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();
  const submit = async (v: any) => {
    try {
      await packagesApi.create({
        ...v,
        price: Number(v.price), upload: Number(v.upload), download: Number(v.download),
        duration_days: Number(v.duration_days),
      });
      toast.success("Package created");
      reset();
      setOpen(false);
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ Package</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Package</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <Field label="Name"><Input required {...register("name")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Upload (Mbps)"><Input type="number" required {...register("upload")} /></Field>
            <Field label="Download (Mbps)"><Input type="number" required {...register("download")} /></Field>
            <Field label="Price (KES)"><Input type="number" required {...register("price")} /></Field>
            <Field label="Duration (days)"><Input type="number" required defaultValue={30} {...register("duration_days")} /></Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: any) {
  return <div><Label className="mb-1 block text-xs">{label}</Label>{children}</div>;
}
