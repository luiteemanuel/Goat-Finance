import React, { useState, useEffect } from 'react';
import { getFinancialAdvice, parseReceiptImage } from '../services/geminiService';
import { Transaction, Category, CreditCard, AIAdvice } from '../types';

interface AIAssistantProps {
  transactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  onAddTransaction: (t: Partial<Transaction>) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ transactions, categories, cards, onAddTransaction }) => {
  const [advice, setAdvice] = useState<AIAdvice[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<Partial<Transaction> | null>(null);

  // Auto-load advice on mount
  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      const tips = await getFinancialAdvice(transactions, categories, cards);
      setAdvice(tips);
      setLoading(false);
    };
    if (transactions.length > 0) {
        fetchAdvice();
    }
  }, [transactions.length]); // Simple dependency check

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      
      const result = await parseReceiptImage(base64Data);
      setOcrResult(result);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const confirmOcrTransaction = () => {
    if (ocrResult) {
      onAddTransaction(ocrResult);
      setOcrResult(null);
      alert("Transação adicionada com sucesso!");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10">
            <i className="fa-solid fa-robot text-9xl transform translate-x-10 -translate-y-10"></i>
        </div>
        <h2 className="text-3xl font-bold mb-2">FinFlow AI</h2>
        <p className="text-indigo-100 mb-6 max-w-xl">
          Seu assistente financeiro inteligente. Analiso seus gastos, identifico padrões e sugiro onde você pode economizar.
        </p>
        
        <div className="flex flex-wrap gap-4">
           <label className="cursor-pointer bg-white/20 hover:bg-white/30 transition-colors px-6 py-3 rounded-xl font-medium flex items-center backdrop-blur-sm">
             <i className="fa-solid fa-camera mr-2"></i>
             Ler Recibo (OCR)
             <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
           </label>
        </div>
      </div>

      {/* OCR Confirmation Modal / Card */}
      {ocrResult && (
         <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-primary animate-bounce-in">
            <h3 className="text-lg font-bold mb-4">Confirmar Leitura do Recibo</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-xs text-slate-500">Descrição</label>
                    <div className="font-medium">{ocrResult.description}</div>
                </div>
                <div>
                    <label className="text-xs text-slate-500">Valor</label>
                    <div className="font-medium text-emerald-600">R$ {ocrResult.amount}</div>
                </div>
                <div>
                    <label className="text-xs text-slate-500">Data</label>
                    <div className="font-medium">{ocrResult.date}</div>
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={confirmOcrTransaction}
                    className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                    Confirmar & Adicionar
                </button>
                <button 
                    onClick={() => setOcrResult(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                    Cancelar
                </button>
            </div>
         </div>
      )}

      {uploading && (
          <div className="text-center py-12">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary mb-3"></i>
              <p className="text-slate-500">Processando imagem com Gemini...</p>
          </div>
      )}

      <h3 className="text-xl font-bold text-slate-800 mt-8">Sugestões para Você</h3>
      
      {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[1,2,3].map(i => (
                 <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
             ))}
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advice.map((tip, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${
                            tip.type === 'alert' ? 'bg-red-100 text-red-600' : 
                            tip.type === 'optimization' ? 'bg-emerald-100 text-emerald-600' : 
                            'bg-blue-100 text-blue-600'
                        }`}>
                            <i className={`fa-solid ${
                                tip.type === 'alert' ? 'fa-triangle-exclamation' : 
                                tip.type === 'optimization' ? 'fa-lightbulb' : 
                                'fa-trophy'
                            }`}></i>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                            {tip.type}
                        </span>
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">{tip.title}</h4>
                    <p className="text-sm text-slate-600 flex-1 mb-4">{tip.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Impacto Estimado</span>
                        <span className="font-bold text-primary">{tip.impact}</span>
                    </div>
                </div>
            ))}
            {advice.length === 0 && !loading && (
                <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-400">Nenhuma sugestão disponível no momento. Adicione mais transações!</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;