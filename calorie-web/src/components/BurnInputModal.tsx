import { useState, useRef } from 'react';
import { useStore } from '../store';
import { analyzeWorkoutImage } from '../api/openai';

const PRESETS = [
  { name: 'ウォーキング 30分', kcal: 100 },
  { name: 'ランニング 30分', kcal: 250 },
  { name: 'ジム（筋トレ）30分', kcal: 150 },
  { name: 'サイクリング 30分', kcal: 180 },
  { name: '水泳 30分', kcal: 300 },
  { name: 'ヨガ 30分', kcal: 80 },
  { name: '階段昇降 10分', kcal: 50 },
];

interface Props {
  onConfirm: (name: string, kcal: number) => void;
  onCancel: () => void;
}

export default function BurnInputModal({ onConfirm, onCancel }: Props) {
  const { apiSettings } = useStore();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfirm = () => {
    const k = parseFloat(kcal);
    if (!name.trim() || isNaN(k) || k <= 0) return;
    onConfirm(name.trim(), k);
  };

  const handleScreenshot = () => {
    if (!apiSettings.openai_api_key) {
      alert('設定画面で OpenAI API キーを入力してください。');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mins = parseInt(minutes) || 30;
    setAnalyzing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // strip "data:image/...;base64," prefix
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await analyzeWorkoutImage(base64, mins, apiSettings.openai_api_key);
      setName(result.exercise);
      setKcal(String(result.kcal));
    } catch (e) {
      alert(`解析エラー: ${String(e)}`);
    } finally {
      setAnalyzing(false);
      // reset file input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">消費カロリーを記録</h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="form-label">運動時間（分）</div>
        <input
          className="form-input"
          type="number"
          inputMode="numeric"
          value={minutes}
          onChange={e => setMinutes(e.target.value)}
          placeholder="30"
        />

        <button
          className="btn-modal btn-confirm burn"
          style={{ width: '100%', marginBottom: 16, opacity: analyzing ? 0.6 : 1 }}
          onClick={handleScreenshot}
          disabled={analyzing}
        >
          {analyzing ? '解析中...' : '📷 スクリーンショットから入力（AI）'}
        </button>

        <div className="form-label">活動内容</div>
        <input
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：ランニング 30分"
        />

        <div className="form-label">消費 kcal</div>
        <input
          className="form-input"
          type="number"
          inputMode="decimal"
          value={kcal}
          onChange={e => setKcal(e.target.value)}
          placeholder="200"
        />

        <div className="form-label" style={{ marginTop: 16 }}>クイック入力</div>
        <div className="preset-list">
          {PRESETS.map((p, i) => (
            <div
              key={i}
              className="preset-row"
              onClick={() => { setName(p.name); setKcal(String(p.kcal)); }}
            >
              <span className="preset-row-name">{p.name}</span>
              <span className="preset-row-kcal">{p.kcal} kcal</span>
            </div>
          ))}
        </div>

        <div className="modal-buttons">
          <button className="btn-modal btn-cancel" onClick={onCancel}>キャンセル</button>
          <button className="btn-modal btn-confirm burn" onClick={handleConfirm}>追加</button>
        </div>
      </div>
    </div>
  );
}
