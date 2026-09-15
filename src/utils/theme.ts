import { ThemeType } from '../types';

export interface ThemeOption {
  id: ThemeType;
  name: string;
  icon: string;
  desc: string;
  badge: string;
  previewBg: string;
  previewAccent: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'dark',
    name: '아케이드 다크',
    icon: '🌙',
    desc: '기본 게이밍 다크 테마',
    badge: '기본',
    previewBg: 'bg-slate-900',
    previewAccent: 'bg-amber-400',
  },
  {
    id: 'light',
    name: '클린 라이트',
    icon: '☀️',
    desc: '깔끔한 학교/교실 화이트 모드',
    badge: '학교 모드',
    previewBg: 'bg-slate-100',
    previewAccent: 'bg-indigo-600',
  },
  {
    id: 'cyber',
    name: '네온 사이버',
    icon: '⚡',
    desc: '화려한 네온 사이버펑크 오락실',
    badge: '인기',
    previewBg: 'bg-slate-950',
    previewAccent: 'bg-cyan-400',
  },
  {
    id: 'retro',
    name: '레트로 8비트',
    icon: '🕹️',
    desc: '고전 오락실 CRT 그린 & 앰버',
    badge: '추억의 8-bit',
    previewBg: 'bg-[#081b11]',
    previewAccent: 'bg-emerald-400',
  },
];

const STORAGE_KEY_THEME = 'middle1_arcade_theme_v1';

export function getSavedTheme(): ThemeType {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemeType;
    if (saved && ['dark', 'light', 'cyber', 'retro'].includes(saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'dark';
}

export function saveTheme(theme: ThemeType): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    applyThemeToDocument(theme);
  } catch (e) {
    console.error('Failed to save theme', e);
  }
}

export function applyThemeToDocument(theme: ThemeType): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('theme-dark', 'theme-light', 'theme-cyber', 'theme-retro');
  root.classList.add(`theme-${theme}`);
  
  if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }
}
