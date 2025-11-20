import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

// Read .env manually to avoid needing dotenv
try {
    const env = fs.readFileSync('.env', 'utf-8');
    const match = env.match(/GEMINI_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error("❌ Erro: Não encontrei GEMINI_API_KEY no arquivo .env");
        process.exit(1);
    }

    console.log("🔑 Chave encontrada. Testando conexão com Gemini...");

    const ai = new GoogleGenAI({ apiKey });

    // Simple test call
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Responda apenas: "API Conectada com Sucesso!"'
    });

    console.log("✅ Sucesso:", response.text);

} catch (error) {
    console.error("❌ Falha no teste:", error.message);
    if (error.message.includes("API_KEY_INVALID")) {
        console.error("👉 A chave parece ser inválida. Verifique se copiou corretamente.");
    }
    process.exit(1);
}
