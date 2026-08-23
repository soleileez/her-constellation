import { useState } from 'react';
import { X } from 'lucide-react';
import type { Stats, Story } from '@/data/stories';
import ThemeSpectrum from './ThemeSpectrum';
import TimelineModule from './TimelineModule';
import PolarCompass from './PolarCompass';

interface Props {
  stats: Stats;
  people: Story[];
  onClose: () => void;
  onThemeClick: (theme: string) => void;
  onRegionClick: (region: string) => void;
  onCountryClick: (region: string, country: string) => void;
  activeTheme: string | null;
  activeRegion: string | null;
  activeCountry: string | null;
}

export default function StatsModal({
  stats,
  people,
  onClose,
  onThemeClick,
  onRegionClick,
  onCountryClick,
  activeTheme,
  activeRegion,
  activeCountry,
}: Props) {
  const [localTheme, setLocalTheme] = useState<string | null>(null);
  const [localRegion, setLocalRegion] = useState<string | null>(null);

  const handleThemeClick = (theme: string) => {
    const next = localTheme === theme ? null : theme;
    setLocalTheme(next);
    onThemeClick(theme);
  };

  const handleRegionClick = (region: string) => {
    const next = localRegion === region ? null : region;
    setLocalRegion(next);
    onRegionClick(region);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="w-[580px] max-w-full max-h-[85vh] overflow-y-auto p-8 rounded-3xl bg-[#14121f]/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-900/20 animate-zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-medium tracking-[0.3em] text-white/90">✦ 星图总览</h2>
            <p className="text-[10px] font-light tracking-[0.1em] text-white/30 mt-1">
              散落在时间与地理里的星星
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-6 text-xs font-light text-white/40">
              <span>
                跨度 <b className="mono font-medium text-white/80 tabular-nums">{stats.centurySpan}</b> 世纪
              </span>
              <span>
                覆盖 <b className="mono font-medium text-white/80 tabular-nums">{stats.regionCount}</b> 大地区
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="text-white/40 hover:text-white/90 transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Module 1: Theme Spectrum */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] text-white/50 uppercase mb-4">议题分布</h3>
          <ThemeSpectrum
            data={stats.themeData}
            onThemeClick={handleThemeClick}
            activeTheme={localTheme || activeTheme}
          />
        </section>

        {/* Module 2: Timeline */}
        <section className="mb-8">
          <h3 className="text-sm font-bold tracking-[0.2em] text-white/50 uppercase mb-4">时空跨度</h3>
          <TimelineModule data={people} minYear={1000} maxYear={2200} />
        </section>

        {/* Module 3: Polar Compass */}
        <section>
          <h3 className="text-sm font-bold tracking-[0.2em] text-white/50 uppercase mb-4">地域关联</h3>
          <PolarCompass
            regionCounts={stats.regionCounts}
            countryCounts={stats.countryCounts}
            connections={stats.connections}
            onRegionClick={handleRegionClick}
            onCountryClick={onCountryClick}
            activeRegion={localRegion || activeRegion}
            activeCountry={activeCountry}
          />
        </section>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <span className="text-[11px] font-light tracking-widest text-white/30 hover:text-white/70 transition-colors cursor-default">
            点击议题或星点，联动点亮主星座
          </span>
        </div>
      </div>
    </div>
  );
}
