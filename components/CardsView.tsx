import React from 'react';
import { CreditCard, Transaction, TransactionType } from '../types';

interface CardsViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  onAddCard: (card: CreditCard) => void;
}

const CardsView: React.FC<CardsViewProps> = ({ cards, transactions, onAddCard }) => {

  const handleAddCard = () => {
    const name = prompt("Nome do Cartão (ex: Nubank):");
    if (!name) return;

    const limit = Number(prompt("Limite do Cartão (ex: 5000):"));
    if (!limit) return;

    const dueDay = Number(prompt("Dia de Vencimento (ex: 10):"));
    const closingDay = Number(prompt("Dia de Fechamento (ex: 3):"));

    const newCard: CreditCard = {
      id: Date.now().toString(), // Temp ID
      name,
      limit,
      dueDay,
      closingDay,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
      brand: 'visa' // Default
    };

    onAddCard(newCard);
  };

  const getCardStats = (cardId: string) => {
    const currentInvoice = transactions
      .filter(t => t.cardId === cardId && t.type === 'EXPENSE') // Fixed enum access
      .reduce((sum, t) => sum + t.amount, 0);

    return { currentInvoice };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Meus Cartões</h2>
        <button
          onClick={handleAddCard}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
        >
          <i className="fa-solid fa-plus mr-2"></i> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => {
          const { currentInvoice } = getCardStats(card.id);
          const available = card.limit - currentInvoice;
          const progress = (currentInvoice / card.limit) * 100;

          return (
            <div key={card.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              {/* Visual Card Representation */}
              <div className="p-6 text-white relative h-48 flex flex-col justify-between" style={{ backgroundColor: card.color }}>
                <div className="flex justify-between items-start">
                  <i className={`fa-brands fa-cc-${card.brand} text-3xl opacity-80`}></i>
                  <span className="text-xs font-mono opacity-70">**** 1234</span>
                </div>
                <div>
                  <p className="text-xs opacity-70 uppercase mb-1">Current Balance</p>
                  <p className="text-2xl font-bold">R$ {currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex justify-between text-xs opacity-80">
                  <span>{card.name}</span>
                  <span>Vence dia {card.dueDay}</span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 flex-1 flex flex-col">
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
                    <p className="text-slate-400 text-xs">Disponível</p>
                    <p className="font-medium text-emerald-600">R$ {available.toLocaleString()}</p>
                  </div>
                </div>

                {progress > 90 && (
                  <div className="mt-4 text-xs bg-red-50 text-red-600 p-2 rounded flex items-center">
                    <i className="fa-solid fa-circle-exclamation mr-2"></i>
                    Atenção: Limite próximo de estourar.
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default CardsView;