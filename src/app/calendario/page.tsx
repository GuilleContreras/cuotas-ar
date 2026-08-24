"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useCards } from "@/hooks/useCards";
import { useAllInstallments } from "@/hooks/useInstallments";
import { addMonthsToYM, todayISO, ymToLabel } from "@/lib/installments";
import { formatCurrency, formatDateShort, capitalize } from "@/lib/format";

export default function CalendarioPage() {
  const cards = useCards();
  const installments = useAllInstallments();
  const cardsById = new Map(cards.map((c) => [c.id, c]));

  const [ym, setYm] = React.useState(() => {
    const t = todayISO();
    return `${t.slice(0, 4)}-${t.slice(5, 7)}`;
  });

  const monthInstallments = installments
    .filter((i) => i.statementMonth === ym)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

  const totalGeneral = Math.round(monthInstallments.reduce((s, i) => s + i.amount, 0) * 100) / 100;

  const byCard = new Map<string, number>();
  for (const i of monthInstallments) {
    byCard.set(i.cardId, Math.round(((byCard.get(i.cardId) ?? 0) + i.amount) * 100) / 100);
  }

  return (
    <div>
      <PageHeader title="Calendario" subtitle="Cuotas por mes de resumen" />

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-bg-card p-2">
        <button
          onClick={() => setYm(addMonthsToYM(ym, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white active:bg-bg-elevated"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-white">{capitalize(ymToLabel(ym))}</p>
        <button
          onClick={() => setYm(addMonthsToYM(ym, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white active:bg-bg-elevated"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4">
          <p className="text-xs text-muted">Total general del mes</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalGeneral)}</p>
          {byCard.size > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
              {[...byCard.entries()].map(([cardId, total]) => {
                const card = cardsById.get(cardId);
                return (
                  <div key={cardId} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: card?.color ?? "#3b82f6" }} />
                      {card?.name ?? "Tarjeta"}
                    </span>
                    <span className="font-medium text-white">{formatCurrency(total)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-2 text-base font-semibold text-white">Cuotas de este resumen</h2>
      <div className="flex flex-col gap-2">
        {monthInstallments.length === 0 && (
          <p className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-muted">
            No hay cuotas cargadas para este mes.
          </p>
        )}
        {monthInstallments.map((inst) => {
          const card = cardsById.get(inst.cardId);
          return (
            <Link
              key={inst.id}
              href={`/compras/${inst.purchaseId}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-bg-card p-3.5 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-bold text-white"
                  style={{ backgroundColor: card?.color ?? "#3b82f6" }}
                >
                  {card?.name.slice(0, 2).toUpperCase() ?? "--"}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    Cuota {inst.number}/{inst.totalInstallments}
                  </p>
                  <p className="text-xs text-muted">Vence {formatDateShort(inst.dueDate)}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-white">{formatCurrency(inst.amount)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
