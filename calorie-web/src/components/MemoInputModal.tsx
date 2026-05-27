import { useState } from 'react';
import { useStore } from '../store';
import { parseFoodMemo, ParsedFoodItem } from '../api/openai';

interface Props {
  onClose: () => void;
}

export default function MemoInputModal({ onClose }: Props) {
  const { apiSettings, addLogsFromMemo, foods } = useStore();
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedFoodItem[] | null>(null);

  const reset = () => {
    setMemo('');
    setError('');
    setParsed(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAnalyze = async () => {
    if (!memo.trim()) return;
    if (!apiSettings.openai_api_key) {
      setError('設定画面で OpenAI API キーを入力してください。');
      return;
    }
    setLoading(true);
    setError('');
    setParsed(null);
    try {
      const items = await parseFoodMemo(memo.trim(), apiSettings.openai_api_key, foods.map(f => f.name));
      if (items.length === 0) {
        setError('食材を認識できませんでした。別の表現で試してください。');
      } else {
        setParsed(items);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    addLogsFromMemo(parsed);
    handleClose();
  };

  const totalKcal = parsed
    ? parsed.reduce((s, item) => {
        const ratio = item.amount / item.base_amount;
        return s + Math.round(item.kcal * ratio * 10) / 10;
      }, 0)
    : 0;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" style={{ maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">✏️ AIメモ入力</h2>

        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
          食べたものを自由に入力してください。<br />
          例: 「鶏胸肉150gとご飯食べた」「昼にラーメンと餃子3個」
        </p>

        <textarea
          style={{
            width: '100%', minHeight: 90, padding: '10px 12px',
            border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 15,
            color: '#111827', resize: 'vertical', boxSizing: 'border-box',
            marginBottom: 12, fontFamily: 'inherit',
          }}
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="今日食べたものをメモしてください..."
          autoFocus
          disabled={loading}
        />

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 10 }}>{error}</p>
        )}

        {!parsed && (
          <button
            className="btn-modal btn-confirm"
            style={{ width: '100%', marginBottom: 0 }}
            onClick={handleAnalyze}
            disabled={!memo.trim() || loading}
          >
            {loading ? '解析中...' : '🤖 AI で解析'}
          </button>
        )}

        {parsed && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: '#374151' }}>解析結果</span>
              <span style={{ fontWeight: 700, color: '#3b82f6' }}>合計 {Math.round(totalKcal)} kcal</span>
            </div>

            <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 14 }}>
              {parsed.map((item, i) => {
                const ratio = item.amount / item.base_amount;
                const kcal = Math.round(item.kcal * ratio * 10) / 10;
                const p = Math.round(item.protein * ratio * 10) / 10;
                const f = Math.round(item.fat * ratio * 10) / 10;
                const c = Math.round(item.carb * ratio * 10) / 10;
                return (
                  <div key={i} style={{
                    background: '#f9fafb', borderRadius: 10, padding: '10px 12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{item.amount}{item.unit_name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                        P {p}g　F {f}g　C {c}g
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#3b82f6' }}>{kcal} kcal</div>
                  </div>
                );
              })}
            </div>

            <div className="modal-buttons">
              <button className="btn-modal btn-cancel" onClick={() => setParsed(null)}>やり直す</button>
              <button className="btn-modal btn-confirm" onClick={handleConfirm}>追加する</button>
            </div>
          </>
        )}

        {!parsed && (
          <div className="modal-buttons" style={{ marginTop: 10 }}>
            <button className="btn-modal btn-cancel" style={{ width: '100%' }} onClick={handleClose}>キャンセル</button>
          </div>
        )}
      </div>
    </div>
  );
}
