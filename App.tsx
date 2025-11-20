import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import CardsView from './components/CardsView';
import AIAssistant from './components/AIAssistant';
import Goals from './components/Goals';
import Reports from './components/Reports';
import LoginScreen from './components/LoginScreen';
import { Transaction, Goal } from './types';
import { useFinanceData } from './hooks/useFinanceData';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Custom Hook for Data Persistence
  const { 
    user, 
    login, 
    logout, 
    resetData,
    transactions, 
    categories, 
    cards, 
    goals, 
    addTransaction, 
    addGoal 
  } = useFinanceData();

  const handleAddTransaction = (newTransaction: Partial<Transaction>) => {
    const t = {
        ...newTransaction,
        id: Date.now().toString(),
        categoryId: newTransaction.categoryId || categories[0].id,
        type: newTransaction.type || 'EXPENSE',
    } as Transaction;
    
    addTransaction(t);
  };

  const handleAddGoal = (newGoal: Goal) => {
     addGoal(newGoal);
  };

  if (!user) {
    return <LoginScreen onLogin={login} />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <Dashboard transactions={transactions} categories={categories} cards={cards} />;
      case 'transactions':
        return <Transactions transactions={transactions} categories={categories} cards={cards} onAddTransaction={handleAddTransaction} />;
      case 'cards':
        return <CardsView cards={cards} transactions={transactions} />;
      case 'ai':
        return <AIAssistant transactions={transactions} categories={categories} cards={cards} onAddTransaction={handleAddTransaction} />;
      case 'goals':
        return <Goals goals={goals} onAddGoal={handleAddGoal} />;
      case 'reports':
        return <Reports transactions={transactions} categories={categories} />;
      case 'categories':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border-dashed border-2 border-slate-200">
            <i className="fa-solid fa-tags text-4xl text-slate-300 mb-4"></i>
            <h3 className="text-xl font-medium text-slate-500">Gestão de Categorias</h3>
            <p className="text-slate-400 text-sm mt-2">Esta funcionalidade estará disponível em breve.</p>
          </div>
        );
      default:
        return <Dashboard transactions={transactions} categories={categories} cards={cards} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={logout}
      />
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center">
            <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600">
               <i className="fa-solid fa-bars text-lg"></i>
            </button>
            <span className="font-bold text-slate-800 ml-3">Goat Fin</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
             {user.name.substring(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Main Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex justify-between items-end">
               <div>
                 <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab === 'ai' ? 'Assistente AI' : activeTab}</h1>
                 <p className="text-slate-500 text-sm">Olá, {user.name} 👋</p>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-sm text-slate-400 hidden sm:block">{new Date().toLocaleDateString('pt-BR')}</span>
                 <button 
                   onClick={resetData}
                   className="text-xs text-red-500 hover:text-red-700 underline"
                   title="Apagar todos os dados e começar do zero"
                 >
                   Resetar Dados
                 </button>
               </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;