"use client";

import { PageHeader } from "@/components/PageHeader";
import { CardForm } from "@/components/CardForm";

export default function NuevaTarjetaPage() {
  return (
    <div>
      <PageHeader title="Nueva tarjeta" showBack />
      <CardForm />
    </div>
  );
}
