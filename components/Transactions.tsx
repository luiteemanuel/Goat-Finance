import React, { useState } from 'react';
import { Transaction, TransactionType, Category, CreditCard, PaymentMethod, TransactionStatus } from '../types';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  onAddTransaction: (t: Transaction) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, cards, onAddTransaction, selectedMonth, onMonthChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.DEBIT_CARD);
  const [cardId, setCardId] = useState(cards[0]?.id || '');
  const [installments, setInstallments] = useState('1');
  const [isFixed, setIsFixed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numInstallments = parseInt(installments);
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      type,
      status: TransactionStatus.PAID,

      categoryId: type === TransactionType.INCOME ? 'income' : categoryId,
      paymentMethod,
      cardId: paymentMethod === PaymentMethod.CREDIT_CARD ? cardId : undefined,
      installments: paymentMethod === PaymentMethod.CREDIT_CARD && numInstallments > 1 ? {
        current: 1,
        total: numInstallments,
        originalTotalAmount: parseFloat(amount) * numInstallments // Simplification: User enters monthly amount
      } : undefined,
      isFixed
    };

    onAddTransaction(newTransaction);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setIsFixed(false);
    setInstallments('1');
  };

  const filteredTransactions = transactions.filter(t => {
    if (!t.date.startsWith(selectedMonth)) return false;
    if (filter === 'income') return t.type === TransactionType.INCOME;
    if (filter === 'expense') return t.type === TransactionType.EXPENSE;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Saídas
          </button>
        </div>

        <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-sm order-last sm:order-none">
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

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center justify-center"
        >
          <i className="fa-solid fa-plus mr-2"></i> Nova Transação
        </button>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Categoria</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Data</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((t) => {
              const category = categories.find(c => c.id === t.categoryId);
              const card = t.cardId ? cards.find(c => c.id === t.cardId) : null;

              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                        <i className={`fa-solid ${category?.icon || 'fa-circle'} text-sm`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{t.description}</p>
                        <p className="text-xs text-slate-500">
                          {t.paymentMethod === PaymentMethod.CREDIT_CARD ? (
                            <span className="flex items-center gap-1">
                              <i className="fa-regular fa-credit-card"></i> {card?.name}
                              {t.installments && ` (${t.installments.current}/${t.installments.total})`}
                            </span>
                          ) : t.paymentMethod}
                          {t.isFixed && <span className="ml-2 bg-slate-100 px-1.5 rounded text-[10px]">Fixo</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-800'}`}>
                      {category?.name || (t.type === TransactionType.INCOME ? 'Receita' : 'Sem Categoria')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            Nenhuma transação encontrada.
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Nova Transação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === TransactionType.EXPENSE ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-500'}`}
                  onClick={() => setType(TransactionType.EXPENSE)}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === TransactionType.INCOME ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-500'}`}
                  onClick={() => setType(TransactionType.INCOME)}
                >
                  Receita
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ex: Supermercado"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Valor</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>

                {type === TransactionType.EXPENSE && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Categoria</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Método de Pagamento</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {paymentMethod === PaymentMethod.CREDIT_CARD && (
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Qual Cartão?</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                      value={cardId}
                      onChange={e => setCardId(e.target.value)}
                    >
                      {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                      value={installments}
                      onChange={e => setInstallments(e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">Valor por parcela será R$ {amount}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fixed"
                  checked={isFixed}
                  onChange={e => setIsFixed(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="fixed" className="text-sm text-slate-600">É uma despesa fixa/recorrente?</label>
              </div>

              <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-900 mt-4">
                Adicionar Transação
              </button>
            </form>
          </div>
        </div >
      )}
    </div >
  );
};

export default Transactions;