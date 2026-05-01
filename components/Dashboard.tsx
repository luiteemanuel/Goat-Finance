import React, { useMemo, useState } from 'react';
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
const PAYMENT_LABELS: Record<string, string> = {
  [PaymentMethod.CREDIT_CARD]: 'Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Débito',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.TRANSFER]: 'Transferência',
};

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, cards, selectedMonth, onMonthChange, onSyncPluggy }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const cardsById = useMemo(
    () => new Map(cards.map(card => [card.id, card])),
    [cards]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
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
    const date = new Date(year, month - 2, 1);
    onMonthChange(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
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
    const data: Record<string, { value: number; color: string; id: string; icon: string }> = {};
    filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const catName = cat?.name || 'Outros';
        if (!data[catName]) {
          data[catName] = { value: 0, color: cat?.color || '#cbd5e1', id: cat?.id || '', icon: cat?.icon || 'fa-tag' };
        }
        data[catName].value += t.amount;
      });
    return Object.entries(data)
      .map(([name, d]) => ({ name, value: d.value, color: d.color, id: d.id, icon: d.icon }))
      .sort((a, b) => b.value - a.value);
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

  const recurringExpenses = filteredTransactions.filter(t => t.isFixed && t.type === TransactionType.EXPENSE);
  const recurringPending = recurringExpenses.filter(t => t.status === TransactionStatus.PENDING);

  const selectedCategoryObj = selectedCategory ? categories.find(c => c.name === selectedCategory) : null;
  const selectedCategoryEntry = selectedCategory ? categoryData.find(c => c.name === selectedCategory) : null;

  const categoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = categories.find(c => c.name === selectedCategory);
    if (!cat) return [];
    return filteredTransactions
      .filter(t => t.categoryId === cat.id && t.type === TransactionType.EXPENSE)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedCategory, filteredTransactions, categories]);

  const handleCategoryClick = (name: string) => {
    setSelectedCategory(prev => prev === name ? null : name);
  };

  const totalCategoryExpenses = categoryData.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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

      {/* Month Nav */}
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

      {/* Recurring + Payment Method */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart — interactive */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-2">Gastos por Categoria</h4>
          <p className="text-xs text-slate-400 mb-4">Clique em uma categoria para ver os gastos</p>

          {/* Pie chart */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  onClick={(entry) => handleCategoryClick(entry.name)}
                  style={{ cursor: 'pointer' }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                      opacity={selectedCategory && selectedCategory !== entry.name ? 0.35 : 1}
                      stroke={selectedCategory === entry.name ? '#1e293b' : 'none'}
                      strokeWidth={selectedCategory === entry.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category legend — clickable */}
          <div className="mt-4 space-y-2">
            {categoryData.map((entry, index) => {
              const pct = totalCategoryExpenses > 0 ? (entry.value / totalCategoryExpenses) * 100 : 0;
              const isActive = selectedCategory === entry.name;
              return (
                <button
                  key={entry.name}
                  onClick={() => handleCategoryClick(entry.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-slate-100 ring-2 ring-slate-300'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-slate-700 truncate">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-xs text-slate-400">{pct.toFixed(1)}%</span>
                    <span className="text-sm font-semibold text-slate-800">
                      R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <i className={`fa-solid fa-chevron-right text-xs transition-transform ${isActive ? 'rotate-90 text-slate-600' : 'text-slate-300'}`}></i>
                  </div>
                </button>
              );
            })}
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

      {/* Category Drilldown Table */}
      {selectedCategory && selectedCategoryEntry && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: selectedCategoryEntry.color }}
              >
                <i className={`fa-solid ${selectedCategoryEntry.icon || 'fa-tag'}`}></i>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">{selectedCategory}</h4>
                <p className="text-sm text-slate-400">
                  {categoryTransactions.length} transaç{categoryTransactions.length === 1 ? 'ão' : 'ões'} •{' '}
                  Total: <span className="font-semibold text-rose-600">
                    R$ {selectedCategoryEntry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* Table */}
          {categoryTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <i className="fa-solid fa-receipt text-3xl mb-2 block"></i>
              Nenhuma transação nesta categoria neste mês.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Descrição</th>
                    <th className="px-6 py-3 text-left hidden sm:table-cell">Data</th>
                    <th className="px-6 py-3 text-left hidden md:table-cell">Pagamento</th>
                    <th className="px-6 py-3 text-left hidden md:table-cell">Cartão</th>
                    <th className="px-6 py-3 text-center hidden sm:table-cell">Status</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categoryTransactions.map(t => {
                    const card = t.cardId ? cardsById.get(t.cardId) : null;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0"
                              style={{ backgroundColor: selectedCategoryEntry.color }}
                            >
                              <i className={`fa-solid ${selectedCategoryEntry.icon || 'fa-tag'}`}></i>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 text-sm truncate">{t.description}</p>
                              {t.installments && (
                                <p className="text-xs text-slate-400">
                                  Parcela {t.installments.current}/{t.installments.total}
                                </p>
                              )}
                              {t.isFixed && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">Fixo</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell whitespace-nowrap">
                          {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                            {PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">
                          {card ? (
                            <span className="flex items-center gap-1">
                              <i className="fa-solid fa-credit-card text-xs"></i>
                              {card.name}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                          <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wide font-bold ${
                            t.status === TransactionStatus.PAID
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-amber-100 text-amber-600'
                          }`}>
                            {t.status === TransactionStatus.PAID ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-rose-600 whitespace-nowrap">
                            R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={5} className="px-6 py-4 text-sm font-semibold text-slate-600">
                      Total — {selectedCategory}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600 text-base">
                      R$ {selectedCategoryEntry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Budget Alerts */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Alertas de Orçamento</h4>
        <div className="space-y-3">
          {categories.map(cat => {
            const spent = filteredTransactions
              .filter(t => t.categoryId === cat.id && t.type === TransactionType.EXPENSE)
              .reduce((sum, t) => sum + t.amount, 0);
            const percentage = (spent / cat.budgetLimit) * 100;

            if (percentage < 10) return null;

            let colorClass = 'bg-emerald-500';
            if (percentage > 80) colorClass = 'bg-amber-500';
            if (percentage >= 100) colorClass = 'bg-red-500';

            const isActive = selectedCategory === cat.name;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`w-full text-left p-3 rounded-xl transition-all ${
                  isActive ? 'bg-slate-100 ring-2 ring-slate-300' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700 flex items-center gap-2">
                    {cat.icon && <i className={`fa-solid ${cat.icon} text-xs`} style={{ color: cat.color }}></i>}
                    {cat.name}
                  </span>
                  <span className={`font-medium ${percentage >= 100 ? 'text-red-600' : 'text-slate-600'}`}>
                    {Math.round(percentage)}% (R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {cat.budgetLimit})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${colorClass}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
