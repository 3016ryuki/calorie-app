import { useState, useMemo } from 'react';
import { useStore } from '../store';
import type { FoodMaster, FoodLog } from '../types';
import { addDays, formatDate, formatTime } from '../utils';
import NutritionBar from '../components/NutritionBar';
import AmountInputModal from '../components/AmountInputModal';
import FoodSelectModal from '../components/FoodSelectModal';
import BurnInputModal from '../components/BurnInputModal';
import MemoInputModal from '../components/MemoInputModal';

export default function HomeScreen() {
  const {
    foods, allLogs, allBurns, settings, selectedDate,
    setSelectedDate, addLog, updateLog, deleteLog, addBurn, deleteBurn,
  } = useStore();

  const logs = useMemo(() =>
    allLogs.filter(l => l.date === selectedDate).sort((a, b) => a.logged_at.localeCompare(b.logged_at)),
    [allLogs, selectedDate]);
  const burns = useMemo(() =>
    allBurns.filter(b => b.date === selectedDate).sort((a, b) => a.logged_at.localeCompare(b.logged_at)),
    [allBurns, selectedDate]);

  const [showFoodSelect, setShowFoodSelect] = useState(false);
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [showBurnInput, setShowBurnInput] = useState(false);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodMaster | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);

  const totals = useMemo(() => ({
    kcal: logs.reduce((s, l) => s + l.kcal, 0),
    protein: logs.reduce((s, l) => s + l.protein, 0),
    fat: logs.reduce((s, l) => s + l.fat, 0),
    carb: logs.reduce((s, l) => s + l.carb, 0),
    burn: burns.reduce((s, b) => s + b.kcal, 0),
  }), [logs, burns]);

  const net = totals.kcal - totals.burn;
  const kcalRatio = settings.target_kcal > 0 ? Math.min(totals.kcal / settings.target_kcal, 1) : 0;

  const handleSelectFood = (food: FoodMaster) => {
    setSelectedFood(food);
    setShowFoodSelect(false);
    setShowAmountInput(true);
  };

  const handleConfirm = (amount: number) => {
    if (editingLog) {
      updateLog(editingLog.id, amount);
      setEditingLog(null);
    } else if (selectedFood) {
      addLog(selectedFood.id, amount);
    }
    setShowAmountInput(false);
    setSelectedFood(null);
  };

  const handleEditLog = (log: FoodLog) => {
    const food = foods.find(f => f.id === log.food_id);
    if (!food) return;
    setEditingLog(log);
    setSelectedFood(food);
    setShowAmountInput(true);
  };

  return (
    <>
      <div className="date-nav">
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))}>‹</button>
        <span className="date-text">{formatDate(selectedDate)}</span>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}>›</button>
      </div>

      <div className="main-scroll">
        <div className="card">
          <div className="card-title">カロリー収支</div>
          <div className="kcal-row">
            <span className="kcal-num">{Math.round(totals.kcal)}</span>
            <span className="kcal-unit">/ {settings.target_kcal} kcal</span>
          </div>
          <div className="kcal-track">
            <div
              className={`kcal-fill ${kcalRatio >= 1 ? 'over' : ''}`}
              style={{ width: `${kcalRatio * 100}%` }}
            />
          </div>
          <div className="balance-row">
            <div className="balance-cell">
              <div className="balance-label">摂取</div>
              <div className="balance-val" style={{ color: '#3b82f6' }}>+{Math.round(totals.kcal)}</div>
            </div>
            <div className="balance-cell">
              <div className="balance-label">消費</div>
              <div className="balance-val" style={{ color: '#f97316' }}>-{Math.round(totals.burn)}</div>
            </div>
            <div className="balance-cell">
              <div className="balance-label">差し引き</div>
              <div className="balance-val" style={{ color: net > 0 ? '#111827' : '#10b981' }}>{Math.round(net)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">PFCバランス</div>
          <NutritionBar label="タンパク質 P" current={totals.protein} target={settings.target_protein} color="#3b82f6" />
          <NutritionBar label="脂質 F" current={totals.fat} target={settings.target_fat} color="#f59e0b" />
          <NutritionBar label="炭水化物 C" current={totals.carb} target={settings.target_carb} color="#10b981" />
        </div>
      </div>

      <div className="log-section">
        <div className="log-section-header">
          <span className="section-title">🍽 食事 ({logs.length})</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-add" style={{ background: '#e0f9ff', color: '#0891b2' }} onClick={() => setShowMemoInput(true)}>✏️ AIメモ</button>
            <button className="btn-add" onClick={() => setShowFoodSelect(true)}>＋ 追加</button>
          </div>
        </div>
        {logs.length === 0
          ? <div className="empty-log">まだ食材が追加されていません</div>
          : logs.map(log => (
              <div key={log.id} className="log-item" onClick={() => handleEditLog(log)}>
                <div className="log-left">
                  <div className="log-name">{log.food_name}</div>
                  <div className="log-meta">{log.amount}{log.unit_name} · {formatTime(log.logged_at)}</div>
                  <div className="log-pfc">
                    <span className="log-pfc-item">P {log.protein}g</span>
                    <span className="log-pfc-item">F {log.fat}g</span>
                    <span className="log-pfc-item">C {log.carb}g</span>
                  </div>
                </div>
                <div className="log-right">
                  <div className="log-kcal" style={{ color: '#3b82f6' }}>{log.kcal}</div>
                  <div className="log-kcal-unit">kcal</div>
                  <button
                    className="log-delete"
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`「${log.food_name}」を削除しますか？`)) deleteLog(log.id);
                    }}
                  >✕</button>
                </div>
              </div>
            ))
        }
      </div>

      <div className="log-section">
        <div className="log-section-header">
          <span className="section-title">🔥 運動・消費 ({burns.length})</span>
          <button className="btn-add burn" onClick={() => setShowBurnInput(true)}>＋ 追加</button>
        </div>
        {burns.length === 0
          ? <div className="empty-log">運動の記録はありません</div>
          : burns.map(b => (
              <div key={b.id} className="log-item">
                <div className="log-left">
                  <div className="log-name">{b.name}</div>
                  <div className="log-meta">{formatTime(b.logged_at)}</div>
                </div>
                <div className="log-right">
                  <div className="log-kcal" style={{ color: '#f97316' }}>-{b.kcal}</div>
                  <div className="log-kcal-unit">kcal</div>
                  <button
                    className="log-delete"
                    onClick={() => {
                      if (confirm(`「${b.name}」を削除しますか？`)) deleteBurn(b.id);
                    }}
                  >✕</button>
                </div>
              </div>
            ))
        }
      </div>

      <div style={{ height: 30 }} />

      {showFoodSelect && (
        <FoodSelectModal
          foods={foods}
          onSelect={handleSelectFood}
          onClose={() => setShowFoodSelect(false)}
        />
      )}
      {showAmountInput && (
        <AmountInputModal
          food={selectedFood}
          initialAmount={editingLog?.amount}
          onConfirm={handleConfirm}
          onCancel={() => {
            setShowAmountInput(false);
            setSelectedFood(null);
            setEditingLog(null);
          }}
        />
      )}
      {showBurnInput && (
        <BurnInputModal
          onConfirm={(name, kcal) => { addBurn(name, kcal); setShowBurnInput(false); }}
          onCancel={() => setShowBurnInput(false)}
        />
      )}
      {showMemoInput && (
        <MemoInputModal onClose={() => setShowMemoInput(false)} />
      )}
    </>
  );
}
