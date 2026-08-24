"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Card } from "@/lib/types";
import { uid } from "@/lib/utils";

export function useCards() {
  const cards = useLiveQuery(() => db.cards.orderBy("createdAt").reverse().toArray(), [], []);
  return cards ?? [];
}

export function useCard(id: string | undefined) {
  return useLiveQuery(async () => (id ? await db.cards.get(id) : undefined), [id]);
}

export async function createCard(input: Omit<Card, "id" | "createdAt">): Promise<string> {
  const id = uid();
  await db.cards.add({ ...input, id, createdAt: new Date().toISOString() });
  return id;
}

export async function updateCard(id: string, patch: Partial<Omit<Card, "id" | "createdAt">>): Promise<void> {
  await db.cards.update(id, patch);
}

export async function deleteCard(id: string): Promise<void> {
  await db.transaction("rw", db.cards, db.purchases, db.installments, async () => {
    const purchases = await db.purchases.where("cardId").equals(id).toArray();
    const purchaseIds = purchases.map((p) => p.id);
    if (purchaseIds.length) {
      await db.installments.where("purchaseId").anyOf(purchaseIds).delete();
      await db.purchases.bulkDelete(purchaseIds);
    }
    await db.cards.delete(id);
  });
}
