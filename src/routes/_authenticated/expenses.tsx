import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expenses } from "@/services/api";
import { PageHeader, DataTable } from "@/components/DataTable";
import { fmtKES, fmtDate } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesList,
});

function ExpensesList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => (await expenses.getAll()).data,
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  const remove = useMutation({
    mutationFn: (id: string) => expenses.delete(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["expenses"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });
  return (
    <div>
      <PageHeader title="Expenses" actions={<NewExpense onSaved={() => qc.invalidateQueries({ queryKey: ["expenses"] })} />} />
      <DataTable
        isLoading={isLoading}
        rows={rows}
        columns={[
          { key: "category", label: "Category" },
          { key: "description", label: "Description" },
          { key: "amount", label: "Amount", render: (r: any) => fmtKES(r.amount) },
          { key: "date", label: "Date", render: (r: any) => fmtDate(r.date || r.created_at) },
          { key: "actions", label: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>Delete</Button> },
        ]}
      />
    </div>
  );
}

function NewExpense({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();
  const submit = async (v: any) => {
    try { await expenses.create({ ...v, amount: Number(v.amount) }); toast.success("Saved"); reset(); setOpen(false); onSaved(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ Expense</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div><Label className="text-xs">Category</Label><Input required {...register("category")} /></div>
          <div><Label className="text-xs">Description</Label><Input {...register("description")} /></div>
          <div><Label className="text-xs">Amount</Label><Input type="number" required {...register("amount")} /></div>
          <div><Label className="text-xs">Date</Label><Input type="date" {...register("date")} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
