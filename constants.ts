import { Category, CreditCard, Goal, PaymentMethod, Transaction, TransactionStatus, TransactionType } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Moradia', color: '#6366f1', budgetLimit: 3000, icon: 'fa-house' },
  { id: '2', name: 'Alimentação', color: '#f59e0b', budgetLimit: 1500, icon: 'fa-utensils' },
  { id: '3', name: 'Transporte', color: '#10b981', budgetLimit: 800, icon: 'fa-car' },
  { id: '4', name: 'Lazer', color: '#ec4899', budgetLimit: 600, icon: 'fa-gamepad' },
  { id: '5', name: 'Saúde', color: '#ef4444', budgetLimit: 400, icon: 'fa-heart-pulse' },
  { id: '6', name: 'Serviços/Assinaturas', color: '#8b5cf6', budgetLimit: 300, icon: 'fa-receipt' },
];

export const MOCK_CARDS: CreditCard[] = [
  { id: 'c1', name: 'Nubank Ultravioleta', limit: 15000, closingDay: 5, dueDay: 12, color: '#820ad1', brand: 'mastercard' },
  { id: 'c2', name: 'XP Visa Infinite', limit: 25000, closingDay: 15, dueDay: 22, color: '#000000', brand: 'visa' },
  { id: 'c3', name: 'Inter Black', limit: 10000, closingDay: 25, dueDay: 5, color: '#ff7a00', brand: 'mastercard' },
];

export const MOCK_GOALS: Goal[] = [
  { id: 'g1', name: 'Viagem Japão', targetAmount: 15000, currentAmount: 4500, deadline: '2025-12-01', icon: 'fa-plane', color: '#6366f1' },
  { id: 'g2', name: 'Reserva de Emergência', targetAmount: 20000, currentAmount: 12000, deadline: '2024-12-31', icon: 'fa-piggy-bank', color: '#10b981' },
  { id: 'g3', name: 'Trocar MacBook', targetAmount: 12000, currentAmount: 2000, deadline: '2025-06-15', icon: 'fa-laptop', color: '#f59e0b' },
];

// Helper to generate dates relative to today
const today = new Date();
const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().slice(0, 7);

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Income
  { id: 't1', description: 'Salário Mensal', amount: 8500, date: `${currentMonth}-05`, type: TransactionType.INCOME, status: TransactionStatus.PAID, categoryId: '1', paymentMethod: PaymentMethod.TRANSFER, isFixed: true, tag: 'trabalho' },
  { id: 't2', description: 'Freelance Projeto X', amount: 1200, date: `${currentMonth}-15`, type: TransactionType.INCOME, status: TransactionStatus.PENDING, categoryId: '1', paymentMethod: PaymentMethod.PIX, isFixed: false, tag: 'extra' },

  // Fixed Expenses
  { id: 't3', description: 'Aluguel + Condomínio', amount: 2800, date: `${currentMonth}-10`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '1', paymentMethod: PaymentMethod.PIX, isFixed: true },
  { id: 't4', description: 'Internet Fibra', amount: 120, date: `${currentMonth}-10`, type: TransactionType.EXPENSE, status: TransactionStatus.PENDING, categoryId: '6', paymentMethod: PaymentMethod.DEBIT_CARD, isFixed: true },
  { id: 't5', description: 'Netflix 4K', amount: 55.90, date: `${currentMonth}-12`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '6', paymentMethod: PaymentMethod.CREDIT_CARD, cardId: 'c1', isFixed: true },

  // Variable Expenses - Credit Card
  { id: 't6', description: 'Supermercado Semanal', amount: 450, date: `${currentMonth}-02`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '2', paymentMethod: PaymentMethod.CREDIT_CARD, cardId: 'c1', isFixed: false, tag: 'casa' },
  { id: 't7', description: 'Jantar Fora', amount: 180, date: `${currentMonth}-08`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '2', paymentMethod: PaymentMethod.CREDIT_CARD, cardId: 'c2', isFixed: false, tag: 'lazer' },
  { id: 't8', description: 'Uber Trabalho', amount: 45, date: `${currentMonth}-18`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '3', paymentMethod: PaymentMethod.CREDIT_CARD, cardId: 'c1', isFixed: false },
  
  // Installments example (iPhone)
  { id: 't9', description: 'iPhone 15 Pro', amount: 600, date: `${currentMonth}-20`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '6', paymentMethod: PaymentMethod.CREDIT_CARD, cardId: 'c2', isFixed: false, installments: { current: 3, total: 12, originalTotalAmount: 7200 }, tag: 'eletrônicos' },
  
  // Past Data for charts (Mocking history)
  { id: 't10', description: 'Compras Mês Passado', amount: 3200, date: `${lastMonth}-15`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '2', paymentMethod: PaymentMethod.CREDIT_CARD, cardId: 'c1', isFixed: false },
  { id: 't11', description: 'Aluguel Mês Passado', amount: 2800, date: `${lastMonth}-10`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '1', paymentMethod: PaymentMethod.PIX, isFixed: true },
  { id: 't12', description: 'Gastos 2 Meses Atrás', amount: 4100, date: `${twoMonthsAgo}-15`, type: TransactionType.EXPENSE, status: TransactionStatus.PAID, categoryId: '2', paymentMethod: PaymentMethod.CREDIT_CARD, cardId: 'c1', isFixed: false },
];