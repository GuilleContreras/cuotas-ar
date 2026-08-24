"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { useCards } from "@/hooks/useCards";
import { createPurchaseWithInstallments } from "@/hooks/usePurchases";
import { CATEGORIES } from "@/lib/types";
import { generateInstallmentPlan, todayISO } from "@/lib/installments";
import { formatCurrency, formatDateLong, capitalize } from "@/lib/format";
import Link from "next/link";

export default function NuevaCompraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const cards = useCards();

  const [cardId, setCardId] = React.useState("");
  const [merchant, setMerchant] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [installmentsCount, setInstallmentsCount] = React.useState("1");
  const [purchaseDate, setPurchaseDate] = React.useState(todayISO());
  const [category, setCategory] = React.useState<string>(CATEGORIES[0]);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!cardId && cards.length > 0) setCardId(cards[0]!.id);
  }, [cards, cardId]);

  const selectedCard = cards.find((c) => c.id === cardId);
  const amountNum = Number(amount);
  const countNum = Math.max(1, Number(installmentsCount) || 1);

  const plan =
    selectedCard && amountNum > 0
      ? generateInstallmentPlan(amountNum, countNum, purchaseDate, selectedCard)
      : [];

  const isValid = !!selectedCard && merchant.trim().length > 0 && amountNum > 0 && countNum >= 1 && purchaseDate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard || !isValid) {
      toast("Completá los campos obligatorios.", "error");
      return;
    }
    setSaving(true);
    try {
      const id = await createPurchaseWithInstallments(
        {
          cardId: selectedCard.id,
          merchant,
          amount: amountNum,
          installmentsCount: countNum,
          purchaseDate,
          category,
          notes,
        },
        selectedCard
      );
      toast("Compra registrada.", "success");
      router.push(`/compras/${id}`);
    } catch (err) {
      console.error(err);
      toast("No se pudo guardar la compra.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader title="Nueva compra" showBack />
        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold text-white">Primero necesitás una tarjeta</p>
          <p className="text-sm text-muted">Agregá una tarjeta antes de registrar compras.</p>
          <Link href="/tarjetas/nueva" className="mt-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-glow">
            Agregar tarjeta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Nueva compra" showBack />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="cardId">Tarjeta</Label>
          <Select id="cardId" value={cardId} onChange={(e) => setCardId(e.target.value)}>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.bank}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="merchant">Comercio</Label>
          <Input id="merchant" placeholder="Ej: MercadoLibre" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="amount">Monto total</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="installments">Cantidad de cuotas</Label>
            <Input
              id="installments"
              type="number"
              inputMode="numeric"
              min={1}
              max={60}
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="purchaseDate">Fecha de compra</Label>
            <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Observaciones (opcional)</Label>
          <Input id="notes" placeholder="Notas adicionales" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {plan.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <p className="mb-2 text-sm font-medium text-white">Vista previa de cuotas</p>
              <div className="flex items-center justify-between rounded-xl bg-bg-elevated px-3 py-2.5">
                <div>
                  <p className="text-xs text-muted">Cuota mensual</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(plan[0]!.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Primer vencimiento</p>
                  <p className="text-sm font-medium text-white">{capitalize(formatDateLong(plan[0]!.dueDate))}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">
                Última cuota: {capitalize(formatDateLong(plan[plan.length - 1]!.dueDate))}
              </p>
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={!isValid || saving} className="mt-1">
          {saving ? "Guardando..." : "Registrar compra"}
        </Button>
      </form>
    </div>
  );
}
