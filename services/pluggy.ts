const CLIENT_ID = import.meta.env.VITE_PLUGGY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_PLUGGY_CLIENT_SECRET;
const BASE_URL = '/api/pluggy';

// AVISO DE SEGURANÇA:
// Em um aplicativo de produção, você NUNCA deve expor o CLIENT_SECRET no frontend.
// O ideal é ter um backend que gera o 'connectToken' e o envia para o frontend.
// Como estamos em um ambiente local/pessoal, faremos isso aqui para simplificar.

// Internal helper to get connect token directly (not exported)
const fetchConnectToken = async () => {
    try {
        const response = await fetch(`${BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get connect token: ${response.statusText}`);
        }

        const data = await response.json();
        return data.accessToken;
    } catch (error) {
        console.error("Erro ao criar connect token:", error);
        throw error;
    }
};

// Helper to get API Key first (needed for other calls)
let cachedApiKey: string | null = null;
const getApiKey = async () => {
    if (cachedApiKey) return cachedApiKey;

    const response = await fetch(`${BASE_URL}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to authenticate: ${response.statusText}`);
    }

    const data = await response.json();
    cachedApiKey = data.apiKey;
    return data.apiKey;
};

// Override getConnectToken to actually get a connect token for the widget
export const createConnectToken = async () => {
    try {
        const apiKey = await getApiKey();
        const response = await fetch(`${BASE_URL}/connect_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`Failed to create connect token: ${response.statusText}`);
        }

        const data = await response.json();
        return data.accessToken;
    } catch (error) {
        console.error("Erro ao criar connect token:", error);
        throw error;
    }
};

// Export the one used by the component (aliasing for compatibility)
export { createConnectToken as getConnectToken };

export const getAccounts = async (itemId: string) => {
    try {
        const apiKey = await getApiKey();
        const response = await fetch(`${BASE_URL}/accounts?itemId=${itemId}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch accounts: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        throw error;
    }
};

export const getTransactions = async (accountId: string) => {
    try {
        const apiKey = await getApiKey();
        // Busca transações dos últimos 30 dias por padrão (API default or specify params)
        const response = await fetch(`${BASE_URL}/transactions?accountId=${accountId}`, {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch transactions: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Erro ao buscar transações:", error);
        throw error;
    }
};
