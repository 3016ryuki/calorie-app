import { createClient } from '@supabase/supabase-js';
import type { FoodMaster, FoodLog, BurnLog } from '../types';

function getClient(url: string, key: string) {
  return createClient(url, key);
}

// === food_master ===

export async function fetchFoodsFromSupabase(url: string, key: string): Promise<FoodMaster[]> {
  const client = getClient(url, key);
  const { data, error } = await client.from('food_master').select('*').eq('is_preset', 0);
  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  return (data ?? []) as FoodMaster[];
}

export async function upsertFoodToSupabase(food: FoodMaster, url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const { error } = await client.from('food_master').upsert({ ...food }, { onConflict: 'id' });
  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
}

export async function deleteFoodFromSupabase(id: number, url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const { error } = await client.from('food_master').delete().eq('id', id);
  if (error) throw new Error(`Supabase delete error: ${error.message}`);
}

// === food_logs ===

export async function fetchLogsFromSupabase(url: string, key: string): Promise<FoodLog[]> {
  const client = getClient(url, key);
  const { data, error } = await client.from('food_logs').select('*').order('logged_at');
  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  return (data ?? []) as FoodLog[];
}

export async function upsertLogToSupabase(log: FoodLog, url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const { error } = await client.from('food_logs').upsert(log, { onConflict: 'id' });
  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
}

export async function deleteLogFromSupabase(id: number, url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const { error } = await client.from('food_logs').delete().eq('id', id);
  if (error) throw new Error(`Supabase delete error: ${error.message}`);
}

export async function clearLogsFromSupabase(url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const { error } = await client.from('food_logs').delete().gte('id', 0);
  if (error) throw new Error(`Supabase clear error: ${error.message}`);
}

// === burn_logs ===

export async function fetchBurnsFromSupabase(url: string, key: string): Promise<BurnLog[]> {
  const client = getClient(url, key);
  const { data, error } = await client.from('burn_logs').select('*').order('logged_at');
  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  return (data ?? []) as BurnLog[];
}

export async function upsertBurnToSupabase(burn: BurnLog, url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const { error } = await client.from('burn_logs').upsert(burn, { onConflict: 'id' });
  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
}

export async function deleteBurnFromSupabase(id: number, url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const { error } = await client.from('burn_logs').delete().eq('id', id);
  if (error) throw new Error(`Supabase delete error: ${error.message}`);
}

export async function clearBurnsFromSupabase(url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const { error } = await client.from('burn_logs').delete().gte('id', 0);
  if (error) throw new Error(`Supabase clear error: ${error.message}`);
}

// === connection test (全テーブル確認) ===

export async function testSupabaseConnection(url: string, key: string): Promise<void> {
  const client = getClient(url, key);
  const [r1, r2, r3] = await Promise.all([
    client.from('food_master').select('id').limit(1),
    client.from('food_logs').select('id').limit(1),
    client.from('burn_logs').select('id').limit(1),
  ]);
  const missing = [
    r1.error && 'food_master',
    r2.error && 'food_logs',
    r3.error && 'burn_logs',
  ].filter(Boolean);
  if (missing.length > 0) throw new Error(`テーブルが見つかりません: ${missing.join(', ')}`);
}
