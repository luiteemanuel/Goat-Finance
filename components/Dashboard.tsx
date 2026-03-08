import React, { useMemo } from 'react';
import BankConnect from './BankConnect';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Transaction, Category, CreditCard, TransactionType, PaymentMethod, TransactionStatus } from '../types';
import { getInvoiceCycleFromDate } from '../lib/creditCardBilling';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onSyncPluggy?: (itemId: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#cbd5e1'];
const PAYMENT_COLORS: Record<string, string> = {
  [PaymentMethod.CREDIT_CARD]: '#8b5cf6',
  [PaymentMethod.DEBIT_CARD]: '#10b981',
  [PaymentMethod.PIX]: '#f59e0b',
  [PaymentMethod.CASH]: '#64748b',
  [PaymentMethod.TRANSFER]: '#3b82f6',
};

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, cards, selectedMonth, onMonthChange, onSyncPluggy }) => {
  const cardsById = useMemo(
    () => new Map(cards.map(card => [card.id, card])),
    [cards]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Credit card expenses are accounted by invoice cycle month, not purchase date month.
      if (t.type === TransactionType.EXPENSE && t.paymentMethod === PaymentMethod.CREDIT_CARD && t.cardId) {
        const card = cardsById.get(t.cardId);
        if (!card) return t.date.startsWith(selectedMonth);
        const invoiceMonth = (t.invoiceId || getInvoiceCycleFromDate(t.date, card).invoiceId).slice(0, 7);
        return invoiceMonth === selectedMonth;
      }

      return t.date.startsWith(selectedMonth);
    });
  }, [transactions, selectedMonth, cardsById]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1); // Month is 0-indexed, so current is month-1, prev is month-2
    onMonthChange(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1); // Current is month-1, next is month
    onMonthChange(date.toISOString().slice(0, 7));
  };

  const formatMonth = (isoMonth: string) => {
    const [year, month] = isoMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME) income += t.amount;
      else expense += t.amount;
    });

    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Outros';
        data[catName] = (data[catName] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions, categories]);

  const paymentMethodData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        data[t.paymentMethod] = (data[t.paymentMethod] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const cardData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.cardId)
      .forEach(t => {
        const cardName = cards.find(c => c.id === t.cardId)?.name || 'Desconhecido';
        data[cardName] = (data[cardName] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions, cards]);

  // Recurring Expenses logic
  const recurringExpenses = filteredTransactions.filter(t => t.isFixed && t.type === TransactionType.EXPENSE);
  const recurringPaid = recurringExpenses.filter(t => t.status === TransactionStatus.PAID);
  const recurringPending = recurringExpenses.filter(t => t.status === TransactionStatus.PENDING);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stylish Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-10 transform rotate-12">
          <img src="/goat-icon.png" alt="Goat Logo" className="w-48 h-48 object-contain grayscale invert" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-indigo-500/30">
              <img src="/goat-icon.png" alt="Goat Logo" className="w-8 h-8 object-contain" />
            </div>
            Goat Finance
          </h2>
          <p className="text-slate-400 font-medium ml-1">
            Seu patrimônio, sempre no topo. 🐐
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-md text-slate-600">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <span className="px-4 font-medium text-slate-700 capitalize min-w-[140px] text-center">
            {formatMonth(selectedMonth)}
          </span>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-md text-slate-600">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div className="text-sm text-primary font-medium hover:underline flex items-center">
          {onSyncPluggy ? (
            <BankConnect onSuccess={(data) => onSyncPluggy(data.item.id)} onError={(error) => console.error(error)} />
          ) : (
            <button className="text-sm text-primary font-medium hover:underline flex items-center" disabled>
              <i className="fa-solid fa-rotate mr-2"></i> Sincronizar Open Finance (Indisponível)
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Entradas</p>
              <h3 className="text-2xl font-bold text-emerald-600">
                R$ {summary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <i className="fa-solid fa-arrow-trend-up"></i>
            </div>
          </div>
          <div className="text-xs text-slate-400">+2.5% vs mês passado</div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Saídas</p>
              <h3 className="text-2xl font-bold text-rose-600">
                R$ {summary.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <i className="fa-solid fa-arrow-trend-down"></i>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {recurringPending.length} contas fixas pendentes
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Saldo</p>
              <h3 className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-primary">
              <i className="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div className="text-xs text-slate-400">Disponível para investir</div>
        </div>
      </div>

      {/* Recurring Expenses Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <i className="fa-solid fa-calendar-check mr-2 text-slate-400"></i>
            Contas Fixas do Mês
          </h4>
          <div className="space-y-3">
            {recurringExpenses.length === 0 && <p className="text-slate-400 text-sm">Nenhuma conta fixa cadastrada.</p>}
            {recurringExpenses.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${t.status === TransactionStatus.PAID ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.paymentMethod}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-700">R$ {t.amount.toFixed(2)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold ${t.status === TransactionStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {t.status === TransactionStatus.PAID ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-2">Formas de Pagamento</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Gastos por Categoria</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Usage Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Fatura por Cartão</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cardData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Alertas de Orçamento</h4>
        <div className="space-y-4">
          {categories.map(cat => {
            const spent = filteredTransactions
              .filter(t => t.categoryId === cat.id && t.type === TransactionType.EXPENSE)
              .reduce((sum, t) => sum + t.amount, 0);
            const percentage = (spent / cat.budgetLimit) * 100;

            if (percentage < 10) return null; // Hide very low usage

            let colorClass = "bg-emerald-500";
            if (percentage > 80) colorClass = "bg-amber-500";
            if (percentage >= 100) colorClass = "bg-red-500";

            return (
              <div key={cat.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{cat.name}</span>
                  <span className={`font-medium ${percentage >= 100 ? 'text-red-600' : 'text-slate-600'}`}>
                    {Math.round(percentage)}% (R$ {spent} / R$ {cat.budgetLimit})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
