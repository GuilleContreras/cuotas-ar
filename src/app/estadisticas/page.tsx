"use client";

import * as React from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  Legend,
} from "recharts";
import { Download, Upload, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { useCards } from "@/hooks/useCards";
import { usePurchases } from "@/hooks/usePurchases";
import { useAllInstallments } from "@/hooks/useInstallments";
import { monthlyProjection, todayISO, ymToLabel } from "@/lib/installments";
import { formatCurrency, formatDateShort, capitalize } from "@/lib/format";
import { exportBackup, importBackup } from "@/lib/backup";

const COLORS = ["#3b82f6", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#22d3ee", "#a3e635", "#f97316", "#7c88a8"];

export default function EstadisticasPage() {
  const cards = useCards();
  const purchases = usePurchases();
  const installments = useAllInstallments();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");

  const cardsById = new Map(cards.map((c) => [c.id, c]));

  // Gasto por categoría (sobre el monto total de las compras)
  const byCategory = new Map<string, number>();
  for (const p of purchases) {
    byCategory.set(p.category, Math.round(((byCategory.get(p.category) ?? 0) + p.amount) * 100) / 100);
  }
  const categoryData = [...byCategory.entries()].map(([name, value]) => ({ name, value }));

  // Distribución por tarjeta (comprometido: cuotas no pagas)
  const byCard = new Map<string, number>();
  for (const i of installments) {
    if (i.paid) continue;
    byCard.set(i.cardId, Math.round(((byCard.get(i.cardId) ?? 0) + i.amount) * 100) / 100);
  }
  const cardData = [...byCard.entries()].map(([cardId, value]) => ({
    name: cardsById.get(cardId)?.name ?? "Tarjeta",
    value,
  }));

  // Evolución mensual: 6 meses atrás a 11 meses adelante
  const [y, m] = todayISO().split("-").map(Number);
  const startYm = `${y}-${String(m).padStart(2, "0")}`;
  const past = monthlyProjectionRange(installments, startYm, -6, 6);
  const future = monthlyProjection(installments, 12);
  const evolution = [...past, ...future.slice(1)].map((b) => ({
    name: capitalize(ymToLabel(b.ym).split(" ")[0]!.slice(0, 3)),
    total: b.total,
  }));

  const pendingCount = installments.filter((i) => !i.paid).length;
  const pendingTotal = Math.round(installments.filter((i) => !i.paid).reduce((s, i) => s + i.amount, 0) * 100) / 100;

  const filteredPurchases = purchases.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.merchant.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (cardsById.get(p.cardId)?.name.toLowerCase().includes(q) ?? false)
    );
  });

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importBackup(file);
      toast(`Respaldo importado: ${result.cards} tarjetas, ${result.purchases} compras.`, "success");
    } catch (err) {
      console.error(err);
      toast("El archivo de respaldo no es válido.", "error");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="Análisis de tus compras y cuotas" />

      {purchases.length === 0 ? (
        <p className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-muted">
          Registrá compras para ver tus estadísticas acá.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted">Cuotas pendientes</p>
                <p className="text-xl font-bold text-white">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted">Total pendiente</p>
                <p className="text-xl font-bold text-white">{formatCurrency(pendingTotal)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-3">
            <CardContent className="pt-4">
              <p className="mb-2 text-sm font-medium text-white">Evolución mensual</p>
              <div className="-mx-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolution} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: "#7c88a8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: "#161d33", border: "1px solid #1f2740", borderRadius: 12, fontSize: 12, color: "#fff" }}
                      labelStyle={{ color: "#7c88a8" }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-3">
            <CardContent className="pt-4">
              <p className="mb-2 text-sm font-medium text-white">Gasto por categoría</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: "#161d33", border: "1px solid #1f2740", borderRadius: 12, fontSize: 12, color: "#fff" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#7c88a8" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {cardData.length > 0 && (
            <Card className="mt-3">
              <CardContent className="pt-4">
                <p className="mb-2 text-sm font-medium text-white">Distribución por tarjeta</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={cardData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {cardData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ background: "#161d33", border: "1px solid #1f2740", borderRadius: 12, fontSize: 12, color: "#fff" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: "#7c88a8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input placeholder="Buscar compra, categoría o tarjeta" className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {filteredPurchases.slice(0, 25).map((p) => (
                <Link
                  key={p.id}
                  href={`/compras/${p.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border bg-bg-card p-3.5 active:scale-[0.98] transition-transform"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p.merchant}</p>
                    <p className="text-xs text-muted">
                      {formatDateShort(p.purchaseDate)} · {p.category} · {cardsById.get(p.cardId)?.name ?? "-"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-white">{formatCurrency(p.amount)}</p>
                </Link>
              ))}
              {filteredPurchases.length === 0 && (
                <p className="rounded-2xl border border-border bg-bg-card p-4 text-sm text-muted">Sin resultados.</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-white">Respaldo de datos</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => exportBackup()}>
            <Download className="h-4 w-4" /> Exportar JSON
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Importar JSON
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </div>
        <p className="mt-2 text-xs text-muted">
          Importar reemplaza todos los datos guardados localmente por los del archivo.
        </p>
      </div>
    </div>
  );
}

function monthlyProjectionRange(
  installments: ReturnType<typeof useAllInstallments>,
  startYm: string,
  fromOffset: number,
  toOffset: number
) {
  const buckets: { ym: string; total: number }[] = [];
  for (let i = fromOffset; i <= toOffset; i++) {
    const [y, m] = startYm.split("-").map(Number);
    const date = new Date(y, m - 1 + i, 1);
    const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ ym, total: 0 });
  }
  const byYm = new Map(buckets.map((b) => [b.ym, b]));
  for (const inst of installments) {
    const bucket = byYm.get(inst.statementMonth);
    if (bucket) bucket.total = Math.round((bucket.total + inst.amount) * 100) / 100;
  }
  return buckets;
}
