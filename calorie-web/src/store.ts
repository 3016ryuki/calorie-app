import { create } from 'zustand';
import type { FoodMaster, FoodLog, BurnLog, UserSettings, ApiSettings } from './types';
import type { ParsedFoodItem } from './api/openai';
import { loadAll, save, clearAll, ensurePresets, DEFAULT_SETTINGS, DEFAULT_API_SETTINGS } from './storage';
import {
  fetchFoodsFromSupabase, upsertFoodToSupabase, deleteFoodFromSupabase,
  fetchLogsFromSupabase, upsertLogToSupabase, deleteLogFromSupabase, clearLogsFromSupabase,
  fetchBurnsFromSupabase, upsertBurnToSupabase, deleteBurnFromSupabase, clearBurnsFromSupabase,
} from './storage/supabase';

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nextId<T extends { id: number }>(arr: T[]): number {
  return arr.length === 0 ? 1 : Math.max(...arr.map(x => x.id)) + 1;
}

interface State {
  foods: FoodMaster[];
  allLogs: FoodLog[];
  allBurns: BurnLog[];
  settings: UserSettings;
  apiSettings: ApiSettings;
  selectedDate: string;

  setSelectedDate: (date: string) => void;

  addFood: (food: Omit<FoodMaster, 'id' | 'is_preset'>) => void;
  updateFood: (id: number, patch: Partial<Omit<FoodMaster, 'id'>>) => void;
  deleteFood: (id: number) => void;

  addLog: (foodId: number, amount: number) => void;
  updateLog: (id: number, amount: number) => void;
  deleteLog: (id: number) => void;

  addBurn: (name: string, kcal: number) => void;
  deleteBurn: (id: number) => void;

  saveSettings: (s: UserSettings) => void;
  saveApiSettings: (s: ApiSettings) => void;
  addLogsFromMemo: (items: ParsedFoodItem[]) => void;
  resetAll: () => void;
}

const initial = loadAll();

// 起動時にSupabaseからデータを取得してlocalStorageと同期
const { supabase_url: _url, supabase_anon_key: _key } = initial.apiSettings;
if (_url && _key) {
  Promise.all([
    fetchFoodsFromSupabase(_url, _key),
    fetchLogsFromSupabase(_url, _key),
    fetchBurnsFromSupabase(_url, _key),
  ]).then(([remoteFoods, remoteLogs, remoteBurns]) => {
    useStore.setState(state => {
      const updates: Partial<State> = {};

      if (remoteFoods.length > 0) {
        const localCustomIds = new Set(state.foods.filter(f => f.is_preset === 0).map(f => f.id));
        const toAdd = remoteFoods.filter(f => !localCustomIds.has(f.id));
        if (toAdd.length > 0) {
          const merged = [...state.foods, ...toAdd];
          save('FOODS', merged);
          updates.foods = merged;
        }
      }

      if (remoteLogs.length > 0) {
        save('LOGS', remoteLogs);
        updates.allLogs = remoteLogs;
      }

      if (remoteBurns.length > 0) {
        save('BURNS', remoteBurns);
        updates.allBurns = remoteBurns;
      }

      return updates;
    });
  }).catch(() => {});
}

export const useStore = create<State>((set, get) => ({
  foods: initial.foods,
  allLogs: initial.logs,
  allBurns: initial.burns,
  settings: initial.settings,
  apiSettings: initial.apiSettings,
  selectedDate: todayStr(),

  setSelectedDate: (date) => set({ selectedDate: date }),

  addFood: (food) => {
    const newFood: FoodMaster = { ...food, id: nextId(get().foods), is_preset: 0 };
    const foods = [...get().foods, newFood];
    save('FOODS', foods);
    set({ foods });
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    if (supabase_url && supabase_anon_key) {
      upsertFoodToSupabase(newFood, supabase_url, supabase_anon_key).catch(() => {});
    }
  },

  updateFood: (id, patch) => {
    const foods = get().foods.map(f => f.id === id ? { ...f, ...patch } : f);
    save('FOODS', foods);
    set({ foods });
    const updated = foods.find(f => f.id === id);
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    if (updated && updated.is_preset === 0 && supabase_url && supabase_anon_key) {
      upsertFoodToSupabase(updated, supabase_url, supabase_anon_key).catch(() => {});
    }
  },

  deleteFood: (id) => {
    const target = get().foods.find(f => f.id === id);
    const foods = get().foods.filter(f => f.id !== id);
    save('FOODS', foods);
    set({ foods });
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    if (target && target.is_preset === 0 && supabase_url && supabase_anon_key) {
      deleteFoodFromSupabase(id, supabase_url, supabase_anon_key).catch(() => {});
    }
  },

  addLog: (foodId, amount) => {
    const { foods, allLogs, selectedDate } = get();
    const food = foods.find(f => f.id === foodId);
    if (!food) return;
    const ratio = amount / food.base_amount;
    const round = (v: number) => Math.round(v * 10) / 10;
    const newLog: FoodLog = {
      id: nextId(allLogs),
      date: selectedDate,
      logged_at: new Date().toISOString(),
      food_id: foodId,
      food_name: food.name,
      amount,
      unit_name: food.unit_name,
      kcal: round(food.kcal * ratio),
      protein: round(food.protein * ratio),
      fat: round(food.fat * ratio),
      carb: round(food.carb * ratio),
    };
    const next = [...allLogs, newLog];
    save('LOGS', next);
    set({ allLogs: next });
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    if (supabase_url && supabase_anon_key) {
      upsertLogToSupabase(newLog, supabase_url, supabase_anon_key).catch(() => {});
    }
  },

  updateLog: (id, amount) => {
    const { foods, allLogs } = get();
    const log = allLogs.find(l => l.id === id);
    if (!log) return;
    const food = foods.find(f => f.id === log.food_id);
    if (!food) return;
    const ratio = amount / food.base_amount;
    const round = (v: number) => Math.round(v * 10) / 10;
    const next = allLogs.map(l => l.id === id ? {
      ...l, amount,
      kcal: round(food.kcal * ratio),
      protein: round(food.protein * ratio),
      fat: round(food.fat * ratio),
      carb: round(food.carb * ratio),
    } : l);
    save('LOGS', next);
    set({ allLogs: next });
    const updated = next.find(l => l.id === id);
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    if (updated && supabase_url && supabase_anon_key) {
      upsertLogToSupabase(updated, supabase_url, supabase_anon_key).catch(() => {});
    }
  },

  deleteLog: (id) => {
    const next = get().allLogs.filter(l => l.id !== id);
    save('LOGS', next);
    set({ allLogs: next });
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    if (supabase_url && supabase_anon_key) {
      deleteLogFromSupabase(id, supabase_url, supabase_anon_key).catch(() => {});
    }
  },

  addBurn: (name, kcal) => {
    const { allBurns, selectedDate } = get();
    const newBurn: BurnLog = {
      id: nextId(allBurns),
      date: selectedDate,
      logged_at: new Date().toISOString(),
      name, kcal,
    };
    const next = [...allBurns, newBurn];
    save('BURNS', next);
    set({ allBurns: next });
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    if (supabase_url && supabase_anon_key) {
      upsertBurnToSupabase(newBurn, supabase_url, supabase_anon_key).catch(() => {});
    }
  },

  deleteBurn: (id) => {
    const next = get().allBurns.filter(b => b.id !== id);
    save('BURNS', next);
    set({ allBurns: next });
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    if (supabase_url && supabase_anon_key) {
      deleteBurnFromSupabase(id, supabase_url, supabase_anon_key).catch(() => {});
    }
  },

  saveSettings: (s) => {
    save('SETTINGS', s);
    set({ settings: s });
  },

  saveApiSettings: (s) => {
    save('API_SETTINGS', s);
    set({ apiSettings: s });
  },

  addLogsFromMemo: (items) => {
    const { foods, allLogs, selectedDate } = get();
    const round = (v: number) => Math.round(v * 10) / 10;
    const newFoods: FoodMaster[] = [];
    const newLogs: FoodLog[] = [];
    let currentFoods = [...foods];

    for (const item of items) {
      let food = currentFoods.find(f => f.name === item.name);
      if (!food) {
        food = {
          id: nextId(currentFoods),
          name: item.name,
          category: item.category || 'AI登録',
          base_amount: item.base_amount,
          unit_type: item.unit_type,
          unit_name: item.unit_name,
          kcal: item.kcal,
          protein: item.protein,
          fat: item.fat,
          carb: item.carb,
          is_preset: 0,
        };
        currentFoods = [...currentFoods, food];
        newFoods.push(food);
      }
      const ratio = item.amount / item.base_amount;
      newLogs.push({
        id: nextId([...allLogs, ...newLogs]),
        date: selectedDate,
        logged_at: new Date().toISOString(),
        food_id: food.id,
        food_name: food.name,
        amount: item.amount,
        unit_name: food.unit_name,
        kcal: round(food.kcal * ratio),
        protein: round(food.protein * ratio),
        fat: round(food.fat * ratio),
        carb: round(food.carb * ratio),
      });
    }

    const { supabase_url, supabase_anon_key } = get().apiSettings;

    if (newFoods.length > 0) {
      save('FOODS', currentFoods);
      if (supabase_url && supabase_anon_key) {
        newFoods.forEach(f => upsertFoodToSupabase(f, supabase_url, supabase_anon_key).catch(() => {}));
      }
    }

    const nextLogs = [...allLogs, ...newLogs];
    save('LOGS', nextLogs);
    set({ foods: currentFoods, allLogs: nextLogs });

    if (supabase_url && supabase_anon_key) {
      newLogs.forEach(l => upsertLogToSupabase(l, supabase_url, supabase_anon_key).catch(() => {}));
    }
  },

  resetAll: () => {
    const { supabase_url, supabase_anon_key } = get().apiSettings;
    clearAll();
    if (supabase_url && supabase_anon_key) {
      clearLogsFromSupabase(supabase_url, supabase_anon_key).catch(() => {});
      clearBurnsFromSupabase(supabase_url, supabase_anon_key).catch(() => {});
    }
    const foods = ensurePresets();
    set({ foods, allLogs: [], allBurns: [], settings: DEFAULT_SETTINGS, apiSettings: DEFAULT_API_SETTINGS, selectedDate: todayStr() });
  },
}));
