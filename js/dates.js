/**
 * dates.js
 * Responsabilidade: cálculo e formatação das datas da régua.
 */

export const RULER_DAYS = [3, 7, 30, 90, 360];

export function parseDateInput(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date) {
  return date.toLocaleDateString("pt-BR");
}

export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isSameDay(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function getRulerDate(baseDate, days) {
  return addDays(baseDate, days);
}

export function getTodayRuler(baseDate, today = new Date()) {
  return RULER_DAYS.find(days =>
    isSameDay(getRulerDate(baseDate, days), today)
  ) ?? null;
}
