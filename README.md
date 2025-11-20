<div align="center">
  <h1>🐐 Goat Finance</h1>
  <p>Seu gerenciador financeiro pessoal inteligente, impulsionado por IA.</p>
</div>

## 🚀 Funcionalidades

### 📊 Dashboard Financeiro
- Visão geral completa de saldo, receitas e despesas.
- Gráficos intuitivos para acompanhar a evolução do seu patrimônio.
- Resumo mensal de gastos por categoria.

### 💸 Gestão de Transações
- Adicione receitas e despesas facilmente.
- Categorize seus gastos para melhor organização.
- Histórico detalhado de todas as movimentações.

### 💳 Cartões de Crédito
- Controle o limite e o uso de múltiplos cartões.
- Acompanhe a data de fechamento e vencimento das faturas.
- Visualização clara do disponível vs. utilizado.

### 🤖 Assistente IA (Gemini)
- **Dicas Personalizadas**: Receba conselhos financeiros baseados nos seus hábitos de consumo.
- **Leitura de Recibos (OCR)**: Tire uma foto ou faça upload de um recibo e deixe a IA preencher os dados da transação automaticamente.

### 🎯 Metas Financeiras
- Defina objetivos de economia (ex: Viagem, Reserva de Emergência).
- Acompanhe o progresso visualmente.

### 📈 Relatórios
- Análises profundas sobre seus hábitos financeiros.
- Identifique onde você pode economizar mais.

---

## 🛠️ Como Rodar Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- Uma chave de API do Google Gemini (gratuita no [Google AI Studio](https://aistudio.google.com/))

### Passo a Passo

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure a Chave de API:**
   - Crie um arquivo chamado `.env` na raiz do projeto.
   - Adicione sua chave da seguinte forma:
     ```env
     GEMINI_API_KEY=sua_chave_aqui
     ```

3. **Inicie o Servidor:**
   ```bash
   npm run dev
   ```

4. **Acesse o App:**
   - Abra seu navegador em `http://localhost:3000`

---

## 📱 Tecnologias
- **Frontend**: React, Vite, TypeScript
- **Estilização**: TailwindCSS
- **IA**: Google Gemini SDK
- **Ícones**: FontAwesome
