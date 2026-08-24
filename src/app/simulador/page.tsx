"use client";

import * as React from "react";
import { PageHeader } from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useCards } from "@/hooks/useCards";
import { useAllInstallments } from "@/hooks/useInstallments";
import { cardAvailable, generateInstallmentPlan, monthlyProjection, todayISO, ymToLabel } from "@/lib/installments";
import { formatCurrency, capitalize } from "@/lib/format";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SimuladorPage() {
  const cards = useCards();
  const installments = useAllInstallments();

  const [cardId, setCardId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [installmentsCount, setInstallmentsCount] = React.useState("1");
  const [purchaseDate, setPurchaseDate] = React.useState(todayISO());

  React.useEffect(() => {
    if (!cardId && cards.length > 0) setCardId(cards[0]!.id);
  }, [cards, cardId]);

  const card = cards.find((c) => c.id === cardId);
  const amountNum = Number(amount);
  const countNum = Math.max(1, Number(installmentsCount) || 1);

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader title="¿Me alcanza?" showBack />
        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold text-white">Primero necesitás una tarjeta</p>
          <Link href="/tarjetas/nueva" className="mt-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-glow">
            Agregar tarjeta
          </Link>
        </div>
      </div>
    );
  }

  const available = card ? cardAvailable(card, installments) : 0;
  const hasSimulation = !!card && amountNum > 0 && countNum >= 1;

  const simulatedPlan = hasSimulation ? generateInstallmentPlan(amountNum, countNum, purchaseDate, card!) : [];
  const availableAfter = available - amountNum;
  const fitsInLimit = amountNum <= available;

  const currentProjection = monthlyProjection(installments, 12);
  const simulatedInstallments = card
    ? [
        ...installments,
        ...simulatedPlan.map((p) => ({
          id: "sim",
          purchaseId: "sim",
          cardId: card.id,
          number: p.number,
          totalInstallments: p.totalInstallments,
          amount: p.amount,
          statementMonth: p.statementMonth,
          dueDate: p.dueDate,
          paid: false,
        })),
      ]
    : installments;
  const newProjection = monthlyProjection(simulatedInstallments, 12);

  const totalNext12Months = Math.round(simulatedPlan.reduce((s, p) => s + p.amount, 0) * 100) / 100;

  const chartData = currentProjection.map((b, idx) => ({
    name: capitalize(ymToLabel(b.ym).split(" ")[0]!.slice(0, 3)),
    actual: b.total,
    nuevo: newProjection[idx]?.total ?? b.total,
  }));

  return (
    <div>
      <PageHeader title="¿Me alcanza?" subtitle="Simulá una compra antes de hacerla" showBack />

      <div className="flex flex-col gap-4">
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
          <Label htmlFor="amount">Monto de la compra hipotética</Label>
          <Input id="amount" type="number" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="installments">Cuotas</Label>
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
            <Label htmlFor="purchaseDate">Fecha</Label>
            <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
        </div>
      </div>

      {hasSimulation && card && (
        <div className="mt-5 flex flex-col gap-3">
          <Card className={cn(!fitsInLimit && "border-red-500/40")}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {fitsInLimit ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
                <p className="text-sm font-semibold text-white">
                  {fitsInLimit ? "Esta compra entra en tu límite disponible" : "Esta compra supera tu límite disponible"}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted">Disponible actual</p>
                  <p className="font-medium text-white">{formatCurrency(available)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Disponible luego de comprar</p>
                  <p className={cn("font-medium", fitsInLimit ? "text-white" : "text-red-400")}>
                    {formatCurrency(availableAfter)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted">Total a pagar en los próximos 12 meses por esta compra</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalNext12Months)}</p>
              <p className="mt-1 text-xs text-muted">
                Cuota mensual aproximada: {formatCurrency(simulatedPlan[0]?.amount ?? 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="mb-2 text-sm font-medium text-white">Cómo cambia cada resumen</p>
              <div className="flex flex-col gap-1.5">
                {chartData.map((row, idx) => {
                  const delta = Math.round((row.nuevo - row.actual) * 100) / 100;
                  if (delta === 0) return null;
                  return (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2 text-sm">
                      <span className="text-muted">{row.name}</span>
                      <span className="text-white">
                        {formatCurrency(row.actual)} → <span className="font-semibold">{formatCurrency(row.nuevo)}</span>{" "}
                        <span className="text-accent-soft">(+{formatCurrency(delta)})</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
