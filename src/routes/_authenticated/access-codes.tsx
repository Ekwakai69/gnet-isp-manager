import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accessCodes } from "@/services/api";
import { PageHeader, DataTable, StatusBadge } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { fmtDateTime } from "@/utils/formatters";

export const Route = createFileRoute("/_authenticated/access-codes")({
  component: AccessCodesList,
});

function AccessCodesList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["access-codes"],
    queryFn: async () => (await accessCodes.getAll()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  const remove = useMutation({
    mutationFn: (id: string) => accessCodes.delete(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["access-codes"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <div>
      <PageHeader title="Access Codes" actions={<Generate onSaved={() => qc.invalidateQueries({ queryKey: ["access-codes"] })} />} />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "code", label: "Code" },
          { key: "package", label: "Package", render: (r: any) => r.package?.name || r.package_name || "-" },
          { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          { key: "created_at", label: "Created", render: (r: any) => fmtDateTime(r.created_at) },
          { key: "actions", label: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>Delete</Button> },
        ]}
      />
    </div>
  );
}

function Generate({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();
  const submit = async (v: any) => {
    try {
      await accessCodes.generate({ ...v, count: Number(v.count) });
      toast.success("Generated");
      reset(); setOpen(false); onSaved();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ Generate</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Generate Codes</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div><Label className="text-xs">Hotspot Package ID</Label><Input required {...register("package_id")} /></div>
          <div><Label className="text-xs">Count</Label><Input type="number" required defaultValue={10} {...register("count")} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Generate</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
