import {
  Droplets, Shirt, Footprints, Package, Watch, HeartPulse, ShoppingBag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CategoryVisual {
  Icon: LucideIcon;
  color: string;
  bg: string;
}

// 카테고리 이름의 키워드로 아이콘/색상을 정한다 (이미지가 없는 상품의 썸네일, 카테고리 아이콘에 사용)
const VISUALS: { keywords: string[]; visual: CategoryVisual }[] = [
  { keywords: ['세면', '위생'],       visual: { Icon: Droplets,   color: '#2a5c7c', bg: '#e3eff6' } },
  { keywords: ['의류', '속옷', '군복'], visual: { Icon: Shirt,      color: '#4a5c2a', bg: '#edf1e2' } },
  { keywords: ['신발', '발', '군화'],   visual: { Icon: Footprints, color: '#7c5c2a', bg: '#f5ede0' } },
  { keywords: ['생활', '잡화'],       visual: { Icon: Package,    color: '#5c2a7c', bg: '#efe4f5' } },
  { keywords: ['시계', '전자'],       visual: { Icon: Watch,      color: '#2a7c5c', bg: '#e0f3ec' } },
  { keywords: ['건강', '보호'],       visual: { Icon: HeartPulse, color: '#a8323e', bg: '#f8e6e8' } },
];

const DEFAULT_VISUAL: CategoryVisual = { Icon: ShoppingBag, color: '#0050a0', bg: '#e6eef8' };

export function getCategoryVisual(name?: string | null): CategoryVisual {
  if (!name) return DEFAULT_VISUAL;
  return VISUALS.find(v => v.keywords.some(k => name.includes(k)))?.visual ?? DEFAULT_VISUAL;
}
