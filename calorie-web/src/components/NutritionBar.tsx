interface Props {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

export default function NutritionBar({ label, current, target, color, unit = 'g' }: Props) {
  const ratio = target > 0 ? Math.min(current / target, 1) : 0;
  const over = target > 0 && current > target;

  return (
    <div className="nutbar">
      <div className="nutbar-head">
        <span>{label}</span>
        <span className={`nutbar-val ${over ? 'over' : ''}`}>
          {current.toFixed(1)}{unit}<span className="target"> / {target}{unit}</span>
        </span>
      </div>
      <div className="nutbar-track">
        <div
          className="nutbar-fill"
          style={{ width: `${ratio * 100}%`, background: over ? '#ef4444' : color }}
        />
      </div>
    </div>
  );
}
