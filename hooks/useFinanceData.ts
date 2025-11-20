import { useState, useEffect } from 'react';
import { Transaction, Category, CreditCard, Goal } from '../types';
import { MOCK_TRANSACTIONS, MOCK_CATEGORIES, MOCK_CARDS, MOCK_GOALS } from '../constants';

const STORAGE_KEYS = {
  TRANSACTIONS: 'goat_fin_transactions',
  CATEGORIES: 'goat_fin_categories',
  CARDS: 'goat_fin_cards',
  GOALS: 'goat_fin_goals',
  USER: 'goat_fin_user',
};

export interface UserProfile {
  name: string;
  email?: string;
  avatar?: string;
}

export const useFinanceData = () => {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        const storedCards = localStorage.getItem(STORAGE_KEYS.CARDS);
        const storedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // If user exists but no data, use MOCK data as initial seed (optional, or start empty)
        // For this request, user wants to "zero out", so we start empty if nothing is stored.
        // However, to keep the app usable immediately, we can seed if it's the *very first* run ever.
        // Let's stick to: if storage is empty, use empty arrays (except categories maybe).
        
        setTransactions(storedTransactions ? JSON.parse(storedTransactions) : []);
        setCategories(storedCategories ? JSON.parse(storedCategories) : MOCK_CATEGORIES); // Keep default categories
        setCards(storedCards ? JSON.parse(storedCards) : []);
        setGoals(storedGoals ? JSON.parse(storedGoals) : []);
        
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load data from storage:", error);
        // Fallback to safe defaults
        setCategories(MOCK_CATEGORIES);
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Persist data whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }, [cards, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user, isLoaded]);

  // Actions
  const login = (name: string, email?: string) => {
    const newUser = { name, email };
    setUser(newUser);
    // Optional: Seed data if it's a fresh login and empty? 
    // For now, let's keep it clean.
  };

  const logout = () => {
    setUser(null);
    // Optional: Clear data on logout? Usually better to keep it or have a separate "Reset"
  };

  const resetData = () => {
    if (window.confirm("Tem certeza? Isso apagará todas as suas transações, cartões e metas.")) {
      setTransactions([]);
      setCards([]);
      setGoals([]);
      // Reset categories to default
      setCategories(MOCK_CATEGORIES);
      
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.CARDS);
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    }
  };

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
  };

  const addGoal = (g: Goal) => {
    setGoals(prev => [...prev, g]);
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
    setTransactions, // Expose setters if needed for complex updates
    setCards,
    setGoals,
    isLoaded
  };
};
