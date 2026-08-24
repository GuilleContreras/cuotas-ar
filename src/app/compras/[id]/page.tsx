"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Check, Circle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { usePurchase, deletePurchase, updatePurchaseNotes } from "@/hooks/usePurchases";
import { useCard } from "@/hooks/useCards";
import { useInstallmentsByPurchase, toggleInstallmentPaid } from "@/hooks/useInstallments";
import { formatCurrency, formatDateLong, capitalize } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CompraDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const purchase = usePurchase(params.id);
  const card = useCard(purchase?.cardId);
  const installments = useInstallmentsByPurchase(params.id);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [notesTouched, setNotesTouched] = React.useState(false);

  React.useEffect(() => {
    if (purchase && !notesTouched) setNotes(purchase.notes ?? "");
  }, [purchase, notesTouched]);

  if (purchase === undefined) {
    return (
      <div>
        <PageHeader title="Compra" showBack />
        <p className="text-sm text-muted">Cargando...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div>
        <PageHeader title="Compra" showBack />
        <p className="text-sm text-muted">No se encontró la compra.</p>
      </div>
    );
  }

  const paidCount = installments.filter((i) => i.paid).length;
  const remaining = installments.length - paidCount;

  async function saveNotes() {
    if (!purchase) return;
    await updatePurchaseNotes(purchase.id, notes);
    toast("Observaciones guardadas.", "success");
  }

  return (
    <div>
      <PageHeader
        title={purchase.merchant}
        showBack
        right={
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-red-400 active:bg-bg-elevated"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        }
      />

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Monto total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(purchase.amount)}</p>
            </div>
            <Badge variant="default">{purchase.category}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p className="text-muted">
              Tarjeta: <span className="text-white">{card?.name ?? "-"}</span>
            </p>
            <p className="text-muted">
              Fecha: <span className="text-white">{formatDateLong(purchase.purchaseDate)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted">Cuotas pagadas</p>
            <p className="text-xl font-bold text-emerald-400">
              {paidCount}/{installments.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted">Cuotas restantes</p>
            <p className="text-xl font-bold text-white">{remaining}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5">
        <h2 className="mb-2 text-base font-semibold text-white">Detalle de cuotas</h2>
        <div className="flex flex-col gap-2">
          {installments.map((inst) => (
            <button
              key={inst.id}
              onClick={() => toggleInstallmentPaid(inst.id, !inst.paid)}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-3.5 text-left transition-colors",
                inst.paid ? "border-emerald-500/25 bg-emerald-500/5" : "border-border bg-bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    inst.paid ? "bg-emerald-500/20 text-emerald-400" : "bg-bg-elevated text-muted"
                  )}
                >
                  {inst.paid ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    Cuota {inst.number}/{inst.totalInstallments}
                  </p>
                  <p className="text-xs text-muted">{capitalize(formatDateLong(inst.dueDate))}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-white">{formatCurrency(inst.amount)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-1.5 text-sm font-medium text-white">Observaciones</p>
        <div className="flex gap-2">
          <Input
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesTouched(true);
            }}
            placeholder="Sin observaciones"
          />
          <button
            onClick={saveNotes}
            className="rounded-xl border border-border bg-bg-elevated px-4 text-sm font-medium text-accent-soft active:scale-95 transition-transform"
          >
            Guardar
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar compra?"
        description="Se eliminarán todas las cuotas generadas por esta compra. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deletePurchase(purchase.id);
          toast("Compra eliminada.", "success");
          router.push(card ? `/tarjetas/${card.id}` : "/");
        }}
      />
    </div>
  );
}
