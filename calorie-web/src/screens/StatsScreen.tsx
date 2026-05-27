import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { todayStr, addDays } from '../utils';

type Period = 7 | 30;

function formatLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function buildRange(days: number): string[] {
  const arr: string[] = [];
  const t = todayStr();
  for (let i = days - 1; i >= 0; i--) {
    arr.push(addDays(t, -i));
  }
  return arr;
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
      intake: recorded.reduce((s, d) => s + d.intake, 0) / n,
      burn: recorded.reduce((s, d) => s + d.burn, 0) / n,
      protein: recorded.reduce((s, d) => s + d.protein, 0) / n,
      fat: recorded.reduce((s, d) => s + d.fat, 0) / n,
      carb: recorded.reduce((s, d) => s + d.carb, 0) / n,
    };
    const total = {
      intake: data.reduce((s, d) => s + d.intake, 0),
      burn: data.reduce((s, d) => s + d.burn, 0),
    };
    return { avg, total, daysRecorded: recorded.length };
  }, [data]);

  const maxVal = useMemo(() => Math.max(
    ...data.map(d => Math.max(d.intake, d.burn)),
    settings.target_kcal, 100
  ), [data, settings.target_kcal]);

  const chartH = 180;
  const barW = period === 7 ? 18 : 8;

  return (
    <div style={{ padding: 14 }}>
      <div className="period-tabs">
        {([7, 30] as Period[]).map(p => (
          <button
            key={p}
            className={`period-tab ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >{p === 7 ? '週間 (7日)' : '月間 (30日)'}</button>
        ))}
      </div>

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
            bottom: 24 + (settings.target_kcal / maxVal) * chartH,
            left: 4, right: 4,
            borderTop: '1px dashed #ef4444',
            height: 1,
            zIndex: 1,
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            height: chartH,
            paddingLeft: 4, paddingRight: 4,
          }}>
            {data.map(d => (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: chartH }}>
                  <div style={{
                    width: barW,
                    height: (d.intake / maxVal) * chartH,
                    background: '#3b82f6',
                    borderRadius: '3px 3px 0 0',
                  }} />
                  <div style={{
                    width: barW,
                    height: (d.burn / maxVal) * chartH,
                    background: '#f97316',
                    borderRadius: '3px 3px 0 0',
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            paddingLeft: 4, paddingRight: 4,
            marginTop: 4,
          }}>
            {data.map((d, i) => {
              const show = period === 7 || i % 5 === 0 || i === data.length - 1;
              return (
                <div key={d.date} style={{
                  flex: 1, textAlign: 'center', fontSize: 9, color: '#9ca3af',
                  visibility: show ? 'visible' : 'hidden',
                }}>{formatLabel(d.date)}</div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">期間合計</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span>総摂取カロリー</span>
          <strong style={{ color: '#3b82f6' }}>{Math.round(stats.total.intake).toLocaleString()} kcal</strong>
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span>総消費カロリー</span>
          <strong style={{ color: '#f97316' }}>{Math.round(stats.total.burn).toLocaleString()} kcal</strong>
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span>差し引き合計</span>
          <strong style={{ color: '#10b981' }}>{Math.round(stats.total.intake - stats.total.burn).toLocaleString()} kcal</strong>
        </div>
      </div>

      <div className="card">
        <div className="card-title">1日平均PFC</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span>タンパク質 P</span>
          <strong style={{ color: '#3b82f6' }}>{stats.avg.protein.toFixed(1)} g</strong>
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span>脂質 F</span>
          <strong style={{ color: '#f59e0b' }}>{stats.avg.fat.toFixed(1)} g</strong>
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
          <span>炭水化物 C</span>
          <strong style={{ color: '#10b981' }}>{stats.avg.carb.toFixed(1)} g</strong>
        </div>
      </div>

      <div style={{ height: 30 }} />
    </div>
  );
}
