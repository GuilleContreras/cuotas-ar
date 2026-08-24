"use client";

import Link from "next/link";
import type { Card } from "@/lib/types";
import { BRAND_LABELS } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function CardTile({ card, available }: { card: Card; available: number }) {
  const usedPct = card.limit > 0 ? Math.min(100, Math.max(0, ((card.limit - available) / card.limit) * 100)) : 0;
  const gradientFrom = card.color;
  const gradientTo = shade(card.color, -40);

  return (
    <Link href={`/tarjetas/${card.id}`} className="block active:scale-[0.98] transition-transform">
      <div
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-card"
        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{card.bank}</p>
            <p className="text-lg font-semibold">{card.name}</p>
          </div>
          <span className="rounded-lg bg-black/25 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide">
            {BRAND_LABELS[card.brand]}
          </span>
        </div>

        <div className="relative mt-6">
          <p className="text-xs text-white/70">Disponible</p>
          <p className="text-2xl font-bold tracking-tight">{formatCurrency(available)}</p>
        </div>

        <div className="relative mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/25">
            <div className={cn("h-full rounded-full bg-white/85")} style={{ width: `${usedPct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-white/70">
            <span>Límite {formatCurrency(card.limit)}</span>
            <span>Cierra el {card.closingDay} · Vence el {card.dueDay}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
