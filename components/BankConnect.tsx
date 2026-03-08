import React, { useState, useEffect } from 'react';
import { PluggyConnect } from 'react-pluggy-connect';
import { getConnectToken } from '../services/pluggy';

interface BankConnectProps {
    onSuccess: (itemData: { item: { id: string } }) => void;
    onError?: (error: any) => void;
}

const BankConnect: React.FC<BankConnectProps> = ({ onSuccess, onError }) => {
    const [connectToken, setConnectToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                setErrorMessage(null);
                const token = await getConnectToken();
                setConnectToken(token);
            } catch (error) {
                console.error("Failed to get connect token", error);
                setErrorMessage(error instanceof Error ? error.message : 'Falha desconhecida ao criar connect token.');
            } finally {
                setLoading(false);
            }
        };
        fetchToken();
    }, []);



    if (loading) {
        return (
            <button disabled className="px-4 py-2 bg-slate-200 text-slate-500 rounded-lg cursor-not-allowed flex items-center gap-2">
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                Carregando...
            </button>
        );
    }

    if (!connectToken) {
        return (
            <div className="text-red-500 text-sm">
                Erro ao conectar com Pluggy. {errorMessage || 'Verifique suas credenciais e os endpoints /api/pluggy.'}
            </div>
        );
    }

    return (
        <PluggyConnect
            connectToken={connectToken}
            onSuccess={onSuccess}
            onError={(error) => {
                console.error("Pluggy Widget Error:", error);
                if (onError) onError(error);
            }}
        />
    );
};

export default BankConnect;
