import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction, TransactionType, Category } from '../types';

interface ReportsProps {
  transactions: Transaction[];
  categories: Category[];
}

const Reports: React.FC<ReportsProps> = ({ transactions, categories }) => {

  // Prepare data for Evolution Chart (last 6 months mock logic)
  // In a real app, this would aggregate by date key YYYY-MM
  const evolutionData = [
    { name: '5 Meses Atrás', income: 7800, expense: 5200 },
    { name: '4 Meses Atrás', income: 8100, expense: 6100 },
    { name: '3 Meses Atrás', income: 8000, expense: 5500 },
    { name: '2 Meses Atrás', income: 8500, expense: 7000 },
    { name: 'Mês Passado', income: 8500, expense: 6800 },
    { name: 'Atual', income: 9700, expense: 4200 }, // Based on mock transactions
  ];

  // Top Expenses
  const topExpenses = [...transactions]
    .filter(t => t.type === TransactionType.EXPENSE)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const handleExport = () => {
     window.print();
     // In real implementation: generate PDF or CSV blob
     alert("Simulando download do relatório PDF...");
  };

  const generateMonthlySummary = () => {
     alert("Gerando resumo inteligente do mês com IA... (Simulação)");
     // Here we would call GeminiService to generate a text summary
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div>
             <h2 className="text-xl font-bold text-slate-800">Relatórios Inteligentes</h2>
             <p className="text-sm text-slate-500">Análise profunda das suas finanças</p>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={generateMonthlySummary}
               className="hidden sm:flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100"
             >
               <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> Resumo IA
             </button>
             <button 
               onClick={handleExport}
               className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
             >
               <i className="fa-solid fa-file-export mr-2"></i> Exportar
             </button>
          </div>
       </div>

       {/* Evolution Chart */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Evolução Financeira (6 Meses)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" name="Receitas" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
       </div>

       {/* Top Expenses */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
             <h3 className="text-lg font-bold text-slate-800">Top 10 Despesas</h3>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                 <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Data</th>
                 <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Valor</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {topExpenses.map(t => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 text-sm font-medium text-slate-800">{t.description}</td>
                       <td className="px-6 py-4 text-sm text-slate-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            {cat?.name}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                       <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">R$ {t.amount.toFixed(2)}</td>
                    </tr>
                  )
               })}
            </tbody>
          </table>
       </div>
    </div>
  );
};

export default Reports;