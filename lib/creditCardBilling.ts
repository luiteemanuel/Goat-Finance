import { CreditCard } from '../types';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const clampDay = (year: number, monthIndex: number, targetDay: number) => {
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(targetDay, 1), maxDay);
};

export const getInvoiceCycleFromDate = (purchaseDate: string, card: CreditCard) => {
  const txDate = new Date(`${purchaseDate}T00:00:00`);
  const day = txDate.getDate();

  const closingMonthIndex = day <= card.closingDay ? txDate.getMonth() : txDate.getMonth() + 1;
  const closingYear = txDate.getFullYear() + Math.floor(closingMonthIndex / 12);
  const normalizedClosingMonthIndex = ((closingMonthIndex % 12) + 12) % 12;

  const closingDay = clampDay(closingYear, normalizedClosingMonthIndex, card.closingDay);
  const closingDate = new Date(closingYear, normalizedClosingMonthIndex, closingDay);

  const dueMonthIndex = normalizedClosingMonthIndex + 1;
  const dueYear = closingYear + Math.floor(dueMonthIndex / 12);
  const normalizedDueMonthIndex = dueMonthIndex % 12;
  const dueDay = clampDay(dueYear, normalizedDueMonthIndex, card.dueDay);
  const dueDate = new Date(dueYear, normalizedDueMonthIndex, dueDay);

  return {
    invoiceId: toMonthKey(closingDate),
    closingDate: formatDate(closingDate),
    dueDate: formatDate(dueDate),
  };
};

export const getCurrentCycleSnapshot = (card: CreditCard, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthClosingDay = clampDay(today.getFullYear(), today.getMonth(), card.closingDay);
  const thisMonthClosingDate = new Date(today.getFullYear(), today.getMonth(), thisMonthClosingDay);
  const currentClosing = today <= thisMonthClosingDate
    ? thisMonthClosingDate
    : new Date(today.getFullYear(), today.getMonth() + 1, clampDay(today.getFullYear(), today.getMonth() + 1, card.closingDay));

  const previousClosing = new Date(currentClosing.getFullYear(), currentClosing.getMonth() - 1, clampDay(currentClosing.getFullYear(), currentClosing.getMonth() - 1, card.closingDay));
  const previousDue = new Date(previousClosing.getFullYear(), previousClosing.getMonth() + 1, clampDay(previousClosing.getFullYear(), previousClosing.getMonth() + 1, card.dueDay));

  return {
    openInvoiceId: toMonthKey(currentClosing),
    closedInvoiceId: toMonthKey(previousClosing),
    closedInvoiceDueDate: formatDate(previousDue),
    openInvoiceClosingDate: formatDate(currentClosing),
  };
};
