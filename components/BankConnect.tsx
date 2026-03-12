import React, { useState } from 'react';
import { PluggyConnect } from 'react-pluggy-connect';
import { getConnectToken } from '../services/pluggy';

interface BankConnectProps {
    onSuccess: (itemData: { item: { id: string }, connector?: { name?: string } }) => void;
    onError?: (error: any) => void;
}

const BankConnect: React.FC<BankConnectProps> = ({ onSuccess, onError }) => {
    const [connectToken, setConnectToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pendingSyncData, setPendingSyncData] = useState<{ item: { id: string }, connector?: { name?: string } } | null>(null);

    const handleConnectClick = async () => {
        try {
            setLoading(true);
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

    const handleConfirmImport = () => {
        if (!pendingSyncData) return;
        onSuccess(pendingSyncData);
        setPendingSyncData(null);
    };

    const handleCancelImport = () => {
        setPendingSyncData(null);
    };

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
            <div className="flex flex-col items-end gap-3">
                <button
                    onClick={handleConnectClick}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                >
                    <i className="fa-solid fa-building-columns mr-2"></i>
                    Conectar Open Finance
                </button>
                {errorMessage && (
                    <div className="text-red-500 text-sm text-right max-w-xs">
                        Erro ao conectar com Pluggy. {errorMessage}
                    </div>
                )}
                {pendingSyncData && (
                    <div className="max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left">
                        <p className="text-sm font-semibold text-slate-800">
                            Confirmar importacao {pendingSyncData.connector?.name ? `de ${pendingSyncData.connector.name}` : 'dos dados'}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                            Vamos sincronizar contas e cartoes vinculados, transacoes dos ultimos 6 meses e compras de cartao para montar fatura aberta e fechada.
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                            Pagamentos de fatura detectados na conta corrente continuam sendo ignorados para evitar duplicidade.
                        </p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={handleCancelImport}
                                className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                            >
                                Importar dados
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <PluggyConnect
            connectToken={connectToken}
            onSuccess={(data) => {
                setConnectToken(null);
                setPendingSyncData(data);
            }}
            onError={(error) => {
                console.error("Pluggy Widget Error:", error);
                setConnectToken(null);
                if (onError) onError(error);
            }}
        />
    );
};

export default BankConnect;
