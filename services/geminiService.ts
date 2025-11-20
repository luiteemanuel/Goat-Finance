import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, CreditCard, Category } from "../types";

const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is handled securely

const ai = new GoogleGenAI({ apiKey });

export const getFinancialAdvice = async (
  transactions: Transaction[],
  categories: Category[],
  cards: CreditCard[]
): Promise<any> => {
  if (!apiKey) {
    console.warn("API Key missing for Gemini");
    return [];
  }

  const summary = JSON.stringify({
    transactions: transactions.slice(0, 50), // Limit context size
    categories: categories.map(c => ({ name: c.name, limit: c.budgetLimit })),
    cards: cards.map(c => ({ name: c.name, limit: c.limit }))
  });

  try {
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

export const parseReceiptImage = async (base64Image: string): Promise<Partial<Transaction> | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Extract transaction details from this receipt. Return JSON with: description (merchant name), amount (number), date (YYYY-MM-DD), category (guess based on merchant)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
         responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              category: { type: Type.STRING }
            }
         }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Basic validation
    if (data.amount && data.description) {
      return {
        description: data.description,
        amount: data.amount,
        date: data.date || new Date().toISOString().split('T')[0],
        // Note: You'd need to map the string category to your actual Category IDs in the UI
      };
    }
    return null;

  } catch (error) {
    console.error("Error parsing receipt:", error);
    return null;
  }
};