import { useState } from 'react';
import { useStore } from '../store';
import type { FoodMaster } from '../types';

const CATEGORIES = ['肉類', '魚介・缶詰', '卵・大豆', 'プロテイン', '主食（米）', '主食（麺）', 'いも類', '油脂・その他', 'その他'];

interface FormData {
  name: string;
  category: string;
  base_amount: string;
  unit_type: 'g' | 'unit';
  unit_name: string;
  kcal: string;
  protein: string;
  fat: string;
  carb: string;
}

const EMPTY: FormData = {
  name: '', category: '肉類', base_amount: '100',
  unit_type: 'g', unit_name: 'g',
  kcal: '', protein: '', fat: '', carb: '',
};

function FoodFormModal({
  initial, onSave, onClose,
}: { initial?: FoodMaster; onSave: (d: FormData) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormData>(initial ? {
    name: initial.name, category: initial.category,
    base_amount: String(initial.base_amount),
    unit_type: initial.unit_type, unit_name: initial.unit_name,
    kcal: String(initial.kcal), protein: String(initial.protein),
    fat: String(initial.fat), carb: String(initial.carb),
  } : EMPTY);

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { alert('食材名を入力してください'); return; }
    if (!form.kcal) { alert('カロリーを入力してください'); return; }
    onSave(form);
  };

  return (
    <div className="modal-full">
      <div className="modal-full-header">
        <h2>{initial ? '食材を編集' : '食材を追加'}</h2>
        <button className="btn-close" onClick={onClose}>閉じる</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div className="form-label">食材名 *</div>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="例：鶏胸肉" />

        <div className="form-label">カテゴリ</div>
        <div className="category-tabs" style={{ padding: 0 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              type="button"
              className={`cat-tab ${form.category === c ? 'active' : ''}`}
              onClick={() => set('category', c)}
            >{c}</button>
          ))}
        </div>

        <div className="form-label">単位タイプ</div>
        <div className="unit-type-row">
          {(['g', 'unit'] as const).map(t => (
            <button
              key={t}
              type="button"
              className={`unit-type-btn ${form.unit_type === t ? 'active' : ''}`}
              onClick={() => {
                set('unit_type', t);
                set('unit_name', t === 'g' ? 'g' : '個');
                set('base_amount', t === 'g' ? '100' : '1');
              }}
            >{t === 'g' ? 'グラム（g）' : '個数単位'}</button>
          ))}
        </div>

        <div className="form-row" style={{ marginTop: 4 }}>
          <div>
            <div className="form-label">基準量 *</div>
            <input className="form-input" type="number" inputMode="decimal"
              value={form.base_amount} onChange={e => set('base_amount', e.target.value)} />
          </div>
          <div>
            <div className="form-label">単位名 *</div>
            <input className="form-input" value={form.unit_name}
              onChange={e => set('unit_name', e.target.value)} placeholder="g / 個 / 杯" />
          </div>
        </div>

        <div className="form-row">
          <div>
            <div className="form-label">kcal *</div>
            <input className="form-input" type="number" inputMode="decimal"
              value={form.kcal} onChange={e => set('kcal', e.target.value)} />
          </div>
          <div>
            <div className="form-label">タンパク質 P (g)</div>
            <input className="form-input" type="number" inputMode="decimal"
              value={form.protein} onChange={e => set('protein', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div>
            <div className="form-label">脂質 F (g)</div>
            <input className="form-input" type="number" inputMode="decimal"
              value={form.fat} onChange={e => set('fat', e.target.value)} />
          </div>
          <div>
            <div className="form-label">炭水化物 C (g)</div>
            <input className="form-input" type="number" inputMode="decimal"
              value={form.carb} onChange={e => set('carb', e.target.value)} />
          </div>
        </div>

        <button className="btn-save" style={{ marginTop: 24 }} onClick={handleSave}>
          {initial ? '更新する' : '追加する'}
        </button>
      </div>
    </div>
  );
}

export default function FoodsScreen() {
  const { foods, addFood, updateFood, deleteFood } = useStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<FoodMaster | undefined>();

  const filtered = foods.filter(f => f.name.includes(search));

  const handleSave = (form: FormData) => {
    const data = {
      name: form.name.trim(),
      category: form.category,
      base_amount: parseFloat(form.base_amount) || 100,
      unit_type: form.unit_type,
      unit_name: form.unit_name,
      kcal: parseFloat(form.kcal) || 0,
      protein: parseFloat(form.protein) || 0,
      fat: parseFloat(form.fat) || 0,
      carb: parseFloat(form.carb) || 0,
    };
    if (editTarget) updateFood(editTarget.id, data);
    else addFood(data);
    setShowForm(false);
    setEditTarget(undefined);
  };

  return (
    <>
      <div className="search-bar" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <input
          type="text"
          placeholder="食材名で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ padding: 12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>食材が見つかりません</div>
        )}
        {filtered.map(f => (
          <div key={f.id} className="foods-list-item">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="food-item-name">{f.name}</span>
                {f.is_preset === 1 && <span className="preset-badge">プリセット</span>}
              </div>
              <div className="food-item-sub" style={{ marginTop: 4 }}>
                {f.base_amount}{f.unit_name} → {f.kcal}kcal　P{f.protein}g F{f.fat}g C{f.carb}g
              </div>
            </div>
            <button className="btn-edit" onClick={() => { setEditTarget(f); setShowForm(true); }}>編集</button>
            <button
              className="btn-del"
              onClick={() => { if (confirm(`「${f.name}」を削除しますか？`)) deleteFood(f.id); }}
            >削除</button>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setEditTarget(undefined); setShowForm(true); }}
        style={{
          position: 'fixed', right: 20, bottom: 80,
          width: 56, height: 56, borderRadius: 28,
          background: '#3b82f6', color: '#fff', fontSize: 28,
          boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
          fontWeight: 300,
        }}
      >＋</button>

      {showForm && (
        <FoodFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(undefined); }}
        />
      )}
    </>
  );
}
