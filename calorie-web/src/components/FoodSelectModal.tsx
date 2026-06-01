import { useState, useMemo } from 'react';
import type { FoodMaster } from '../types';

const CATEGORIES = ['すべて', '肉類', '魚介・缶詰', '卵・大豆', 'プロテイン', '主食（米）', '主食（麺）', 'いも類', '野菜', '油脂・その他', 'その他'];

function pfcBg(protein: number, fat: number, carb: number): string {
  if (protein >= fat && protein >= carb) return '#e0f2fe';
  if (fat >= carb) return '#fff3e0';
  return '#e8f5e9';
}

interface Props {
  foods: FoodMaster[];
  onSelect: (food: FoodMaster) => void;
  onClose: () => void;
}

type SortKey = 'none' | 'protein' | 'fat' | 'carb';

const SORT_BUTTONS: { key: SortKey; label: string; bg: string; color: string }[] = [
  { key: 'protein', label: 'P 高い順', bg: '#e0f2fe', color: '#0891b2' },
  { key: 'fat',     label: 'F 高い順', bg: '#fff3e0', color: '#d97706' },
  { key: 'carb',    label: 'C 高い順', bg: '#e8f5e9', color: '#16a34a' },
];

export default function FoodSelectModal({ foods, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('すべて');
  const [sortKey, setSortKey] = useState<SortKey>('none');

  const filtered = useMemo(() => {
    const base = foods.filter(f =>
      (category === 'すべて' || f.category === category) && f.name.includes(search)
    );
    if (sortKey === 'none') return base;
    return [...base].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [foods, search, category, sortKey]);

  const usedCategories = CATEGORIES;

  return (
    <div className="modal-full">
      <div className="modal-full-header">
        <h2>食材を選ぶ</h2>
        <button className="btn-close" onClick={onClose}>閉じる</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="食材名で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="category-tabs">
        {usedCategories.map(c => (
          <button
            key={c}
            className={`cat-tab ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >{c}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '8px 14px 0' }}>
        {SORT_BUTTONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSortKey(sortKey === s.key ? 'none' : s.key)}
            style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
              background: sortKey === s.key ? s.bg : '#f3f4f6',
              color: sortKey === s.key ? s.color : '#9ca3af',
              border: sortKey === s.key ? `1.5px solid ${s.color}` : '1.5px solid transparent',
            }}
          >{s.label}</button>
        ))}
      </div>

      <div className="food-list">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>該当する食材がありません</div>
        )}
        {filtered.map(f => (
          <div key={f.id} className="food-item" style={{ background: pfcBg(f.protein, f.fat, f.carb) }} onClick={() => onSelect(f)}>
            <div className="food-item-left">
              <div className="food-item-name">{f.name}</div>
              <div className="food-item-sub">{f.base_amount}{f.unit_name} = {f.kcal}kcal</div>
            </div>
            <div className="food-item-pfc">
              <span>P{f.protein}g</span>
              <span>F{f.fat}g</span>
              <span>C{f.carb}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
