import { useState } from 'react';

interface Props {
  onConfirm: (name: string, kcal: number) => void;
  onCancel: () => void;
}

export default function QuickCalorieModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');

  const handleConfirm = () => {
    const k = parseFloat(kcal);
    if (!name.trim() || isNaN(k) || k <= 0) return;
    onConfirm(name.trim(), k);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">カロリーのみ追加</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          飲み会・お菓子などPFC不明のカロリーを記録します
        </p>

        <div className="form-label">内容</div>
        <input
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：飲み会、ビール2杯"
          autoFocus
        />

        <div className="form-label">kcal</div>
        <input
          className="form-input"
          type="number"
          inputMode="decimal"
          value={kcal}
          onChange={e => setKcal(e.target.value)}
          placeholder="500"
        />

        <div className="modal-buttons">
          <button className="btn-modal btn-cancel" onClick={onCancel}>キャンセル</button>
          <button className="btn-modal btn-confirm" onClick={handleConfirm}>追加</button>
        </div>
      </div>
    </div>
  );
}
