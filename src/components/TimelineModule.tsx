import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Story } from '@/data/stories';

interface Props {
  data: Story[];
  minYear: number;
  maxYear: number;
}

function yearColor(year: number, min: number, max: number): string {
  const t = (year - min) / Math.max(1, max - min);
  if (t < 0.33) return '#8b5cf6';
  if (t < 0.66) return '#06b6d4';
  return '#f59e0b';
}

function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)}BCE` : `${year}`;
}

function getSmartTicks(min: number, max: number): number[] {
  const span = max - min;
  let step: number;
  if (span > 1000) step = 500;
  else if (span > 500) step = 200;
  else if (span > 200) step = 100;
  else if (span > 50) step = 50;
  else step = 10;

  const ticks: number[] = [];
  const start = Math.ceil(min / step) * step;
  for (let y = start; y <= max; y += step) {
    ticks.push(y);
  }
  if (ticks.length < 3) {
    ticks.push(min, max);
  }
  return [...new Set(ticks)].sort((a, b) => a - b);
}

/** Thin ticks so labels don't overlap. Each label needs ~38px; container is ~520px. */
function thinTicks(ticks: number[], maxLabels: number): number[] {
  if (ticks.length <= maxLabels) return ticks;
  const stride = Math.ceil(ticks.length / maxLabels);
  const result: number[] = [];
  for (let i = 0; i < ticks.length; i += stride) {
    result.push(ticks[i]);
  }
  // Always include the last tick
  if (result[result.length - 1] !== ticks[ticks.length - 1]) {
    result.push(ticks[ticks.length - 1]);
  }
  return result;
}

export default function TimelineModule({ data, minYear, maxYear }: Props) {
  const [range, setRange] = useState<[number, number]>([minYear, maxYear]);
  const [dragging, setDragging] = useState<'left' | 'right' | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const scaleX = useCallback(
    (year: number) => ((year - minYear) / Math.max(1, maxYear - minYear)) * 100,
    [minYear, maxYear]
  );

  const scaleXRange = useCallback(
    (year: number) => ((year - range[0]) / Math.max(1, range[1] - range[0])) * 100,
    [range]
  );

  const filtered = useMemo(
    () => data.filter((p) => p.birthYear >= range[0] && p.birthYear <= range[1]),
    [data, range]
  );

  const allTicks = useMemo(() => getSmartTicks(range[0], range[1]), [range]);
  const ticks = useMemo(() => thinTicks(allTicks, 7), [allTicks]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (clientX: number) => {
      if (!thumbRef.current) return;
      const rect = thumbRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const year = Math.round(minYear + pct * (maxYear - minYear));

      setRange((prev) => {
        if (dragging === 'left') {
          return [Math.min(year, prev[1] - 10, prev[1]), prev[1]];
        }
        return [prev[0], Math.max(year, prev[0] + 10, prev[0])];
      });
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseup', () => setDragging(null));
    window.addEventListener('touchend', () => setDragging(null));

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [dragging, minYear, maxYear]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.05 : 0.95;
    setRange((prev) => {
      const span = prev[1] - prev[0];
      const newSpan = Math.max(20, Math.min(maxYear - minYear, span * zoomFactor));
      const center = (prev[0] + prev[1]) / 2;
      const newMin = Math.max(minYear, Math.round(center - newSpan / 2));
      const newMax = Math.min(maxYear, Math.round(center + newSpan / 2));
      return [newMin, newMax];
    });
  };

  return (
    <div className="space-y-3">
      {/* Main view — chart area */}
      <div
        className="relative w-full h-[90px]"
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <svg width="100%" height="90" className="overflow-visible">
          <path d="M 0,70 Q 50%,-10 100%,70" stroke="rgba(255,255,255,0.08)" fill="none" strokeWidth="1.5" />

          {ticks.map((year) => {
            const x = scaleXRange(year);
            return (
              <g key={year}>
                <line x1={`${x}%`} y1="68" x2={`${x}%`} y2="72" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <text
                  x={`${x}%`}
                  y="84"
                  className="mono"
                  fontSize="9"
                  fill="rgba(255,255,255,0.35)"
                  textAnchor="middle"
                >
                  {formatYear(year)}
                </text>
              </g>
            );
          })}

          {filtered.map((p, idx) => {
            const x = scaleXRange(p.birthYear);
            const y = 70 - 60 * Math.pow(x / 100 - 0.5, 2);
            const color = yearColor(p.birthYear, minYear, maxYear);
            return (
              <g key={p.id} className="star-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <circle cx={`${x}%`} cy={y} r="3" fill={color} opacity="0.9">
                  <animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" begin={`${idx * 0.2}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={`${x}%`} cy={y} r="5" fill={color} opacity="0.2" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hint text — placed below the chart, above the slider */}
      <div className="flex justify-end">
        <span className="text-[10px] text-white/20 font-light tracking-widest">
          滚轮缩放 · 拖拽下方滑块
        </span>
      </div>

      {/* Thumbnail + dual slider */}
      <div ref={thumbRef} className="relative w-full h-[30px] select-none">
        <svg width="100%" height="30" className="overflow-visible">
          <path d="M 0,25 Q 50%,5 100%,25" stroke="rgba(255,255,255,0.05)" fill="none" strokeWidth="1" />

          {data.map((p) => {
            const x = scaleX(p.birthYear);
            return <circle key={p.id} cx={`${x}%`} cy="20" r="1.2" fill="rgba(255,255,255,0.15)" />;
          })}

          <rect x="0" y="0" width={`${scaleX(range[0])}%`} height="30" fill="rgba(0,0,0,0.4)" rx="2" />
          <rect
            x={`${scaleX(range[1])}%`}
            y="0"
            width={`${100 - scaleX(range[1])}%`}
            height="30"
            fill="rgba(0,0,0,0.4)"
            rx="2"
          />

          <rect
            x={`${scaleX(range[0])}%`}
            y="5"
            width={`${scaleX(range[1]) - scaleX(range[0])}%`}
            height="20"
            fill="rgba(139,92,246,0.15)"
            rx="4"
            stroke="rgba(139,92,246,0.4)"
            strokeWidth="0.5"
          />

          <circle
            cx={`${scaleX(range[0])}%`}
            cy="15"
            r="7"
            fill="#8b5cf6"
            stroke="#14121f"
            strokeWidth="2"
            className="cursor-ew-resize transition-transform hover:scale-110"
            style={{ transformOrigin: `${scaleX(range[0])}% 15px` }}
          />
          <circle
            cx={`${scaleX(range[1])}%`}
            cy="15"
            r="7"
            fill="#8b5cf6"
            stroke="#14121f"
            strokeWidth="2"
            className="cursor-ew-resize transition-transform hover:scale-110"
            style={{ transformOrigin: `${scaleX(range[1])}% 15px` }}
          />
        </svg>

        {/* Invisible drag zones over the handles */}
        <div
          className="absolute top-0 h-full cursor-ew-resize"
          style={{ left: `calc(${scaleX(range[0])}% - 10px)`, width: '20px' }}
          onMouseDown={() => setDragging('left')}
          onTouchStart={() => setDragging('left')}
        />
        <div
          className="absolute top-0 h-full cursor-ew-resize"
          style={{ left: `calc(${scaleX(range[1])}% - 10px)`, width: '20px' }}
          onMouseDown={() => setDragging('right')}
          onTouchStart={() => setDragging('right')}
        />
      </div>

      <div className="flex justify-between text-[10px] text-white/30 mono tabular-nums">
        <span>{formatYear(range[0])}</span>
        <span>{formatYear(range[1])}</span>
      </div>
    </div>
  );
}
