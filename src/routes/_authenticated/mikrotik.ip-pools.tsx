import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mikrotik } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mikrotik/ip-pools")({
  component: IPPools,
});

function IPPools() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["ip-pools"],
    queryFn: async () => (await mikrotik.getIPPools()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  const auto = useMutation({
    mutationFn: () => mikrotik.autoSetupIPs(),
    onSuccess: () => { toast.success("Auto-setup complete"); qc.invalidateQueries({ queryKey: ["ip-pools"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <div>
      <PageHeader title="IP Pools" actions={
        <>
          <Button variant="outline" onClick={() => auto.mutate()}>Auto-setup</Button>
          <NewPool onSaved={() => qc.invalidateQueries({ queryKey: ["ip-pools"] })} />
        </>
      } />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "name", label: "Name" },
          { key: "ranges", label: "Ranges" },
        ]}
      />
    </div>
  );
}

function NewPool({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();
  const submit = async (v: any) => {
    try { await mikrotik.createIPPool(v); toast.success("Created"); reset(); setOpen(false); onSaved(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ Pool</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New IP Pool</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div><Label className="text-xs">Name</Label><Input required {...register("name")} /></div>
          <div><Label className="text-xs">Ranges (e.g. 10.0.0.2-10.0.0.254)</Label><Input required {...register("ranges")} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
