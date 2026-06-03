import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { todayStr, addDays } from '../utils';
import NutritionBar from '../components/NutritionBar';

type Period = 7 | 30;

function formatLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 昨日を終点とした period 日分の配列を返す
function buildRange(days: number): string[] {
  const arr: string[] = [];
  const t = todayStr();
  for (let i = days; i >= 1; i--) {
    arr.push(addDays(t, -i));
  }
  return arr;
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid #f3f4f6' }} />;
}

export default function StatsScreen() {
  const { allLogs, allBurns, settings } = useStore();
  const [period, setPeriod] = useState<Period>(7);

  const data = useMemo(() => {
    const range = buildRange(period);
    return range.map(date => {
      const logs = allLogs.filter(l => l.date === date);
      const burns = allBurns.filter(b => b.date === date);
      return {
        date,
        intake: logs.reduce((s, l) => s + l.kcal, 0),
        burn: burns.reduce((s, b) => s + b.kcal, 0),
        protein: logs.reduce((s, l) => s + l.protein, 0),
        fat: logs.reduce((s, l) => s + l.fat, 0),
        carb: logs.reduce((s, l) => s + l.carb, 0),
      };
    });
  }, [allLogs, allBurns, period]);

  const stats = useMemo(() => {
    const recorded = data.filter(d => d.intake > 0 || d.burn > 0);
    const n = recorded.length || 1;
    const avg = {
      intake:  recorded.reduce((s, d) => s + d.intake,  0) / n,
      burn:    recorded.reduce((s, d) => s + d.burn,    0) / n,
      protein: recorded.reduce((s, d) => s + d.protein, 0) / n,
      fat:     recorded.reduce((s, d) => s + d.fat,     0) / n,
      carb:    recorded.reduce((s, d) => s + d.carb,    0) / n,
    };
    const total = {
      intake:  data.reduce((s, d) => s + d.intake,  0),
      burn:    data.reduce((s, d) => s + d.burn,    0),
      protein: data.reduce((s, d) => s + d.protein, 0),
      fat:     data.reduce((s, d) => s + d.fat,     0),
      carb:    data.reduce((s, d) => s + d.carb,    0),
    };
    return { avg, total, daysRecorded: recorded.length };
  }, [data]);

  const maxKcal = useMemo(() => Math.max(
    ...data.map(d => Math.max(d.intake, d.burn)),
    settings.target_kcal, 100
  ), [data, settings.target_kcal]);

  const maxPfc = useMemo(() => Math.max(
    ...data.map(d => Math.max(d.protein, d.fat, d.carb)),
    settings.target_protein,
    settings.target_fat,
    settings.target_carb,
    100
  ), [data, settings]);

  const chartH = 160;
  const barW   = period === 7 ? 16 : 7;
  const pfcBarW = period === 7 ? 10 : 4;

  return (
    <div style={{ padding: 14 }}>

      {/* 期間タブ */}
      <div className="period-tabs">
        {([7, 30] as Period[]).map(p => (
          <button
            key={p}
            className={`period-tab ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >{p === 7 ? '週間 (7日)' : '月間 (30日)'}</button>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: '-4px 0 12px' }}>
        ※ 昨日までの{period}日間
      </p>

      {/* カロリーサマリー */}
      <div className="summary-grid">
        <div className="summary-card" style={{ background: '#eff6ff' }}>
          <div className="summary-label">平均 摂取</div>
          <div className="summary-value" style={{ color: '#3b82f6' }}>{Math.round(stats.avg.intake)}</div>
          <div className="summary-unit">kcal/日</div>
        </div>
        <div className="summary-card" style={{ background: '#fff7ed' }}>
          <div className="summary-label">平均 消費</div>
          <div className="summary-value" style={{ color: '#f97316' }}>{Math.round(stats.avg.burn)}</div>
          <div className="summary-unit">kcal/日</div>
        </div>
        <div className="summary-card" style={{ background: '#f0fdf4' }}>
          <div className="summary-label">平均 差し引き</div>
          <div className="summary-value" style={{ color: '#10b981' }}>{Math.round(stats.avg.intake - stats.avg.burn)}</div>
          <div className="summary-unit">kcal/日</div>
        </div>
        <div className="summary-card" style={{ background: '#fafafa' }}>
          <div className="summary-label">記録日数</div>
          <div className="summary-value" style={{ color: '#111827' }}>{stats.daysRecorded}</div>
          <div className="summary-unit">/ {period}日</div>
        </div>
      </div>

      {/* PFC平均サマリー */}
      <div className="card">
        <div className="card-title">1日平均 PFCバランス</div>
        <NutritionBar label="タンパク質 P" current={stats.avg.protein} target={settings.target_protein} color="#3b82f6" />
        <NutritionBar label="脂質 F"       current={stats.avg.fat}     target={settings.target_fat}     color="#f59e0b" />
        <NutritionBar label="炭水化物 C"   current={stats.avg.carb}    target={settings.target_carb}    color="#10b981" />
      </div>

      {/* 日別カロリーグラフ */}
      <div className="card">
        <div className="card-title">日別カロリー収支</div>
        <div className="chart-legend">
          <div className="chart-legend-item"><div className="legend-dot" style={{ background: '#3b82f6' }} /> 摂取</div>
          <div className="chart-legend-item"><div className="legend-dot" style={{ background: '#f97316' }} /> 消費</div>
          <div className="chart-legend-item"><div className="legend-line" style={{ background: '#ef4444' }} /> 目標 ({settings.target_kcal})</div>
        </div>
        <div style={{ position: 'relative', height: chartH + 24, marginTop: 8 }}>
          <div style={{
            position: 'absolute',
            bottom: 24 + (settings.target_kcal / maxKcal) * chartH,
            left: 4, right: 4, borderTop: '1px dashed #ef4444', height: 1, zIndex: 1,
          }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: chartH, paddingLeft: 4, paddingRight: 4 }}>
            {data.map(d => (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: chartH }}>
                  <div style={{ width: barW, height: (d.intake / maxKcal) * chartH, background: '#3b82f6', borderRadius: '3px 3px 0 0' }} />
                  <div style={{ width: barW, height: (d.burn / maxKcal) * chartH, background: '#f97316', borderRadius: '3px 3px 0 0' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: 4, paddingRight: 4, marginTop: 4 }}>
            {data.map((d, i) => {
              const show = period === 7 || i % 5 === 0 || i === data.length - 1;
              return (
                <div key={d.date} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9ca3af', visibility: show ? 'visible' : 'hidden' }}>
                  {formatLabel(d.date)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 日別PFCグラフ */}
      <div className="card">
        <div className="card-title">日別PFC推移</div>
        <div className="chart-legend">
          <div className="chart-legend-item"><div className="legend-dot" style={{ background: '#3b82f6' }} /> P</div>
          <div className="chart-legend-item"><div className="legend-dot" style={{ background: '#f59e0b' }} /> F</div>
          <div className="chart-legend-item"><div className="legend-dot" style={{ background: '#10b981' }} /> C</div>
          <div className="chart-legend-item"><div className="legend-line" style={{ background: '#3b82f6' }} /> P目標</div>
          <div className="chart-legend-item"><div className="legend-line" style={{ background: '#f59e0b' }} /> F目標</div>
          <div className="chart-legend-item"><div className="legend-line" style={{ background: '#10b981' }} /> C目標</div>
        </div>
        <div style={{ position: 'relative', height: chartH + 24, marginTop: 8 }}>
          {/* 目標点線 P / F / C */}
          {[
            { target: settings.target_protein, color: '#3b82f6' },
            { target: settings.target_fat,     color: '#f59e0b' },
            { target: settings.target_carb,    color: '#10b981' },
          ].map(({ target, color }) => (
            <div key={color} style={{
              position: 'absolute',
              bottom: 24 + (target / maxPfc) * chartH,
              left: 4, right: 4, height: 1, zIndex: 1,
              borderTop: `1px dashed ${color}`,
            }} />
          ))}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: chartH, paddingLeft: 4, paddingRight: 4 }}>
            {data.map(d => (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: chartH }}>
                  <div style={{ width: pfcBarW, height: (d.protein / maxPfc) * chartH, background: '#3b82f6', borderRadius: '3px 3px 0 0' }} />
                  <div style={{ width: pfcBarW, height: (d.fat     / maxPfc) * chartH, background: '#f59e0b', borderRadius: '3px 3px 0 0' }} />
                  <div style={{ width: pfcBarW, height: (d.carb    / maxPfc) * chartH, background: '#10b981', borderRadius: '3px 3px 0 0' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: 4, paddingRight: 4, marginTop: 4 }}>
            {data.map((d, i) => {
              const show = period === 7 || i % 5 === 0 || i === data.length - 1;
              return (
                <div key={d.date} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9ca3af', visibility: show ? 'visible' : 'hidden' }}>
                  {formatLabel(d.date)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 期間合計 */}
      <div className="card">
        <div className="card-title">期間合計</div>
        <Row label="総摂取カロリー"  value={`${Math.round(stats.total.intake).toLocaleString()} kcal`}  color="#3b82f6" />
        <Divider />
        <Row label="総消費カロリー"  value={`${Math.round(stats.total.burn).toLocaleString()} kcal`}    color="#f97316" />
        <Divider />
        <Row label="差し引き合計"    value={`${Math.round(stats.total.intake - stats.total.burn).toLocaleString()} kcal`} color="#10b981" />
        <Divider />
        <Row label="タンパク質合計 P" value={`${Math.round(stats.total.protein).toLocaleString()} g`}  color="#3b82f6" />
        <Divider />
        <Row label="脂質合計 F"      value={`${Math.round(stats.total.fat).toLocaleString()} g`}       color="#f59e0b" />
        <Divider />
        <Row label="炭水化物合計 C"  value={`${Math.round(stats.total.carb).toLocaleString()} g`}      color="#10b981" />
      </div>

      <div style={{ height: 30 }} />
    </div>
  );
}
