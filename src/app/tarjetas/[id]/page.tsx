"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CardTile } from "@/components/CardTile";
import { CardForm } from "@/components/CardForm";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { useCard, deleteCard } from "@/hooks/useCards";
import { usePurchasesByCard } from "@/hooks/usePurchases";
import { useAllInstallments } from "@/hooks/useInstallments";
import { cardAvailable } from "@/lib/installments";
import { formatCurrency, formatDateShort } from "@/lib/format";

export default function TarjetaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const card = useCard(params.id);
  const purchases = usePurchasesByCard(params.id);
  const installments = useAllInstallments();
  const [editing, setEditing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (card === undefined) {
    return (
      <div>
        <PageHeader title="Tarjeta" showBack />
        <p className="text-sm text-muted">Cargando...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div>
        <PageHeader title="Tarjeta" showBack />
        <p className="text-sm text-muted">No se encontró la tarjeta.</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <PageHeader title="Editar tarjeta" showBack />
        <CardForm existing={card} />
      </div>
    );
  }

  const available = cardAvailable(card, installments);

  return (
    <div>
      <PageHeader
        title={card.name}
        showBack
        right={
          <div className="flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white active:bg-bg-elevated"
              aria-label="Editar"
            >
              <Pencil className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-red-400 active:bg-bg-elevated"
              aria-label="Eliminar"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        }
      />

      <CardTile card={card} available={available} />

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Compras en esta tarjeta</h2>
        <Link href="/compras/nueva" className="text-xs font-medium text-accent-soft">
          + Nueva compra
        </Link>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {purchases.length === 0 && (
          <p className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-muted">
            Todavía no hay compras registradas en esta tarjeta.
          </p>
        )}
        {purchases.map((p) => (
          <Link
            key={p.id}
            href={`/compras/${p.id}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-bg-card p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated text-muted">
                <ShoppingBag className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">{p.merchant}</p>
                <p className="text-xs text-muted">
                  {formatDateShort(p.purchaseDate)} · {p.installmentsCount} cuota{p.installmentsCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold text-white">{formatCurrency(p.amount)}</p>
          </Link>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar tarjeta?"
        description="Se eliminarán también todas las compras y cuotas asociadas a esta tarjeta. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteCard(card.id);
          toast("Tarjeta eliminada.", "success");
          router.push("/tarjetas");
        }}
      />
    </div>
  );
}
