import { useState, useMemo } from 'react';
import type { FoodMaster } from '../types';

const CATEGORIES = ['すべて', '肉類', '魚介・缶詰', '卵・大豆', 'プロテイン', '主食（米）', '主食（麺）', 'いも類', '油脂・その他', 'その他'];

interface Props {
  foods: FoodMaster[];
  onSelect: (food: FoodMaster) => void;
  onClose: () => void;
}

export default function FoodSelectModal({ foods, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('すべて');

  const filtered = useMemo(() => foods.filter(f =>
    (category === 'すべて' || f.category === category) && f.name.includes(search)
  ), [foods, search, category]);

  const usedCategories = useMemo(() => {
    const cats = new Set(foods.map(f => f.category));
    return CATEGORIES.filter(c => c === 'すべて' || cats.has(c));
  }, [foods]);

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

      <div className="food-list">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>該当する食材がありません</div>
        )}
        {filtered.map(f => (
          <div key={f.id} className="food-item" onClick={() => onSelect(f)}>
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
