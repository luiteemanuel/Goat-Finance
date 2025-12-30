
import { useState, useEffect } from 'react';
import { getAccounts, getTransactions } from '../services/pluggy';
import { Transaction, Category, CreditCard, Goal, TransactionStatus, PaymentMethod } from '../types';
import { MOCK_CATEGORIES } from '../constants';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
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
      const txQuery = query(collection(db, 'transactions'), where('userId', '==', userId), orderBy('date', 'desc'));
      const txSnapshot = await getDocs(txQuery);
      const txs = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

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
          categoryId: t.categoryId, // Firestore data should match our types roughly
          cardId: t.cardId,
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
          brand: 'visa'
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
    if (!auth.currentUser) return;
    setCards(prev => [...prev, c]);

    try {
      const docRef = await addDoc(collection(db, 'cards'), {
        name: c.name,
        limit: c.limit,
        color: c.color,
        dueDay: c.dueDay,
        closingDay: c.closingDay,
        userId: auth.currentUser.uid
      });
      setCards(prev => prev.map(item => item.id === c.id ? { ...item, id: docRef.id } : item));
    } catch (error) {
      console.error('Error adding card:', error);
    }
  };

  const syncPluggyData = async (itemId: string) => {
    try {
      const accounts = await getAccounts(itemId);
      let newTransactionsCount = 0;

      for (const account of accounts) {
        if (account.type === 'CREDIT' || account.subtype === 'CREDIT_CARD') {
          // Placeholder for handling card import logic if uncommented
        }

        const pluggyTransactions = await getTransactions(account.id);

        for (const pt of pluggyTransactions) {
          const amount = Math.abs(pt.amount);
          const type = pt.amount < 0 ? 'EXPENSE' : 'INCOME';
          let categoryId = categories[0].id;
          if (pt.category) {
            const found = categories.find(c => c.name.toLowerCase() === pt.category.toLowerCase());
            if (found) categoryId = found.id;
          }

          const newTx: Transaction = {
            id: pt.id,
            description: pt.description,
            amount: amount,
            type: type as 'EXPENSE' | 'INCOME',
            date: new Date(pt.date).toISOString().split('T')[0],
            categoryId: categoryId,
            paymentMethod: account.type === 'CREDIT' ? PaymentMethod.CREDIT_CARD : PaymentMethod.DEBIT_CARD,
            status: TransactionStatus.PAID,
            isFixed: false
          } as Transaction;

          await addTransaction(newTx);
          newTransactionsCount++;
        }
      }
      alert(`Sincronização concluída! ${newTransactionsCount} transações importadas.`);
    } catch (error) {
      console.error("Sync error", error);
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
    addGoal,
    addCard,
    syncPluggyData,
    isLoaded: !loading
  };
};
