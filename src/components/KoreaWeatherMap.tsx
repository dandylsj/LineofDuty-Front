import { useState } from 'react';

interface City {
  id: string;
  name: string;
  label: string;
  nx: number;
  ny: number;
}

interface RegionDef {
  cityId: string;
  displayLabel: string;
  points: string;
  labelX: number;
  labelY: number;
  fontSize?: number;
}

// 한국 주요 지역 SVG 폴리곤 (ViewBox 0 0 260 310 기준)
const REGION_DEFS: RegionDef[] = [
  {
    cityId: 'gyeonggi',
    displayLabel: '경기',
    points: '48,20 185,20 200,62 190,108 95,112 48,108 30,76 36,40',
    labelX: 158,
    labelY: 64,
  },
  {
    cityId: 'incheon',
    displayLabel: '인천',
    points: '18,44 78,42 80,76 60,86 18,72',
    labelX: 46,
    labelY: 62,
    fontSize: 9,
  },
  {
    cityId: 'seoul',
    displayLabel: '서울',
    points: '82,38 138,36 140,66 128,74 80,72',
    labelX: 110,
    labelY: 56,
    fontSize: 9,
  },
  {
    cityId: 'nonsan',
    displayLabel: '충남',
    points: '22,118 98,116 112,152 100,188 50,196 18,174 18,140',
    labelX: 58,
    labelY: 155,
  },
  {
    cityId: 'daejeon',
    displayLabel: '대전',
    points: '105,126 150,122 158,158 142,180 100,176 95,148',
    labelX: 127,
    labelY: 152,
    fontSize: 9,
  },
  {
    cityId: 'daegu',
    displayLabel: '대구',
    points: '156,108 248,106 258,176 240,214 178,212 156,176 160,140',
    labelX: 205,
    labelY: 160,
  },
  {
    cityId: 'gwangju',
    displayLabel: '광주',
    points: '14,200 100,196 112,238 96,276 52,290 12,276 6,238',
    labelX: 55,
    labelY: 242,
  },
  {
    cityId: 'busan',
    displayLabel: '부산',
    points: '148,214 240,214 258,256 240,295 195,308 148,288 132,250',
    labelX: 196,
    labelY: 262,
  },
];

interface Props {
  cities: City[];
  selectedCityId: string;
  onSelectCity: (city: City) => void;
}

export default function KoreaWeatherMap({ cities, selectedCityId, onSelectCity }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));

  return (
    <div className="korea-map-wrapper">
      <svg
        viewBox="0 0 260 315"
        xmlns="http://www.w3.org/2000/svg"
        className="korea-map-svg"
        aria-label="지역 선택 지도"
      >
        {/* 바다 배경 */}
        <rect width="260" height="315" fill="#d6e8f8" rx="10" />

        {REGION_DEFS.map((region) => {
          const city = cityMap[region.cityId];
          if (!city) return null;

          const isSelected = region.cityId === selectedCityId;
          const isHovered = region.cityId === hoveredId && !isSelected;

          const fill = isSelected ? '#1a4fa0' : isHovered ? '#a8c8e8' : '#c2d9f0';
          const stroke = isSelected ? '#0d3380' : '#8ab2d4';
          const textFill = isSelected ? '#ffffff' : '#1a3a5c';

          return (
            <g key={region.cityId}>
              <polygon
                points={region.points}
                fill={fill}
                stroke={stroke}
                strokeWidth="1.5"
                onClick={() => onSelectCity(city)}
                onMouseEnter={() => setHoveredId(region.cityId)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
              />
              <text
                x={region.labelX}
                y={region.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={region.fontSize ?? 10}
                fontWeight={isSelected ? '700' : '500'}
                fill={textFill}
                pointerEvents="none"
                style={{ userSelect: 'none', fontFamily: 'sans-serif' }}
              >
                {region.displayLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 선택된 지역 표시 */}
      <div className="korea-map-label">
        📍 {cities.find((c) => c.id === selectedCityId)?.label.replace('📍 ', '') ?? ''}
      </div>
    </div>
  );
}
