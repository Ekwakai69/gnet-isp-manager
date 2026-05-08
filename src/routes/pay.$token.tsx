import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { invoices } from "@/services/api";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtKES, fmtDate } from "@/utils/formatters";
import { toast } from "sonner";

export const Route = createFileRoute("/pay/$token")({
  component: PayPage,
});

function PayPage() {
  const { token } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-invoice", token],
    queryFn: async () => (await invoices.getByToken(token)).data,
    retry: false,
  });
  const inv: any = data?.data || data?.invoice || data || {};
  const { register, handleSubmit, reset } = useForm<any>();
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (inv?.client?.phone || inv?.phone) reset({ phone: inv?.client?.phone || inv?.phone });
  }, [inv, reset]);

  const pay = useMutation({
    mutationFn: (v: any) => invoices.payByToken(token, v),
    onSuccess: () => { toast.success("STK push sent. Check your phone."); setPaid(true); },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Payment failed"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            <span className="text-primary">GNET</span> Invoice Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="text-muted-foreground">Loading invoice...</div>}
          {error && <div className="text-destructive">Invoice not found or expired.</div>}
          {!isLoading && !error && (
            <>
              <div className="mb-4 rounded-md border bg-muted/30 p-4 text-sm">
                <div className="mb-2 flex justify-between">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span className="font-medium">{inv.number || inv.invoice_number || token.slice(0, 8)}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium">{inv.account_number || inv.client?.account_number || "-"}</span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="text-muted-foreground">Due</span>
                  <span>{fmtDate(inv.due_date)}</span>
                </div>
                {(inv.line_items || inv.items || []).map((li: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{li.name || li.description}</span>
                    <span>{fmtKES(li.amount)}</span>
                  </div>
                ))}
                <div className="mt-3 flex justify-between border-t pt-2 font-bold">
                  <span>Total</span>
                  <span>{fmtKES(inv.amount || inv.total)}</span>
                </div>
              </div>
              {paid ? (
                <div className="rounded-md border bg-secondary/20 p-4 text-center text-sm">
                  STK push sent to your phone. Complete the payment to activate your service.
                </div>
              ) : (
                <form onSubmit={handleSubmit((v) => pay.mutate(v))} className="space-y-3">
                  <div>
                    <Label className="mb-1 block">Account Number</Label>
                    <Input value={inv.account_number || inv.client?.account_number || ""} disabled />
                  </div>
                  <div>
                    <Label className="mb-1 block">Amount (KES)</Label>
                    <Input value={inv.amount || inv.total || 0} disabled />
                  </div>
                  <div>
                    <Label className="mb-1 block">Phone Number</Label>
                    <Input
                      placeholder="07XXXXXXXX"
                      required
                      {...register("phone", { required: true })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={pay.isPending}>
                    {pay.isPending ? "Sending..." : "Pay with M-Pesa"}
                  </Button>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
