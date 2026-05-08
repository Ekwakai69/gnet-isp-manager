import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hotspotPackages } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";
import { fmtKES } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hotspot-packages")({
  component: HotspotPackagesList,
});

function HotspotPackagesList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["hotspot-packages"],
    queryFn: async () => (await hotspotPackages.getAll()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];

  const remove = useMutation({
    mutationFn: (id: string) => hotspotPackages.delete(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["hotspot-packages"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <div>
      <PageHeader title="Hotspot Packages" actions={<HotspotForm onSaved={() => qc.invalidateQueries({ queryKey: ["hotspot-packages"] })} />} />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "duration", label: "Duration", render: (r: any) => r.duration || `${r.duration_minutes || "?"} min` },
          { key: "price", label: "Price", render: (r: any) => fmtKES(r.price) },
          { key: "actions", label: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>Delete</Button> },
        ]}
      />
    </div>
  );
}

function HotspotForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();
  const submit = async (v: any) => {
    try {
      await hotspotPackages.create({ ...v, price: Number(v.price), duration_minutes: Number(v.duration_minutes) });
      toast.success("Created");
      reset(); setOpen(false); onSaved();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ Package</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Hotspot Package</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div><Label className="text-xs">Name</Label><Input required {...register("name")} /></div>
          <div><Label className="text-xs">Duration (minutes)</Label><Input type="number" required {...register("duration_minutes")} /></div>
          <div><Label className="text-xs">Price (KES)</Label><Input type="number" required {...register("price")} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
