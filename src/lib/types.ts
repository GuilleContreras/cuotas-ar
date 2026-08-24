export type CardBrand = "visa" | "mastercard" | "amex" | "naranja";

export interface Card {
  id: string;
  name: string;
  bank: string;
  brand: CardBrand;
  limit: number;
  closingDay: number; // 1-31, día de cierre del resumen
  dueDay: number; // 1-31, día de vencimiento del resumen
  color: string; // hex
  createdAt: string; // ISO
}

export interface Purchase {
  id: string;
  cardId: string;
  merchant: string;
  amount: number; // monto total de la compra
  installmentsCount: number;
  purchaseDate: string; // ISO (yyyy-mm-dd)
  category: string;
  notes?: string;
  createdAt: string; // ISO
}

export interface Installment {
  id: string;
  purchaseId: string;
  cardId: string;
  number: number; // 1-based
  totalInstallments: number;
  amount: number;
  statementMonth: string; // "YYYY-MM" mes del resumen donde impacta
  dueDate: string; // ISO (yyyy-mm-dd) fecha de vencimiento de ese resumen
  paid: boolean;
}

export const CATEGORIES = [
  "Supermercado",
  "Indumentaria",
  "Tecnología",
  "Hogar",
  "Salud",
  "Combustible",
  "Viajes",
  "Entretenimiento",
  "Servicios",
  "Educación",
  "Otros",
] as const;

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  naranja: "Naranja X",
};
