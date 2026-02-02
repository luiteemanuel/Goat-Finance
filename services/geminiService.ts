import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CreditCard, Category } from "../types";

// The API key must be obtained from the environment variable
const getClient = () => {
  // Vite exposes env variables via import.meta.env with VITE_ prefix
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Google GenAI API Key is missing. Add VITE_GEMINI_API_KEY to your .env file.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export interface ParsedTransaction {
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category?: string;
  paymentMethod?: string;
  isFixed?: boolean;
  confidence: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'csv' | 'pdf';
    name: string;
    preview?: string;
  };
  parsedTransactions?: ParsedTransaction[];
}

export const getFinancialAdvice = async (
  transactions: Transaction[],
  categories: Category[],
  cards: CreditCard[]
): Promise<any> => {
  const summary = JSON.stringify({
    transactions: transactions.slice(0, 50), // Limit context size
    categories: categories.map(c => ({ name: c.name, limit: c.budgetLimit })),
    cards: cards.map(c => ({ name: c.name, limit: c.limit }))
  });

  try {
    const ai = getClient();
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this financial data and provide 3 actionable tips to save money or optimize spending. 
      Focus on category limits, high subscription costs, or credit card usage.
      Return ONLY a JSON array with objects containing: title, description, impact (string), type (optimization|alert|praise).
      Data: ${summary}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["optimization", "alert", "praise"] }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error fetching advice:", error);
    return [];
  }
};

export const parseReceiptImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<ParsedTransaction[] | null> => {
  try {
    const ai = getClient();
    if (!ai) return null;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          {
            text: `Extraia TODAS as transações desta imagem de recibo/fatura. 
          Para cada item encontrado, retorne um JSON array com objetos contendo:
          - description: nome do item/estabelecimento
          - amount: valor numérico (positivo)
          - date: data no formato YYYY-MM-DD (use a data de hoje ${new Date().toISOString().split('T')[0]} se não encontrar)
          - type: "EXPENSE" ou "INCOME" 
          - category: categoria sugerida (Alimentação, Transporte, Moradia, Lazer, Saúde, Serviços/Assinaturas)
          - confidence: 0-100 indicando confiança na extração
          
          Se for um recibo único, retorne apenas uma transação.
          Se for uma fatura com vários itens, retorne todos.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              type: { type: Type.STRING },
              category: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return Array.isArray(data) ? data : [data];

  } catch (error) {
    console.error("Error parsing receipt:", error);
    return null;
  }
};

export const parseNaturalLanguage = async (
  text: string,
  categories: Category[]
): Promise<{ transactions: ParsedTransaction[], response: string }> => {
  try {
    const ai = getClient();
    if (!ai) return { transactions: [], response: "API não disponível." };

    const categoryNames = categories.map(c => c.name).join(', ');
    const today = new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é um assistente financeiro amigável. Analise a mensagem do usuário e extraia transações financeiras.

Mensagem: "${text}"

Categorias disponíveis: ${categoryNames}

Data de hoje: ${today}

Responda em JSON com:
{
  "transactions": [
    {
      "description": "descrição clara do gasto",
      "amount": número positivo,
      "date": "YYYY-MM-DD",
      "type": "EXPENSE" ou "INCOME",
      "category": "uma das categorias disponíveis",
      "paymentMethod": "PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH" ou "TRANSFER",
      "isFixed": false,
      "confidence": 0-100
    }
  ],
  "response": "resposta amigável confirmando o que entendeu ou pedindo mais informações"
}

Exemplos de interpretação:
- "gastei 50 em gasolina" -> Transporte, R$50, EXPENSE
- "recebi 3000 de salário" -> INCOME
- "paguei 150 na luz" -> Moradia, EXPENSE
- "comprei almoço por 25" -> Alimentação, EXPENSE
- "uber de 30 reais" -> Transporte, EXPENSE

Se a mensagem não contiver transação, retorne transactions vazio e responda normalmente.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  date: { type: Type.STRING },
                  type: { type: Type.STRING },
                  category: { type: Type.STRING },
                  paymentMethod: { type: Type.STRING },
                  isFixed: { type: Type.BOOLEAN },
                  confidence: { type: Type.NUMBER }
                }
              }
            },
            response: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"transactions":[],"response":"Erro ao processar."}');

  } catch (error) {
    console.error("Error parsing natural language:", error);
    return { transactions: [], response: "Desculpe, ocorreu um erro ao processar sua mensagem." };
  }
};

export const parseCSVData = async (csvContent: string): Promise<ParsedTransaction[]> => {
  try {
    const ai = getClient();
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analise este CSV de transações financeiras e extraia cada linha como uma transação.
      
CSV:
${csvContent.slice(0, 10000)}

Retorne um JSON array onde cada transação tem:
- description: descrição/estabelecimento
- amount: valor absoluto (número positivo)
- date: data no formato YYYY-MM-DD
- type: "EXPENSE" se valor negativo ou débito, "INCOME" se crédito
- category: categoria sugerida (Alimentação, Transporte, Moradia, Lazer, Saúde, Serviços/Assinaturas)
- confidence: 0-100

Ignore headers e linhas em branco. Detecte automaticamente o formato de data e separadores.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              type: { type: Type.STRING },
              category: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');

  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
};

export const parsePDFContent = async (base64PDF: string): Promise<ParsedTransaction[]> => {
  try {
    const ai = getClient();
    if (!ai) return [];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64PDF } },
          {
            text: `Analise este PDF de extrato/fatura bancária e extraia TODAS as transações.

Para cada transação encontrada, retorne:
- description: descrição do estabelecimento/transação
- amount: valor absoluto (número positivo)
- date: data no formato YYYY-MM-DD
- type: "EXPENSE" se débito/saída, "INCOME" se crédito/entrada
- category: categoria sugerida (Alimentação, Transporte, Moradia, Lazer, Saúde, Serviços/Assinaturas)
- confidence: 0-100 indicando confiança na extração

Ignore saldos, taxas bancárias internas e informações de cabeçalho.
Foque apenas nas transações reais de compra/recebimento.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              type: { type: Type.STRING },
              category: { type: Type.STRING },
              confidence: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');

  } catch (error) {
    console.error("Error parsing PDF:", error);
    return [];
  }
};

export const generateChatResponse = async (
  message: string,
  transactions: Transaction[],
  categories: Category[]
): Promise<string> => {
  try {
    const ai = getClient();
    if (!ai) return "API não disponível.";

    const financialContext = {
      totalTransactions: transactions.length,
      recentTransactions: transactions.slice(0, 10).map(t => ({
        desc: t.description,
        amount: t.amount,
        type: t.type,
        date: t.date
      })),
      categories: categories.map(c => c.name)
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é o Goat Fin AI, um assistente financeiro amigável e inteligente.
      
Contexto financeiro do usuário:
${JSON.stringify(financialContext)}

Mensagem do usuário: "${message}"

Responda de forma amigável, útil e concisa em português brasileiro.
Se o usuário perguntar sobre finanças, use o contexto para dar respostas personalizadas.
Se for uma pergunta geral, responda naturalmente.
Use emojis ocasionalmente para ser mais amigável.`
    });

    return response.text || "Desculpe, não consegui processar sua mensagem.";

  } catch (error) {
    console.error("Error generating chat response:", error);
    return "Desculpe, ocorreu um erro ao processar sua mensagem.";
  }
};