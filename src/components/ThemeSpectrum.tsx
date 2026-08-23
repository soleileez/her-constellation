import { useState } from 'react';
import type { ThemeDatum } from '@/data/stories';
import { THEME_COLORS } from '@/data/stories';

interface Props {
  data: ThemeDatum[];
  onThemeClick?: (theme: string) => void;
  activeTheme?: string | null;
}

export default function ThemeSpectrum({ data, onThemeClick, activeTheme }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-2.5">
      {data.map((item) => {
        const pct = (item.count / maxCount) * 100;
        const color = THEME_COLORS[item.name] || '#8b5cf6';
        const isHovered = hovered === item.name;
        const isActive = activeTheme === item.name;

        return (
          <div
            key={item.name}
            className="group relative flex items-center gap-3 cursor-pointer"
            onMouseEnter={() => setHovered(item.name)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onThemeClick?.(item.name)}
          >
            <span
              className="w-20 text-right text-xs truncate transition-colors"
              style={{
                color: isHovered || isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
              }}
            >
              {item.name}
            </span>

            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-visible relative">
              <div
                className="h-full rounded-full bar-grow transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(to right, ${color}66, ${color})`,
                  boxShadow: `0 0 20px ${color}55`,
                  filter: isHovered || isActive ? 'brightness(1.3)' : 'brightness(1)',
                }}
              />
            </div>

            <span className="mono text-white/80 text-[10px] w-6 text-right tabular-nums">{item.count}</span>
            <span className="text-white/30 text-[10px] w-10 text-right tabular-nums">{Math.round(pct)}%</span>

            {isHovered && (
              <div className="absolute bottom-full left-24 mb-2 px-3 py-2 rounded-lg bg-black/90 border border-white/10 shadow-xl z-20 pointer-events-none whitespace-nowrap">
                <div className="text-[10px] text-white/40 mb-1 tracking-wider">代表人物</div>
                <div className="text-xs text-white/90 space-y-0.5">
                  {item.representatives.map((name) => (
                    <div key={name}>{name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
