export interface FoodMaster {
  id: number;
  name: string;
  category: string;
  base_amount: number;
  unit_type: 'g' | 'unit';
  unit_name: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  is_preset: number;
}

export interface FoodLog {
  id: number;
  date: string;
  logged_at: string;
  food_id: number;
  food_name: string;
  amount: number;
  unit_name: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
}

export interface BurnLog {
  id: number;
  date: string;
  logged_at: string;
  name: string;
  kcal: number;
}

export interface UserSettings {
  target_kcal: number;
  target_protein: number;
  target_fat: number;
  target_carb: number;
  target_burn: number;
}

export interface ApiSettings {
  openai_api_key: string;
  supabase_url: string;
  supabase_anon_key: string;
}
