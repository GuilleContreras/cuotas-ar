"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CardTile } from "@/components/CardTile";
import { useCards } from "@/hooks/useCards";
import { useAllInstallments } from "@/hooks/useInstallments";
import { cardAvailable } from "@/lib/installments";

export default function TarjetasPage() {
  const cards = useCards();
  const installments = useAllInstallments();

  return (
    <div>
      <PageHeader
        title="Tus tarjetas"
        subtitle={`${cards.length} tarjeta${cards.length === 1 ? "" : "s"} registrada${cards.length === 1 ? "" : "s"}`}
        right={
          <Link
            href="/tarjetas/nueva"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white active:scale-90 transition-transform"
            aria-label="Nueva tarjeta"
          >
            <Plus className="h-5 w-5" />
          </Link>
        }
      />

      {cards.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold text-white">No hay tarjetas todavía</p>
          <p className="text-sm text-muted">Agregá la primera para empezar a registrar compras.</p>
          <Link
            href="/tarjetas/nueva"
            className="mt-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-glow"
          >
            Agregar tarjeta
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} available={cardAvailable(card, installments)} />
          ))}
        </div>
      )}
    </div>
  );
}
