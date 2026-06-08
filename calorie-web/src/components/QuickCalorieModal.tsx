import { useState } from 'react';

interface Props {
  onConfirm: (name: string, kcal: number, protein: number, fat: number, carb: number) => void;
  onCancel: () => void;
}

export default function QuickCalorieModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carb, setCarb] = useState('');

  const handleConfirm = () => {
    const k = parseFloat(kcal);
    if (!name.trim() || isNaN(k) || k <= 0) return;
    onConfirm(
      name.trim(), k,
      parseFloat(protein) || 0,
      parseFloat(fat) || 0,
      parseFloat(carb) || 0,
    );
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">その他カロリーを追加</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          飲み会・お菓子など。PFCは任意入力です
        </p>

        <div className="form-label">内容 *</div>
        <input
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：飲み会、ビール2杯"
          autoFocus
        />

        <div className="form-label">kcal *</div>
        <input
          className="form-input"
          type="number"
          inputMode="decimal"
          value={kcal}
          onChange={e => setKcal(e.target.value)}
          placeholder="500"
        />

        <div className="form-row" style={{ marginTop: 4 }}>
          <div>
            <div className="form-label">タンパク質 P (g)</div>
            <input
              className="form-input"
              type="number"
              inputMode="decimal"
              value={protein}
              onChange={e => setProtein(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <div className="form-label">脂質 F (g)</div>
            <input
              className="form-input"
              type="number"
              inputMode="decimal"
              value={fat}
              onChange={e => setFat(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="form-label">炭水化物 C (g)</div>
        <input
          className="form-input"
          type="number"
          inputMode="decimal"
          value={carb}
          onChange={e => setCarb(e.target.value)}
          placeholder="0"
        />

        <div className="modal-buttons">
          <button className="btn-modal btn-cancel" onClick={onCancel}>キャンセル</button>
          <button className="btn-modal btn-confirm" onClick={handleConfirm}>追加</button>
        </div>
      </div>
    </div>
  );
}
