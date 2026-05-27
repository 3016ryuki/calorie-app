import { useState, useEffect, useRef } from 'react';
import type { FoodMaster } from '../types';

interface Props {
  food: FoodMaster | null;
  initialAmount?: number;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

export default function AmountInputModal({ food, initialAmount, onConfirm, onCancel }: Props) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (food) {
      setVal(String(initialAmount ?? food.base_amount));
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [food, initialAmount]);

  if (!food) return null;

  const num = parseFloat(val);
  const valid = !isNaN(num) && num > 0;
  const ratio = valid ? num / food.base_amount : 0;
  const preview = valid ? {
    kcal: Math.round(food.kcal * ratio * 10) / 10,
    protein: Math.round(food.protein * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    carb: Math.round(food.carb * ratio * 10) / 10,
  } : null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{food.name}</h2>
        <p className="modal-sub">基準: {food.base_amount}{food.unit_name} → {food.kcal}kcal</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            ref={inputRef}
            className="form-input-large"
            type="number"
            inputMode="decimal"
            value={val}
            onChange={e => setVal(e.target.value)}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 18, color: '#6b7280', fontWeight: 600 }}>{food.unit_name}</span>
        </div>

        {preview && (
          <div className="preview-card">
            <div className="preview-kcal">{preview.kcal} kcal</div>
            <div className="preview-pfc">
              <span>P: {preview.protein}g</span>
              <span>F: {preview.fat}g</span>
              <span>C: {preview.carb}g</span>
            </div>
          </div>
        )}

        <div className="modal-buttons">
          <button className="btn-modal btn-cancel" onClick={onCancel}>キャンセル</button>
          <button
            className="btn-modal btn-confirm"
            onClick={() => valid && onConfirm(num)}
            disabled={!valid}
          >追加</button>
        </div>
      </div>
    </div>
  );
}
