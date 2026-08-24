"use client";

import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { useCards } from "@/hooks/useCards";
import { useAllInstallments } from "@/hooks/useInstallments";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateLong, capitalize } from "@/lib/format";
import { monthlyProjection, nextStatementsByCard, totalFutureCommitted, ymToLabel } from "@/lib/installments";
import { BRAND_LABELS } from "@/lib/types";
import { ArrowUpRight, CalendarClock, Wallet, Sparkles, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const cards = useCards();
  const installments = useAllInstallments();

  const cardsById = new Map(cards.map((c) => [c.id, c]));
  const nextStatements = nextStatementsByCard(installments);
  const totalNextStatement = Math.round(nextStatements.reduce((s, g) => s + g.total, 0) * 100) / 100;
  const totalFuture = totalFutureCommitted(installments);
  const projection = monthlyProjection(installments, 12).map((b) => ({
    name: ymToLabel(b.ym).split(" ")[0]?.slice(0, 3) ?? b.ym,
    total: b.total,
  }));

  const isEmpty = cards.length === 0;

  return (
    <div className="pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="mb-5">
        <p className="text-sm text-muted">Hola 👋</p>
        <h1 className="text-2xl font-bold text-white">Tu resumen financiero</h1>
      </div>

      {!isEmpty && (
        <Link
          href="/simulador"
          className="mb-4 flex items-center justify-between rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/20 to-accent/5 p-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-soft">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">¿Me alcanza?</p>
              <p className="text-xs text-muted">Simulá una compra antes de hacerla</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" />
        </Link>
      )}

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <div className="mb-2 flex items-center gap-1.5 text-muted">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span className="text-xs">Próximo resumen</span>
                </div>
                <p className="text-xl font-bold text-white">{formatCurrency(totalNextStatement)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="mb-2 flex items-center gap-1.5 text-muted">
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="text-xs">Comprometido total</span>
                </div>
                <p className="text-xl font-bold text-white">{formatCurrency(totalFuture)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-3">
            <CardContent className="pt-4">
              <p className="mb-1 text-sm font-medium text-white">Próximos 12 meses</p>
              <p className="mb-2 text-xs text-muted">Total proyectado por mes de resumen</p>
              <div className="-mx-2 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projection} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#7c88a8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        background: "#161d33",
                        border: "1px solid #1f2740",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "#fff",
                      }}
                      labelStyle={{ color: "#7c88a8" }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fill="url(#fillTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="mt-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Próximos vencimientos</h2>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {nextStatements.length === 0 && (
              <p className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-muted">
                No tenés vencimientos próximos pendientes.
              </p>
            )}
            {nextStatements.map((g) => {
              const card = cardsById.get(g.cardId);
              if (!card) return null;
              return (
                <Link
                  key={g.cardId}
                  href={`/tarjetas/${card.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-bg-card p-4 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: card.color }}
                    >
                      {BRAND_LABELS[card.brand].slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{card.name}</p>
                      <p className="text-xs text-muted">{capitalize(formatDateLong(g.dueDate))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(g.total)}</p>
                    <ArrowUpRight className="h-4 w-4 text-muted" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
        <Wallet className="h-7 w-7 text-accent-soft" />
      </div>
      <div>
        <p className="font-semibold text-white">Todavía no cargaste tarjetas</p>
        <p className="mt-1 text-sm text-muted">Agregá tu primera tarjeta para empezar a proyectar tus cuotas.</p>
      </div>
      <Link
        href="/tarjetas/nueva"
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-glow active:scale-95 transition-transform"
      >
        Agregar tarjeta
      </Link>
    </div>
  );
}
