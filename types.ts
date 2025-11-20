export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
}

export interface Category {
  id: string;
  name: string;
  color: string;
  budgetLimit: number;
  icon: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO String YYYY-MM-DD
  type: TransactionType;
  status: TransactionStatus;
  categoryId: string;
  paymentMethod: PaymentMethod;
  cardId?: string; // Only if credit card
  installments?: {
    current: number;
    total: number;
    originalTotalAmount?: number;
  };
  isFixed: boolean; // Recurrent (Rent, Netflix)
  tag?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  color: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  projectedExpense: number;
}

export interface AIAdvice {
  title: string;
  description: string;
  impact: string; // e.g., "Save R$ 200"
  type: 'optimization' | 'alert' | 'praise';
}