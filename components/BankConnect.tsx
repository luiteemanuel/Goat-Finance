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

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const token = await getConnectToken();
                setConnectToken(token);
            } catch (error) {
                console.error("Failed to get connect token", error);
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
                Erro ao conectar com Pluggy. Verifique suas credenciais.
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
