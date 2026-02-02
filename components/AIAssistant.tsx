import React, { useState, useRef, useEffect } from 'react';
import {
  getFinancialAdvice,
  parseReceiptImage,
  parseNaturalLanguage,
  parseCSVData,
  parsePDFContent,
  generateChatResponse,
  ParsedTransaction,
  ChatMessage
} from '../services/geminiService';
import { Transaction, Category, CreditCard, AIAdvice, TransactionType, TransactionStatus, PaymentMethod } from '../types';

interface AIAssistantProps {
  transactions: Transaction[];
  categories: Category[];
  cards: CreditCard[];
  onAddTransaction: (t: Partial<Transaction>) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ transactions, categories, cards, onAddTransaction }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou o Goat Fin AI, seu assistente financeiro. Você pode:\n\n• Me contar seus gastos naturalmente (ex: "gastei 50 em gasolina")\n• Enviar fotos de recibos/cupons\n• Importar extratos CSV ou PDF\n\nComo posso ajudar?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ParsedTransaction | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, attachment?: ChatMessage['attachment'], parsedTransactions?: ParsedTransaction[]) => {
    setMessages(prev => [...prev, {
      role,
      content,
      timestamp: new Date(),
      attachment,
      parsedTransactions
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    try {
      const result = await parseNaturalLanguage(userMessage, categories);

      if (result.transactions && result.transactions.length > 0) {
        setPendingTransactions(result.transactions);
        setSelectedTransactions(new Set(result.transactions.map((_, i) => i)));
        addMessage('assistant', result.response, undefined, result.transactions);
        setShowConfirmModal(true);
      } else {
        // Generate a regular chat response
        const chatResponse = await generateChatResponse(userMessage, transactions, categories);
        addMessage('assistant', chatResponse);
      }
    } catch (error) {
      addMessage('assistant', 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const fileName = file.name;
    const fileType = file.type;

    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        let parsedTransactions: ParsedTransaction[] = [];
        let attachmentType: 'image' | 'csv' | 'pdf' = 'image';

        if (fileType.startsWith('image/')) {
          attachmentType = 'image';
          addMessage('user', `📷 Enviou uma imagem: ${fileName}`, { type: 'image', name: fileName });
          const base64 = (reader.result as string).split(',')[1];
          parsedTransactions = await parseReceiptImage(base64, fileType) || [];
        } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
          attachmentType = 'csv';
          addMessage('user', `📊 Enviou um CSV: ${fileName}`, { type: 'csv', name: fileName });
          const csvContent = reader.result as string;
          parsedTransactions = await parseCSVData(csvContent);
        } else if (fileType === 'application/pdf') {
          attachmentType = 'pdf';
          addMessage('user', `📄 Enviou um PDF: ${fileName}`, { type: 'pdf', name: fileName });
          const base64 = (reader.result as string).split(',')[1];
          parsedTransactions = await parsePDFContent(base64);
        } else {
          addMessage('assistant', 'Formato de arquivo não suportado. Por favor, envie uma imagem, CSV ou PDF.');
          setIsProcessing(false);
          return;
        }

        if (parsedTransactions.length > 0) {
          setPendingTransactions(parsedTransactions);
          setSelectedTransactions(new Set(parsedTransactions.map((_, i) => i)));
          addMessage(
            'assistant',
            `Encontrei ${parsedTransactions.length} transação(ões) no arquivo! 🎉\n\nRevise e confirme abaixo:`,
            undefined,
            parsedTransactions
          );
          setShowConfirmModal(true);
        } else {
          addMessage('assistant', 'Não consegui identificar transações neste arquivo. Tente outro arquivo ou descreva o gasto manualmente.');
        }
        setIsProcessing(false);
      };

      if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (error) {
      addMessage('assistant', 'Erro ao processar o arquivo. Tente novamente.');
      setIsProcessing(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleTransactionSelection = (index: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTransactions(newSelected);
  };

  const getCategoryId = (categoryName: string): string => {
    const found = categories.find(c => c.name.toLowerCase() === categoryName?.toLowerCase());
    return found?.id || categories[0].id;
  };

  const getPaymentMethod = (method?: string): PaymentMethod => {
    const methodMap: Record<string, PaymentMethod> = {
      'PIX': PaymentMethod.PIX,
      'CREDIT_CARD': PaymentMethod.CREDIT_CARD,
      'DEBIT_CARD': PaymentMethod.DEBIT_CARD,
      'CASH': PaymentMethod.CASH,
      'TRANSFER': PaymentMethod.TRANSFER,
    };
    return methodMap[method || ''] || PaymentMethod.PIX;
  };

  const confirmTransactions = () => {
    let addedCount = 0;

    pendingTransactions.forEach((t, index) => {
      if (selectedTransactions.has(index)) {
        // Ensure type is properly converted to TransactionType enum
        const transactionType = t.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE;

        onAddTransaction({
          description: t.description,
          amount: t.amount,
          date: t.date,
          type: transactionType,
          status: TransactionStatus.PAID,
          categoryId: getCategoryId(t.category || ''),
          paymentMethod: getPaymentMethod(t.paymentMethod),
          isFixed: t.isFixed || false,
        });
        addedCount++;
      }
    });

    addMessage('assistant', `✅ ${addedCount} transação(ões) adicionada(s) com sucesso!`);
    setPendingTransactions([]);
    setSelectedTransactions(new Set());
    setShowConfirmModal(false);
  };

  const cancelTransactions = () => {
    addMessage('assistant', '❌ Transações canceladas. Se precisar, estou aqui!');
    setPendingTransactions([]);
    setSelectedTransactions(new Set());
    setShowConfirmModal(false);
  };

  const startEditing = (transaction: ParsedTransaction, index: number) => {
    setEditingTransaction({ ...transaction });
    setEditingIndex(index);
  };

  const saveEdit = () => {
    if (editingTransaction && editingIndex >= 0) {
      const updated = [...pendingTransactions];
      updated[editingIndex] = editingTransaction;
      setPendingTransactions(updated);
      setEditingTransaction(null);
      setEditingIndex(-1);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 opacity-10">
          <i className="fa-solid fa-robot text-9xl transform translate-x-10 -translate-y-10"></i>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <i className="fa-solid fa-wand-magic-sparkles text-3xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Goat Fin AI</h2>
            <p className="text-white/80 text-sm">Assistente financeiro inteligente • Chat interativo</p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white'
                    }`}>
                    <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs`}></i>
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}>
                    {msg.attachment && (
                      <div className={`flex items-center gap-2 mb-2 text-sm ${msg.role === 'user' ? 'text-white/80' : 'text-slate-500'}`}>
                        <i className={`fa-solid ${msg.attachment.type === 'image' ? 'fa-image' :
                          msg.attachment.type === 'csv' ? 'fa-file-csv' : 'fa-file-pdf'
                          }`}></i>
                        <span>{msg.attachment.name}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
                <div className={`text-xs text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right mr-10' : 'ml-10'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-3 rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-slate-500 text-sm ml-1">Processando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 p-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.csv,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
              title="Enviar arquivo (imagem, CSV ou PDF)"
            >
              <i className="fa-solid fa-paperclip text-lg"></i>
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite aqui... (ex: gastei 50 em gasolina)"
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !inputValue.trim()}
              className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>

          <div className="flex justify-center gap-4 mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
            >
              <i className="fa-solid fa-camera"></i> Foto
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
            >
              <i className="fa-solid fa-file-csv"></i> CSV
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
            >
              <i className="fa-solid fa-file-pdf"></i> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingTransactions.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Confirmar Transações</h3>
                  <p className="text-white/80 text-sm mt-1">
                    {selectedTransactions.size} de {pendingTransactions.length} selecionada(s)
                  </p>
                </div>
                <button
                  onClick={cancelTransactions}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>

            {/* Transaction List */}
            <div className="p-6 overflow-y-auto max-h-[50vh] space-y-3">
              {pendingTransactions.map((t, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${selectedTransactions.has(index)
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  onClick={() => toggleTransactionSelection(index)}
                >
                  {editingIndex === index && editingTransaction ? (
                    /* Edit Mode */
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Descrição</label>
                          <input
                            type="text"
                            value={editingTransaction.description}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Valor</label>
                          <input
                            type="number"
                            value={editingTransaction.amount}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Data</label>
                          <input
                            type="date"
                            value={editingTransaction.date}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">Tipo</label>
                          <select
                            value={editingTransaction.type}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="EXPENSE">Despesa</option>
                            <option value="INCOME">Receita</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-slate-500 block mb-1">Categoria</label>
                          <select
                            value={editingTransaction.category}
                            onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditingTransaction(null); setEditingIndex(-1); }}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedTransactions.has(index) ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                        }`}>
                        {selectedTransactions.has(index) && (
                          <i className="fa-solid fa-check text-white text-xs"></i>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 truncate">{t.description}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === 'INCOME'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {t.type === 'INCOME' ? 'Receita' : 'Despesa'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span><i className="fa-regular fa-calendar mr-1"></i>{t.date}</span>
                          <span><i className="fa-solid fa-tag mr-1"></i>{t.category}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">{t.confidence}% confiança</span>
                        </div>
                      </div>

                      <div className={`text-lg font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); startEditing(t, index); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-6 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  Total selecionado:
                </div>
                <div className="text-xl font-bold text-indigo-600">
                  {formatCurrency(
                    pendingTransactions
                      .filter((_, i) => selectedTransactions.has(i))
                      .reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0)
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelTransactions}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 font-medium transition-colors"
                >
                  <i className="fa-solid fa-xmark mr-2"></i>
                  Cancelar
                </button>
                <button
                  onClick={confirmTransactions}
                  disabled={selectedTransactions.size === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <i className="fa-solid fa-check mr-2"></i>
                  Confirmar ({selectedTransactions.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;