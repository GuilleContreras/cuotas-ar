"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Card, Purchase } from "@/lib/types";
import { uid } from "@/lib/utils";
import { generateInstallmentPlan } from "@/lib/installments";

export function usePurchases() {
  const purchases = useLiveQuery(() => db.purchases.orderBy("createdAt").reverse().toArray(), [], []);
  return purchases ?? [];
}

export function usePurchase(id: string | undefined) {
  return useLiveQuery(async () => (id ? await db.purchases.get(id) : undefined), [id]);
}

export function usePurchasesByCard(cardId: string | undefined) {
  const result = useLiveQuery(
    async () => (cardId ? await db.purchases.where("cardId").equals(cardId).reverse().sortBy("createdAt") : []),
    [cardId],
    []
  );
  return result ?? [];
}

interface NewPurchaseInput {
  cardId: string;
  merchant: string;
  amount: number;
  installmentsCount: number;
  purchaseDate: string;
  category: string;
  notes?: string;
}

export async function createPurchaseWithInstallments(input: NewPurchaseInput, card: Pick<Card, "closingDay" | "dueDay">): Promise<string> {
  const purchaseId = uid();
  const purchase: Purchase = {
    id: purchaseId,
    cardId: input.cardId,
    merchant: input.merchant.trim(),
    amount: input.amount,
    installmentsCount: input.installmentsCount,
    purchaseDate: input.purchaseDate,
    category: input.category,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  const plan = generateInstallmentPlan(input.amount, input.installmentsCount, input.purchaseDate, card);

  await db.transaction("rw", db.purchases, db.installments, async () => {
    await db.purchases.add(purchase);
    await db.installments.bulkAdd(
      plan.map((p) => ({
        id: uid(),
        purchaseId,
        cardId: input.cardId,
        number: p.number,
        totalInstallments: p.totalInstallments,
        amount: p.amount,
        statementMonth: p.statementMonth,
        dueDate: p.dueDate,
        paid: false,
      }))
    );
  });

  return purchaseId;
}

export async function deletePurchase(id: string): Promise<void> {
  await db.transaction("rw", db.purchases, db.installments, async () => {
    await db.installments.where("purchaseId").equals(id).delete();
    await db.purchases.delete(id);
  });
}

export async function updatePurchaseNotes(id: string, notes: string): Promise<void> {
  await db.purchases.update(id, { notes: notes.trim() || undefined });
}
