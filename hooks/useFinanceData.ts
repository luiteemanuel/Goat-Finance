
import { useState, useEffect } from 'react';
import { getAccounts, getTransactions } from '../services/pluggy';
import { Transaction, Category, CreditCard, Goal, TransactionStatus, TransactionType, PaymentMethod } from '../types';
import { MOCK_CATEGORIES } from '../constants';
import { auth, db } from '../lib/firebase';
import { getInvoiceCycleFromDate } from '../lib/creditCardBilling';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';

export interface UserProfile {
  name: string;
  email?: string;
  avatar?: string;
}

export const useFinanceData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário',
          email: currentUser.email || undefined
        });
        fetchData(currentUser.uid);
      } else {
        setUser(null);
        setTransactions([]);
        setCards([]);
        setGoals([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      // Transactions
      // Note: orderBy requires a composite index with where clause in Firestore. 
      // Removed temporarily to ensure data shows up. User can create index via console link if needed later.
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', userId));
      const txSnapshot = await getDocs(txQuery);
      const txs = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort in memory for now
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Cards
      const cardQuery = query(collection(db, 'cards'), where('userId', '==', userId));
      const cardSnapshot = await getDocs(cardQuery);
      const crds = cardSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // Goals
      const goalQuery = query(collection(db, 'goals'), where('userId', '==', userId));
      const goalSnapshot = await getDocs(goalQuery);
      const gls = goalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      if (txs) {
        setTransactions(txs.map((t: any) => ({
          ...t,
          // Ensure type is properly mapped to enum value
          type: t.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
          categoryId: t.categoryId, // Firestore data should match our types roughly
          cardId: t.cardId,
          externalId: t.externalId,
          accountScope: t.accountScope,
          invoiceId: t.invoiceId,
          invoiceDueDate: t.invoiceDueDate,
          paymentMethod: t.paymentMethod,
          isFixed: t.isFixed || false
        })));
      }

      if (crds) {
        setCards(crds.map((c: any) => ({
          ...c,
          limit: c.limit,
          dueDay: c.dueDay,
          closingDay: c.closingDay,
          externalAccountId: c.externalAccountId,
          accountScope: c.accountScope,
          brand: c.brand || 'visa'
        })));
      }

      if (gls) {
        setGoals(gls.map((g: any) => ({
          ...g,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Handled by LoginScreen
  };

  const logout = async () => {
    await auth.signOut();
  };

  const resetData = async () => {
    if (!auth.currentUser) return;
    if (window.confirm("Tem certeza? Isso apagará TODOS os seus dados do servidor permanentemente.")) {
      try {
        const userId = auth.currentUser.uid;

        const txQuery = query(collection(db, 'transactions'), where('userId', '==', userId));
        const txDocs = await getDocs(txQuery);
        txDocs.forEach(d => deleteDoc(doc(db, 'transactions', d.id)));
        setTransactions([]);

        const cardQuery = query(collection(db, 'cards'), where('userId', '==', userId));
        const cardDocs = await getDocs(cardQuery);
        cardDocs.forEach(d => deleteDoc(doc(db, 'cards', d.id)));
        setCards([]);

        const goalQuery = query(collection(db, 'goals'), where('userId', '==', userId));
        const goalDocs = await getDocs(goalQuery);
        goalDocs.forEach(d => deleteDoc(doc(db, 'goals', d.id)));
        setGoals([]);
      } catch (e) {
        console.error("Error resetting data", e);
      }
    }
  };

  const addTransaction = async (t: Transaction) => {
    if (!auth.currentUser) return;

    // Optimistic Update
    // Need temporary ID
    const tempT = { ...t, id: 'temp-' + Date.now() };
    setTransactions(prev => [tempT, ...prev]);

    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        description: t.description,
        amount: t.amount,
        type: t.type,
        categoryId: t.categoryId,
        date: t.date,
        paymentMethod: t.paymentMethod,
        cardId: t.cardId || null,
        externalId: t.externalId || null,
        accountScope: t.accountScope || null,
        invoiceId: t.invoiceId || null,
        invoiceDueDate: t.invoiceDueDate || null,
        tag: t.tag || null,
        isFixed: t.isFixed || false,
        status: t.status,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now()
      });

      setTransactions(prev => prev.map(item => item.id === tempT.id ? { ...item, id: docRef.id } : item));
    } catch (error) {
      console.error('Error adding transaction:', error);
      // Rollback optimistic update if needed
      setTransactions(prev => prev.filter(item => item.id !== tempT.id));
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!auth.currentUser) return;

    // Optimistic Update
    setTransactions(prev => prev.filter(t => t.id !== transactionId));

    try {
      await deleteDoc(doc(db, 'transactions', transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // Refetch data on error
      fetchData(auth.currentUser.uid);
    }
  };

  const addGoal = async (g: Goal) => {
    if (!auth.currentUser) return;
    setGoals(prev => [...prev, g]);
    await addDoc(collection(db, 'goals'), {
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline,
      icon: g.icon,
      userId: auth.currentUser.uid
    });
  };

  const addCard = async (c: CreditCard) => {
    if (!auth.currentUser) return null;
    setCards(prev => [...prev, c]);

    try {
      const docRef = await addDoc(collection(db, 'cards'), {
        name: c.name,
        limit: c.limit,
        color: c.color,
        dueDay: c.dueDay,
        closingDay: c.closingDay,
        brand: c.brand || 'visa',
        externalAccountId: c.externalAccountId || null,
        accountScope: c.accountScope || null,
        userId: auth.currentUser.uid
      });
      const persistedCard = { ...c, id: docRef.id };
      setCards(prev => prev.map(item => item.id === c.id ? persistedCard : item));
      return persistedCard;
    } catch (error) {
      console.error('Error adding card:', error);
      return null;
    }
  };

  const syncPluggyData = async (itemId: string) => {
    try {
      const accounts = await getAccounts(itemId);
      let importedCount = 0;
      let skippedCount = 0;
      let linkedCardsCount = 0;
      const existingExternalIds = new Set(
        transactions.map(t => t.externalId).filter((id): id is string => Boolean(id))
      );
      const cardsByExternalAccountId = new Map(
        cards
          .filter(card => card.externalAccountId)
          .map(card => [card.externalAccountId as string, card])
      );
      const cardsByName = new Map(cards.map(card => [card.name.toLowerCase(), card]));

      const inferScope = (account: any): 'PF' | 'PJ' => {
        const document = String(
          account?.taxNumber ||
          account?.owner?.taxNumber ||
          account?.owner?.documentNumber ||
          ''
        ).replace(/\D/g, '');
        if (document.length >= 12) return 'PJ';
        return 'PF';
      };

      const inferBillingDays = (account: any) => {
        const dueDayRaw = Number(account?.creditData?.dueDay || account?.dueDay);
        const closingDayRaw = Number(account?.creditData?.closingDay || account?.closingDay);
        const dueDay = Number.isInteger(dueDayRaw) && dueDayRaw >= 1 && dueDayRaw <= 31 ? dueDayRaw : 10;
        const closingDay = Number.isInteger(closingDayRaw) && closingDayRaw >= 1 && closingDayRaw <= 31 ? closingDayRaw : 26;
        return { dueDay, closingDay };
      };

      for (const account of accounts) {
        const accountScope = inferScope(account);
        const isCreditAccount = account.type === 'CREDIT' || account.subtype === 'CREDIT_CARD';
        let matchedCard = isCreditAccount
          ? cardsByExternalAccountId.get(account.id) || cardsByName.get((account.name || '').toLowerCase())
          : undefined;

        if (isCreditAccount && !matchedCard) {
          const { dueDay, closingDay } = inferBillingDays(account);
          const createdCard = await addCard({
            id: `temp-card-${account.id}`,
            name: account.name || 'Cartao Open Finance',
            limit: Number(account?.creditData?.limit || account?.balance || 0),
            dueDay,
            closingDay,
            color: '#1e293b',
            brand: 'visa',
            externalAccountId: account.id,
            accountScope
          });
          if (createdCard) {
            matchedCard = createdCard;
            cardsByExternalAccountId.set(account.id, createdCard);
            cardsByName.set(createdCard.name.toLowerCase(), createdCard);
            linkedCardsCount++;
          }
        }

        const pluggyTransactions = await getTransactions(account.id);
        for (const pt of pluggyTransactions) {
          const externalId = `pluggy:${pt.id}`;
          if (existingExternalIds.has(externalId)) {
            skippedCount++;
            continue;
          }
          const amount = Math.abs(pt.amount);
          const type = pt.amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
          let categoryId = categories[0].id;
          if (pt.category) {
            const found = categories.find(c => c.name.toLowerCase() === String(pt.category).toLowerCase());
            if (found) categoryId = found.id;
          }
          const paymentMethod = isCreditAccount ? PaymentMethod.CREDIT_CARD : PaymentMethod.DEBIT_CARD;
          const txDate = String(pt.date).slice(0, 10);
          const invoiceCycle = matchedCard && paymentMethod === PaymentMethod.CREDIT_CARD
            ? getInvoiceCycleFromDate(txDate, matchedCard)
            : null;
          const newTx: Transaction = {
            id: `pluggy-${pt.id}`,
            externalId,
            description: pt.description || account.name || 'Transacao Open Finance',
            amount: amount,
            type,
            date: txDate,
            categoryId: categoryId,
            paymentMethod,
            cardId: paymentMethod === PaymentMethod.CREDIT_CARD ? matchedCard?.id : undefined,
            accountScope,
            invoiceId: invoiceCycle?.invoiceId,
            invoiceDueDate: invoiceCycle?.dueDate,
            tag: `${accountScope}:${account.name || 'Conta'}`,
            status: TransactionStatus.PAID,
            isFixed: false
          };
          await addTransaction(newTx);
          existingExternalIds.add(externalId);
          importedCount++;
        }
      }
      alert(`Sincronizacao concluida. ${importedCount} novas transacoes, ${skippedCount} ignoradas (ja existiam) e ${linkedCardsCount} cartoes vinculados automaticamente.`);
    } catch (error) {
      console.error('Sync error', error);
      alert('Erro ao sincronizar dados com Pluggy.');
    }
  };

  return {
    user,
    login,
    logout,
    resetData,
    transactions,
    categories,
    cards,
    goals,
    addTransaction,
    deleteTransaction,
    addGoal,
    addCard,
    syncPluggyData,
    isLoaded: !loading
  };
};
