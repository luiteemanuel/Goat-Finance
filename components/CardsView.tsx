import React from 'react';
import { CreditCard, Transaction, TransactionType } from '../types';
import BankConnect from './BankConnect';
import { getCurrentCycleSnapshot, getInvoiceCycleFromDate } from '../lib/creditCardBilling';

interface CardsViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  onAddCard: (card: CreditCard) => void;
  onSyncPluggy?: (itemId: string) => void;
}

const CardsView: React.FC<CardsViewProps> = ({ cards, transactions, onAddCard, onSyncPluggy }) => {
  const handleAddCard = () => {
    const name = prompt('Nome do Cartao (ex: Nubank):');
    if (!name) return;

    const limit = Number(prompt('Limite do Cartao (ex: 5000):'));
    if (!limit) return;

    const dueDay = Number(prompt('Dia de Vencimento (ex: 10):'));
    const closingDay = Number(prompt('Dia de Fechamento (ex: 26):'));

    const newCard: CreditCard = {
      id: Date.now().toString(),
      name,
      limit,
      dueDay,
      closingDay,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      brand: 'visa'
    };

    onAddCard(newCard);
  };

  const getCardStats = (card: CreditCard) => {
    const cycle = getCurrentCycleSnapshot(card);
    const cardExpenses = transactions.filter(
      t => t.cardId === card.id && t.type === TransactionType.EXPENSE
    );

    const amountForInvoice = (invoiceId: string) =>
      cardExpenses.reduce((sum, t) => {
        const txInvoiceId = t.invoiceId || getInvoiceCycleFromDate(t.date, card).invoiceId;
        return txInvoiceId === invoiceId ? sum + (Number(t.amount) || 0) : sum;
      }, 0);

    const closedInvoiceAmount = amountForInvoice(cycle.closedInvoiceId);
    const openInvoiceAmount = amountForInvoice(cycle.openInvoiceId);
    const totalUsed = closedInvoiceAmount + openInvoiceAmount;

    const closedPfAmount = cardExpenses
      .filter(t => (t.invoiceId || getInvoiceCycleFromDate(t.date, card).invoiceId) === cycle.closedInvoiceId && t.accountScope === 'PF')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const closedPjAmount = cardExpenses
      .filter(t => (t.invoiceId || getInvoiceCycleFromDate(t.date, card).invoiceId) === cycle.closedInvoiceId && t.accountScope === 'PJ')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      closedInvoiceAmount,
      openInvoiceAmount,
      totalUsed,
      closedInvoiceDueDate: cycle.closedInvoiceDueDate,
      openInvoiceClosingDate: cycle.openInvoiceClosingDate,
      closedPfAmount,
      closedPjAmount
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Meus Cartoes</h2>
        <div className="flex gap-2">
          {onSyncPluggy && (
            <BankConnect
              onSuccess={(data) => onSyncPluggy(data.item.id)}
              onError={(err) => console.error(err)}
            />
          )}
          <button
            onClick={handleAddCard}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
          >
            <i className="fa-solid fa-plus mr-2"></i> Novo Cartao
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => {
          const {
            closedInvoiceAmount,
            openInvoiceAmount,
            totalUsed,
            closedInvoiceDueDate,
            openInvoiceClosingDate,
            closedPfAmount,
            closedPjAmount
          } = getCardStats(card);

          const available = card.limit - totalUsed;
          const progress = (totalUsed / card.limit) * 100;

          return (
            <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-6 text-white relative h-48 flex flex-col justify-between" style={{ backgroundColor: card.color }}>
                <div className="flex justify-between items-start">
                  <i className={`fa-brands fa-cc-${card.brand || 'visa'} text-3xl opacity-80`}></i>
                  <span className="text-xs font-mono opacity-70">**** 1234</span>
                </div>
                <div>
                  <p className="text-xs opacity-70 uppercase mb-1">Fatura Fechada</p>
                  <p className="text-2xl font-bold">R$ {closedInvoiceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex justify-between text-xs opacity-80">
                  <span>{card.name}</span>
                  <span>Vence em {new Date(`${closedInvoiceDueDate}T00:00:00`).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="text-xs text-slate-500 mb-3 bg-slate-50 rounded-lg p-2">
                  Fatura aberta: <strong>R$ {openInvoiceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> (fecha em {new Date(`${openInvoiceClosingDate}T00:00:00`).toLocaleDateString('pt-BR')})
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Limite Utilizado</span>
                  <span className="font-bold text-slate-700">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                  <div
                    className={`h-2 rounded-full ${progress > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Limite Total</p>
                    <p className="font-medium text-slate-700">R$ {card.limit.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Disponivel</p>
                    <p className="font-medium text-emerald-600">R$ {available.toLocaleString()}</p>
                  </div>
                </div>

                {(closedPfAmount > 0 || closedPjAmount > 0) && (
                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div className="bg-blue-50 text-blue-700 rounded-lg p-2">PF: R$ {closedPfAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="bg-amber-50 text-amber-700 rounded-lg p-2">PJ: R$ {closedPjAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                )}

                {progress > 90 && (
                  <div className="mt-4 text-xs bg-red-50 text-red-600 p-2 rounded flex items-center">
                    <i className="fa-solid fa-circle-exclamation mr-2"></i>
                    Atencao: Limite proximo de estourar.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CardsView;
