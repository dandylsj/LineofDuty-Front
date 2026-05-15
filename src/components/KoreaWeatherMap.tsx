import { useState } from 'react';

interface City {
  id: string;
  name: string;
  label: string;
  nx: number;
  ny: number;
}

interface Props {
  cities: City[];
  selectedCityId: string;
  onSelectCity: (city: City) => void;
}

// 지도 위 각 도시 버튼 위치 (% 기준)
const CITY_POSITIONS: Record<string, React.CSSProperties> = {
  incheon:  { top: '20%', left: '25%' },
  seoul:    { top: '18%', left: '45%' },
  gyeonggi: { top: '22%', right: '18%' },
  nonsan:   { top: '45%', left: '18%' },
  daejeon:  { top: '42%', left: '47%' },
  daegu:    { top: '40%', right: '12%' },
  gwangju:  { bottom: '33%', left: '22%' },
  busan:    { bottom: '26%', right: '20%' },
};

// 버튼에 표시할 짧은 라벨
const BUTTON_LABELS: Record<string, string> = {
  incheon: '인천',
  seoul: '서울',
  gyeonggi: '경기',
  nonsan: '충남',
  daejeon: '대전',
  daegu: '대구',
  gwangju: '광주',
  busan: '부산',
};

const MAP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBns2QtRPiOrajVTp2qwbi_ZiJJEqel74lfsdU6FvtR1pAKl42tKaFFH4stJUhSC8l4P4zCae9LT_C3Zimi_jn_jKGs4yEFWKD6-n6p8kaHkLTIrA_njRoXSLyTnSCCOvmB5xLPyrWEeZA9uccPVMizYHMHRjARY5_Sbqu2Uta_YZQGKpKOnO7HRuWsA6oWSALP693oYo6RMn2kYavzNRTUgPgE505e_H_Nn-qA8zE1Wed3UPtSshhYclCkWVzGNSkv8X9_XWSCU3fF';

export default function KoreaWeatherMap({ cities, selectedCityId, onSelectCity }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const cityMap = Object.fromEntries(cities.map((c) => [c.id, c]));
  const selectedCity = cityMap[selectedCityId];

  return (
    <div style={{ width: '100%', marginBottom: '16px' }}>
      {/* 지도 컨테이너 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 5',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(189,200,209,0.2)',
          background: 'rgba(0,101,141,0.05)',
        }}
      >
        {/* 지도 배경 이미지 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          }}
        >
          <img
            src={MAP_IMAGE}
            alt="한국 지도"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(1)',
              opacity: 0.3,
            }}
          />
        </div>

        {/* 도시 버튼들 */}
        {cities.map((city) => {
          const pos = CITY_POSITIONS[city.id];
          const label = BUTTON_LABELS[city.id] ?? city.name;
          const isSelected = city.id === selectedCityId;
          const isHovered = city.id === hoveredId && !isSelected;

          if (!pos) return null;

          return (
            <button
              key={city.id}
              onClick={() => onSelectCity(city)}
              onMouseEnter={() => setHoveredId(city.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'absolute',
                ...pos,
                padding: isSelected ? '6px 12px' : '2px 6px',
                borderRadius: '6px',
                fontSize: isSelected ? '11px' : '9px',
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
                border: isSelected ? 'none' : '1px solid rgba(189,200,209,0.35)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                zIndex: isSelected ? 10 : 5,
                background: isSelected
                  ? '#00aeef'
                  : isHovered
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.82)',
                color: isSelected ? '#fff' : '#6e7881',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                boxShadow: isSelected ? '0 2px 10px rgba(0,101,141,0.35)' : 'none',
              }}
            >
              {label}
            </button>
          );
        })}

        {/* 선택된 지역 필 */}
        {selectedCity && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: '#fff',
              padding: '4px 12px',
              borderRadius: '9999px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid rgba(189,200,209,0.15)',
              whiteSpace: 'nowrap',
              zIndex: 20,
            }}
          >
            <span style={{ fontSize: '13px', color: '#ba1a1a' }}>📍</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#00658d' }}>
              {selectedCity.label.replace('📍 ', '')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
