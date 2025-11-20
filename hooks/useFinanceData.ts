import { useState, useEffect } from 'react';
import { Transaction, Category, CreditCard, Goal } from '../types';
import { MOCK_CATEGORIES } from '../constants';
import { supabase } from '../lib/supabase';

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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email
        });
        fetchData();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
          email: session.user.email
        });
        fetchData();
      } else {
        setUser(null);
        setTransactions([]);
        setCards([]);
        setGoals([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      const { data: crds } = await supabase.from('cards').select('*');
      const { data: gls } = await supabase.from('goals').select('*');
      // Categories: we can fetch custom ones or just use default for now. 
      // If we implemented categories table, we'd fetch here.

      if (txs) {
        setTransactions(txs.map((t: any) => ({
          ...t,
          categoryId: t.category_id,
          cardId: t.card_id,
          paymentMethod: t.payment_method || t.paymentMethod, // Handle both cases if legacy data exists
          isFixed: t.is_fixed || false
        })));
      }

      if (crds) {
        setCards(crds.map((c: any) => ({
          ...c,
          limit: c.limit_amount,
          dueDay: parseInt(c.due_date),
          closingDay: parseInt(c.closing_date),
          brand: 'visa' // Default or map if stored
        })));
      }

      if (gls) {
        setGoals(gls.map((g: any) => ({
          ...g,
          targetAmount: g.target_amount,
          currentAmount: g.current_amount
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Handled by LoginScreen directly calling supabase.auth
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const resetData = async () => {
    if (window.confirm("Tem certeza? Isso apagará TODOS os seus dados do servidor permanentemente.")) {
      const { error } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (!error) setTransactions([]);

      await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setCards([]);

      await supabase.from('goals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setGoals([]);
    }
  };

  const addTransaction = async (t: Transaction) => {
    // Optimistic update
    setTransactions(prev => [t, ...prev]);

    const { data, error } = await supabase.from('transactions').insert({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category_id: t.categoryId,
      date: t.date,
      user_id: (await supabase.auth.getUser()).data.user?.id
    }).select().single();

    if (error) {
      console.error('Error adding transaction:', error);
      // Revert optimistic update if needed
    } else if (data) {
      // Update with real ID from DB
      setTransactions(prev => prev.map(item => item.id === t.id ? { ...item, id: data.id } : item));
    }
  };

  const addGoal = async (g: Goal) => {
    setGoals(prev => [...prev, g]);
    await supabase.from('goals').insert({
      name: g.name,
      target_amount: g.targetAmount,
      current_amount: g.currentAmount,
      deadline: g.deadline,
      icon: g.icon,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });
  };

  const addCard = async (c: CreditCard) => {
    setCards(prev => [...prev, c]);
    const { data, error } = await supabase.from('cards').insert({
      name: c.name,
      limit_amount: c.limit,
      color: c.color,
      due_date: c.dueDay,
      closing_date: c.closingDay,
      user_id: (await supabase.auth.getUser()).data.user?.id
    }).select().single();

    if (error) {
      console.error('Error adding card:', error);
    } else if (data) {
      setCards(prev => prev.map(item => item.id === c.id ? { ...item, id: data.id } : item));
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
    isLoaded: !loading
  };
};
