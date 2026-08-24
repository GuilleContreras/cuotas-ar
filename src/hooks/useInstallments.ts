"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function useAllInstallments() {
  const result = useLiveQuery(() => db.installments.toArray(), [], []);
  return result ?? [];
}

export function useInstallmentsByPurchase(purchaseId: string | undefined) {
  const result = useLiveQuery(
    async () => (purchaseId ? await db.installments.where("purchaseId").equals(purchaseId).sortBy("number") : []),
    [purchaseId],
    []
  );
  return result ?? [];
}

export async function toggleInstallmentPaid(id: string, paid: boolean): Promise<void> {
  await db.installments.update(id, { paid });
}
