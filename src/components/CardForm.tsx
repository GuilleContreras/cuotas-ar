"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { createCard, updateCard } from "@/hooks/useCards";
import type { Card, CardBrand } from "@/lib/types";
import { BRAND_LABELS } from "@/lib/types";

const COLOR_PRESETS = ["#3b82f6", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

export function CardForm({ existing }: { existing?: Card }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const [name, setName] = React.useState(existing?.name ?? "");
  const [bank, setBank] = React.useState(existing?.bank ?? "");
  const [brand, setBrand] = React.useState<CardBrand>(existing?.brand ?? "visa");
  const [limit, setLimit] = React.useState(existing?.limit?.toString() ?? "");
  const [closingDay, setClosingDay] = React.useState(existing?.closingDay?.toString() ?? "15");
  const [dueDay, setDueDay] = React.useState(existing?.dueDay?.toString() ?? "22");
  const [color, setColor] = React.useState(existing?.color ?? COLOR_PRESETS[0]!);

  const isValid =
    name.trim().length > 0 &&
    bank.trim().length > 0 &&
    Number(limit) > 0 &&
    Number(closingDay) >= 1 &&
    Number(closingDay) <= 31 &&
    Number(dueDay) >= 1 &&
    Number(dueDay) <= 31;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      toast("Completá todos los campos correctamente.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        bank: bank.trim(),
        brand,
        limit: Number(limit),
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        color,
      };
      if (existing) {
        await updateCard(existing.id, payload);
        toast("Tarjeta actualizada.", "success");
        router.push(`/tarjetas/${existing.id}`);
      } else {
        const id = await createCard(payload);
        toast("Tarjeta creada.", "success");
        router.push(`/tarjetas/${id}`);
      }
    } catch (err) {
      console.error(err);
      toast("No se pudo guardar la tarjeta.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name">Nombre de la tarjeta</Label>
        <Input id="name" placeholder="Ej: Visa Signature" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="bank">Banco</Label>
        <Input id="bank" placeholder="Ej: Banco Galicia" value={bank} onChange={(e) => setBank(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="brand">Marca</Label>
        <Select id="brand" value={brand} onChange={(e) => setBrand(e.target.value as CardBrand)}>
          {Object.entries(BRAND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="limit">Límite de compra</Label>
        <Input
          id="limit"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="closingDay">Día de cierre</Label>
          <Input
            id="closingDay"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dueDay">Día de vencimiento</Label>
          <Input
            id="dueDay"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-9 w-9 rounded-full border-2 transition-transform active:scale-90"
              style={{ backgroundColor: c, borderColor: color === c ? "#fff" : "transparent" }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <Button type="submit" disabled={!isValid || saving} className="mt-2">
        {saving ? "Guardando..." : existing ? "Guardar cambios" : "Crear tarjeta"}
      </Button>
    </form>
  );
}
