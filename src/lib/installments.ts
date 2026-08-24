import type { Card, Installment, Purchase } from "./types";

/**
 * Todas las fechas se manejan como {year, month(0-11), day} para evitar
 * problemas de husos horarios con el objeto Date nativo.
 */
interface YMD {
  year: number;
  month: number; // 0-11
  day: number;
}

function parseISODate(iso: string): YMD {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

function daysInMonth(year: number, month: number): number {
  // month 0-11
  return new Date(year, month + 1, 0).getDate();
}

/** Arma un ISO yyyy-mm-dd clampeando el día al último día del mes si hace falta. */
function toISO(year: number, month: number, day: number): string {
  let y = year;
  let m = month;
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  const clampedDay = Math.min(day, daysInMonth(y, m));
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(clampedDay).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function ymKey(year: number, month: number): string {
  let y = year;
  let m = month;
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function addMonthsToYM(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  return ymKey(y, m - 1 + n);
}

export function ymToLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

/**
 * Dado el mes/año del resumen (statement) y el día de vencimiento de la tarjeta,
 * devuelve la fecha de vencimiento real de ese resumen (ISO).
 */
export function dueDateForStatementMonth(statementMonth: string, dueDay: number): string {
  const [y, m] = statementMonth.split("-").map(Number);
  return toISO(y, m - 1, dueDay);
}

/**
 * Determina en qué "mes de resumen" (statementMonth, formato YYYY-MM) impacta
 * la PRIMERA cuota de una compra, en base a:
 * - fecha de compra
 * - día de cierre de la tarjeta
 * - día de vencimiento de la tarjeta
 *
 * Regla:
 * 1) Si la compra ocurre el día de cierre o antes, entra en el ciclo que cierra
 *    ese mismo mes. Si ocurre después del cierre, entra en el ciclo que cierra
 *    el mes siguiente.
 * 2) El vencimiento de ese ciclo cae en el mismo mes del cierre si dueDay >= closingDay,
 *    o en el mes siguiente si dueDay < closingDay (vencimiento "cruza" de mes).
 */
export function firstStatementMonth(purchaseDateISO: string, closingDay: number, dueDay: number): string {
  const p = parseISODate(purchaseDateISO);

  // 1) mes de cierre que aplica
  let closingMonth = p.month;
  let closingYear = p.year;
  if (p.day > closingDay) {
    closingMonth += 1;
  }

  // 2) mes de vencimiento de ese ciclo
  let dueMonth = closingMonth;
  const dueYear = closingYear;
  if (dueDay < closingDay) {
    dueMonth += 1;
  }

  return ymKey(dueYear, dueMonth);
}

export interface GeneratedInstallment {
  number: number;
  totalInstallments: number;
  amount: number;
  statementMonth: string;
  dueDate: string;
}

/**
 * Genera el detalle completo de cuotas de una compra, distribuyendo el monto
 * de forma pareja y ajustando centavos en la última cuota para que la suma
 * cierre exacto con el monto total.
 */
export function generateInstallmentPlan(
  amount: number,
  installmentsCount: number,
  purchaseDateISO: string,
  card: Pick<Card, "closingDay" | "dueDay">
): GeneratedInstallment[] {
  const count = Math.max(1, Math.floor(installmentsCount));
  const baseAmount = Math.round((amount / count) * 100) / 100;
  const roundedTotal = Math.round(baseAmount * count * 100) / 100;
  const diff = Math.round((amount - roundedTotal) * 100) / 100;

  const startYM = firstStatementMonth(purchaseDateISO, card.closingDay, card.dueDay);

  const plan: GeneratedInstallment[] = [];
  for (let i = 1; i <= count; i++) {
    const statementMonth = addMonthsToYM(startYM, i - 1);
    const dueDate = dueDateForStatementMonth(statementMonth, card.dueDay);
    let installmentAmount = baseAmount;
    if (i === count) {
      // la última cuota absorbe la diferencia de redondeo
      installmentAmount = Math.round((baseAmount + diff) * 100) / 100;
    }
    plan.push({
      number: i,
      totalInstallments: count,
      amount: installmentAmount,
      statementMonth,
      dueDate,
    });
  }
  return plan;
}

/** Compara dos fechas ISO (yyyy-mm-dd) como strings, sirve porque el formato ordena lexicográficamente. */
export function isoIsBeforeOrEqual(a: string, b: string): boolean {
  return a <= b;
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Agrupa las cuotas no pagas por tarjeta y devuelve, para cada tarjeta,
 * el próximo resumen (statementMonth con la fecha de vencimiento más próxima
 * que sea hoy o futura) junto con el total a pagar en ese resumen.
 */
export function nextStatementsByCard(installments: Installment[], today: string = todayISO()) {
  const byCard = new Map<string, Installment[]>();
  for (const inst of installments) {
    if (inst.paid) continue;
    if (inst.dueDate < today) continue; // vencidas no pagas quedan afuera del "próximo resumen"
    const arr = byCard.get(inst.cardId) ?? [];
    arr.push(inst);
    byCard.set(inst.cardId, arr);
  }

  const result: { cardId: string; statementMonth: string; dueDate: string; total: number; installments: Installment[] }[] = [];
  for (const [cardId, list] of byCard.entries()) {
    const minDue = list.reduce((min, i) => (i.dueDate < min ? i.dueDate : min), list[0]!.dueDate);
    const group = list.filter((i) => i.dueDate === minDue);
    result.push({
      cardId,
      statementMonth: group[0]!.statementMonth,
      dueDate: minDue,
      total: Math.round(group.reduce((s, i) => s + i.amount, 0) * 100) / 100,
      installments: group,
    });
  }
  result.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));
  return result;
}

/** Total comprometido en cuotas futuras (todo lo que falta pagar, no vencido). */
export function totalFutureCommitted(installments: Installment[], today: string = todayISO()): number {
  const sum = installments
    .filter((i) => !i.paid && i.dueDate >= today)
    .reduce((s, i) => s + i.amount, 0);
  return Math.round(sum * 100) / 100;
}

/** Serie de próximos N meses con el total a pagar (todas las tarjetas sumadas). */
export function monthlyProjection(installments: Installment[], months: number, today: string = todayISO()) {
  const [y, m] = today.split("-").map(Number);
  const startYM = ymKey(y, m - 1);
  const buckets: { ym: string; total: number }[] = [];
  for (let i = 0; i < months; i++) {
    const ym = addMonthsToYM(startYM, i);
    buckets.push({ ym, total: 0 });
  }
  const byYm = new Map(buckets.map((b) => [b.ym, b]));
  for (const inst of installments) {
    const bucket = byYm.get(inst.statementMonth);
    if (bucket) bucket.total = Math.round((bucket.total + inst.amount) * 100) / 100;
  }
  return buckets;
}

/** Disponible actual de una tarjeta = límite - suma de cuotas no pagas (futuras y vencidas). */
export function cardAvailable(card: Card, installments: Installment[]): number {
  const committed = installments
    .filter((i) => i.cardId === card.id && !i.paid)
    .reduce((s, i) => s + i.amount, 0);
  return Math.round((card.limit - committed) * 100) / 100;
}
