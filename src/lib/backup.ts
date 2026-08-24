import { db } from "./db";
import type { Card, Installment, Purchase } from "./types";

interface BackupFile {
  version: 1;
  exportedAt: string;
  cards: Card[];
  purchases: Purchase[];
  installments: Installment[];
}

export async function exportBackup(): Promise<void> {
  const [cards, purchases, installments] = await Promise.all([
    db.cards.toArray(),
    db.purchases.toArray(),
    db.installments.toArray(),
  ]);
  const payload: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards,
    purchases,
    installments,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = payload.exportedAt.slice(0, 10);
  a.href = url;
  a.download = `cuotas-ar-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Reemplaza todo el contenido local por el del archivo de respaldo. */
export async function importBackup(file: File): Promise<{ cards: number; purchases: number; installments: number }> {
  const text = await file.text();
  const data = JSON.parse(text) as BackupFile;

  if (!data || !Array.isArray(data.cards) || !Array.isArray(data.purchases) || !Array.isArray(data.installments)) {
    throw new Error("El archivo no tiene el formato esperado de un respaldo de Cuotas AR.");
  }

  await db.transaction("rw", db.cards, db.purchases, db.installments, async () => {
    await db.cards.clear();
    await db.purchases.clear();
    await db.installments.clear();
    await db.cards.bulkAdd(data.cards);
    await db.purchases.bulkAdd(data.purchases);
    await db.installments.bulkAdd(data.installments);
  });

  return {
    cards: data.cards.length,
    purchases: data.purchases.length,
    installments: data.installments.length,
  };
}
