import Dexie, { type Table } from "dexie";
import type { Card, Purchase, Installment } from "./types";

export class CuotasDB extends Dexie {
  cards!: Table<Card, string>;
  purchases!: Table<Purchase, string>;
  installments!: Table<Installment, string>;

  constructor() {
    super("cuotas-ar-db");
    this.version(1).stores({
      cards: "id, name, bank, brand, createdAt",
      purchases: "id, cardId, purchaseDate, category, createdAt",
      installments: "id, purchaseId, cardId, statementMonth, dueDate, paid",
    });
  }
}

export const db = new CuotasDB();
