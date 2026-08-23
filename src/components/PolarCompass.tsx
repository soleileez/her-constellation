import { useState } from 'react';
import type { RegionConnection } from '@/data/stories';

interface Props {
  regionCounts: Record<string, number>;
  countryCounts: Record<string, Record<string, number>>;
  connections: RegionConnection[];
  onRegionClick?: (region: string) => void;
  onCountryClick?: (region: string, country: string) => void;
  activeRegion?: string | null;
  activeCountry?: string | null;
}

const REGION_COLORS: Record<string, string> = {
  '亚洲': '#06b6d4',
  '欧洲': '#8b5cf6',
  '非洲': '#f59e0b',
  '北美': '#ec4899',
};

export default function PolarCompass({
  regionCounts,
  countryCounts,
  connections,
  onRegionClick,
  onCountryClick,
  activeRegion,
  activeCountry,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredConn, setHoveredConn] = useState<number | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const regions = Object.keys(regionCounts);
  const total = Object.values(regionCounts).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(regionCounts));
  const angleStep = (2 * Math.PI) / regions.length;

  // Circular layout — all region nodes on the same circle
  const center = 180;
  const ringRadius = 115;
  const countrySpread = 32;

  const getCoord = (index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + ringRadius * Math.cos(angle),
      y: center + ringRadius * Math.sin(angle),
      angle,
    };
  };

  const isConnActive = (conn: RegionConnection) =>
    hovered === conn.from || hovered === conn.to || activeRegion === conn.from || activeRegion === conn.to;

  const handleNodeClick = (region: string) => {
    const next = expandedRegion === region ? null : region;
    setExpandedRegion(next);
    onRegionClick?.(region);
  };

  return (
    <div className="w-full aspect-square max-w-[380px] mx-auto">
      <svg viewBox="0 0 360 360" className="w-full h-full">
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="60%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Background grid — concentric circles */}
        {[0.33, 0.66, 1].map((r) => (
          <circle key={r} cx={center} cy={center} r={r * ringRadius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        ))}

        {/* Chord lines */}
        {connections.map((conn, idx) => {
          const i1 = regions.indexOf(conn.from);
          const i2 = regions.indexOf(conn.to);
          if (i1 < 0 || i2 < 0) return null;
          const p1 = getCoord(i1);
          const p2 = getCoord(i2);
          const active = isConnActive(conn);
          const opacity = active ? 0.7 : 0.15 + 0.25 * (conn.strength / 5);

          return (
            <g key={idx}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={`rgba(139, 92, 246, ${opacity})`}
                strokeWidth={active ? 2.5 + conn.strength * 0.5 : 1 + conn.strength * 0.3}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredConn(idx)}
                onMouseLeave={() => setHoveredConn(null)}
              />
              {hoveredConn === idx && (
                <text
                  x={(p1.x + p2.x) / 2}
                  y={(p1.y + p2.y) / 2 - 5}
                  fontSize="8"
                  fill="rgba(255,255,255,0.85)"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {conn.sharedThemes?.join(' · ') || `共享 ${conn.strength}`}
                </text>
              )}
            </g>
          );
        })}

        {/* Country sub-branches for expanded region */}
        {expandedRegion && countryCounts[expandedRegion] && (() => {
          const i = regions.indexOf(expandedRegion);
          const parent = getCoord(i);
          const countries = Object.entries(countryCounts[expandedRegion]);
          const branchAngleSpread = 0.8;
          const branchCount = countries.length;

          return countries.map(([country, count], ci) => {
            const branchOffset = branchCount === 1 ? 0 : (ci / (branchCount - 1) - 0.5) * branchAngleSpread;
            const branchAngle = parent.angle + branchOffset;
            const bx = parent.x + countrySpread * Math.cos(branchAngle);
            const by = parent.y + countrySpread * Math.sin(branchAngle);
            const color = REGION_COLORS[expandedRegion] || '#8b5cf6';
            const isCountryActive = activeCountry === country;

            return (
              <g
                key={country}
                className="cursor-pointer transition-opacity duration-200"
                onClick={() => onCountryClick?.(expandedRegion, country)}
              >
                <line
                  x1={parent.x}
                  y1={parent.y}
                  x2={bx}
                  y2={by}
                  stroke={color}
                  strokeWidth="0.6"
                  opacity={isCountryActive ? 0.8 : 0.35}
                  strokeDasharray="2,2"
                />
                <circle cx={bx} cy={by} r={isCountryActive ? 7 : 5.5} fill={color} opacity={isCountryActive ? 0.9 : 0.6} />
                <circle cx={bx} cy={by} r={isCountryActive ? 11 : 8.5} fill={color} opacity="0.15" />
                <text
                  x={bx}
                  y={by}
                  fontSize="8"
                  fontWeight="500"
                  fill="rgba(255,255,255,0.95)"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="mono"
                >
                  {count}
                </text>
                <text
                  x={bx + 16 * Math.cos(branchAngle)}
                  y={by + 16 * Math.sin(branchAngle) + 3}
                  fontSize="9"
                  fill={isCountryActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'}
                  textAnchor={Math.cos(branchAngle) > 0.15 ? 'start' : Math.cos(branchAngle) < -0.15 ? 'end' : 'middle'}
                  className="tracking-wider whitespace-nowrap"
                >
                  {country}
                </text>
              </g>
            );
          });
        })()}

        {/* Region nodes — all on the same circle */}
        {regions.map((region, i) => {
          const count = regionCounts[region];
          const pos = getCoord(i);
          const nodeR = 7 + 6 * Math.sqrt(count / maxCount);
          const color = REGION_COLORS[region] || '#8b5cf6';
          const isActive = hovered === region || activeRegion === region || expandedRegion === region;
          const isDimmed = (hovered || activeRegion || expandedRegion) && !isActive && !connections.some(c => (c.from === region || c.to === region) && (hovered === c.from || hovered === c.to || activeRegion === c.from || activeRegion === c.to));

          return (
            <g
              key={region}
              className="cursor-pointer transition-all duration-200"
              style={{ opacity: isDimmed ? 0.3 : 1 }}
              onMouseEnter={() => setHovered(region)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleNodeClick(region)}
            >
              <circle cx={pos.x} cy={pos.y} r={nodeR + 5} fill={color} opacity={isActive ? 0.25 : 0.1} />
              <circle cx={pos.x} cy={pos.y} r={nodeR} fill="url(#nodeGradient)" opacity="0.9" className="animate-pulse-slow" />
              <text
                x={pos.x}
                y={pos.y}
                fontSize="11"
                fontWeight="500"
                fill="rgba(255,255,255,0.95)"
                textAnchor="middle"
                dominantBaseline="central"
                className="mono"
              >
                {count}
              </text>
              <text
                x={pos.x}
                y={pos.y + nodeR + 14}
                fontSize="9"
                fill={isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
                textAnchor="middle"
                className="tracking-wider"
                style={{ transition: 'fill 0.2s' }}
              >
                {region}
                {expandedRegion === region ? ' ▾' : ' ▸'}
              </text>
            </g>
          );
        })}

        {/* Center */}
        <circle cx={center} cy={center} r="32" fill="#14121f" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <text x={center} y={center - 5} fontSize="22" fontWeight="500" fill="rgba(255,255,255,0.9)" textAnchor="middle" className="mono">
          {total}
        </text>
        <text x={center} y={center + 14} fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="middle" className="tracking-wider">
          全部
        </text>
      </svg>
    </div>
  );
}
