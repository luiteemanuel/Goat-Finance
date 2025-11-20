import React, { useState } from 'react';
import { Goal } from '../types';

interface GoalsProps {
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
}

const Goals: React.FC<GoalsProps> = ({ goals, onAddGoal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    deadline: '',
    icon: 'fa-star',
    color: '#6366f1'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.name && newGoal.targetAmount) {
      onAddGoal({
        ...newGoal,
        id: Date.now().toString(),
      } as Goal);
      setIsModalOpen(false);
      setNewGoal({ name: '', targetAmount: 0, currentAmount: 0, deadline: '', icon: 'fa-star', color: '#6366f1' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Metas Financeiras</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center"
        >
          <i className="fa-solid fa-plus mr-2"></i> Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const remaining = goal.targetAmount - goal.currentAmount;

          return (
            <div key={goal.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: goal.color }}>
                      <i className={`fa-solid ${goal.icon}`}></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{goal.name}</h3>
                      <p className="text-xs text-slate-500">Meta: R$ {goal.targetAmount.toLocaleString()}</p>
                    </div>
                 </div>
               </div>

               <div className="flex-1 mb-4">
                 <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500 font-medium">Progresso</span>
                    <span className="text-primary font-bold">{Math.round(progress)}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }}></div>
                 </div>
               </div>

               <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-50">
                  <div>
                     <p className="text-slate-400 text-xs">Guardado</p>
                     <p className="font-bold text-slate-700">R$ {goal.currentAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-slate-400 text-xs">Falta</p>
                     <p className="font-bold text-slate-700">R$ {remaining.toLocaleString()}</p>
                  </div>
               </div>
               
               {goal.deadline && (
                  <div className="mt-3 text-xs text-slate-400 text-center bg-slate-50 py-1 rounded">
                     Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                  </div>
               )}
            </div>
          )
        })}
      </div>

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Criar Nova Meta</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome da Meta</label>
                  <input 
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20" 
                    value={newGoal.name}
                    onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Valor Alvo</label>
                      <input 
                        required type="number"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200" 
                        value={newGoal.targetAmount || ''}
                        onChange={e => setNewGoal({...newGoal, targetAmount: Number(e.target.value)})}
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Já Guardado</label>
                      <input 
                        type="number"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200" 
                        value={newGoal.currentAmount || ''}
                        onChange={e => setNewGoal({...newGoal, currentAmount: Number(e.target.value)})}
                      />
                   </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Data Limite</label>
                    <input 
                        type="date"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200" 
                        value={newGoal.deadline}
                        onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                    />
                </div>
                <div className="flex gap-2 justify-end mt-6">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Cancelar</button>
                   <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700">Salvar Meta</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;