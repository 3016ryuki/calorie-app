import type { FoodMaster, FoodLog, BurnLog, UserSettings, ApiSettings } from './types';

const KEYS = {
  FOODS: 'cal_foods_v1',
  LOGS: 'cal_logs_v1',
  BURNS: 'cal_burns_v1',
  SETTINGS: 'cal_settings_v1',
  API_SETTINGS: 'cal_api_settings_v1',
} as const;

export function load<T>(key: keyof typeof KEYS, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEYS[key]);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: keyof typeof KEYS, value: T): void {
  localStorage.setItem(KEYS[key], JSON.stringify(value));
}

export function clearAll(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

export const DEFAULT_API_SETTINGS: ApiSettings = {
  openai_api_key: '',
  supabase_url: '',
  supabase_anon_key: '',
};

export const DEFAULT_SETTINGS: UserSettings = {
  target_kcal: 2000,
  target_protein: 150,
  target_fat: 60,
  target_carb: 200,
  target_burn: 300,
};

const PRESETS: Omit<FoodMaster, 'id' | 'is_preset'>[] = [
  { name: '鶏胸肉（皮なし）', category: '肉類', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 108, protein: 23.0, fat: 1.5, carb: 0 },
  { name: '鶏もも肉（皮あり）', category: '肉類', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 253, protein: 17.0, fat: 19.0, carb: 0 },
  { name: '豚こま', category: '肉類', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 230, protein: 18.0, fat: 23.0, carb: 0.2 },
  { name: 'ヤリイカ', category: '魚介・缶詰', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 83, protein: 18.0, fat: 1.0, carb: 0.6 },
  { name: 'サバ缶', category: '魚介・缶詰', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 148, protein: 12.4, fat: 10.1, carb: 0.2 },
  { name: 'ツナ缶（ノンオイル）', category: '魚介・缶詰', base_amount: 1, unit_type: 'unit', unit_name: '缶', kcal: 53, protein: 12.5, fat: 0.3, carb: 0.2 },
  { name: 'カツオ', category: '魚介・缶詰', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 150, protein: 25.0, fat: 6.2, carb: 0.2 },
  { name: '卵', category: '卵・大豆', base_amount: 1, unit_type: 'unit', unit_name: '個', kcal: 124, protein: 10.2, fat: 8.5, carb: 0.3 },
  { name: '納豆', category: '卵・大豆', base_amount: 1, unit_type: 'unit', unit_name: 'パック', kcal: 96, protein: 8.2, fat: 5.1, carb: 5.9 },
  { name: '豆腐', category: '卵・大豆', base_amount: 150, unit_type: 'g', unit_name: 'g', kcal: 70, protein: 7.0, fat: 2.5, carb: 5.4 },
  { name: 'プロテイン（水）', category: 'プロテイン', base_amount: 1, unit_type: 'unit', unit_name: '杯', kcal: 120, protein: 20.0, fat: 1.5, carb: 3.0 },
  { name: 'プロテイン（低脂肪牛乳）', category: 'プロテイン', base_amount: 1, unit_type: 'unit', unit_name: '杯', kcal: 220, protein: 24.0, fat: 4.0, carb: 15.0 },
  { name: '白米（炊飯後1合）', category: '主食（米）', base_amount: 330, unit_type: 'g', unit_name: 'g', kcal: 554, protein: 9.2, fat: 0.8, carb: 123.0 },
  { name: '白米（100g）', category: '主食（米）', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 156, protein: 2.5, fat: 0.3, carb: 37.0 },
  { name: 'パスタ（乾麺）', category: '主食（麺）', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 378, protein: 13.0, fat: 2.0, carb: 72.2 },
  { name: 'そば（乾麺）', category: '主食（麺）', base_amount: 80, unit_type: 'g', unit_name: 'g', kcal: 274, protein: 10.4, fat: 1.9, carb: 55.0 },
  { name: 'うどん（乾麺）', category: '主食（麺）', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 333, protein: 8.5, fat: 1.1, carb: 71.9 },
  { name: 'そうめん（乾麺）', category: '主食（麺）', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 333, protein: 9.5, fat: 1.1, carb: 70.2 },
  { name: 'さつまいも', category: 'いも類', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 132, protein: 1.2, fat: 0.2, carb: 31.0 },
  { name: '長芋', category: 'いも類', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 108, protein: 4.5, fat: 0.5, carb: 23.0 },
  { name: 'ジャガイモ', category: 'いも類', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 76, protein: 1.8, fat: 0.1, carb: 15.0 },
  { name: '春雨（乾麺）', category: 'いも類', base_amount: 30, unit_type: 'g', unit_name: 'g', kcal: 105, protein: 0, fat: 0, carb: 26.0 },
  { name: 'オリーブオイル', category: '油脂・その他', base_amount: 10, unit_type: 'g', unit_name: 'g', kcal: 90, protein: 0, fat: 10.0, carb: 0 },
  { name: 'ミックスナッツ（素焼き）', category: '油脂・その他', base_amount: 100, unit_type: 'g', unit_name: 'g', kcal: 652, protein: 18.4, fat: 56.9, carb: 19.6 },
];

export function ensurePresets(): FoodMaster[] {
  const existing = load<FoodMaster[]>('FOODS', []);
  if (existing.length > 0) return existing;
  const foods: FoodMaster[] = PRESETS.map((p, i) => ({ ...p, id: i + 1, is_preset: 1 }));
  save('FOODS', foods);
  return foods;
}

export function loadAll() {
  const foods = ensurePresets();
  const logs = load<FoodLog[]>('LOGS', []);
  const burns = load<BurnLog[]>('BURNS', []);
  const settings = { ...DEFAULT_SETTINGS, ...load<Partial<UserSettings>>('SETTINGS', {}) };
  const apiSettings = { ...DEFAULT_API_SETTINGS, ...load<Partial<ApiSettings>>('API_SETTINGS', {}) };
  return { foods, logs, burns, settings, apiSettings };
}
