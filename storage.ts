import { GameType, LeaderboardEntry, UserProfile } from '../types';

const STORAGE_KEY_LEADERBOARDS = 'middle1_arcade_leaderboards_v4';
const STORAGE_KEY_USER_PROFILE = 'middle1_arcade_user_profile_v1';

// 초기 랭킹은 빈 상태로 시작합니다 (가상의 더미 학생 데이터 제거)
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [];

// 이전 버전의 가상 더미 데이터 id 목록 검출용
const DUMMY_ID_PREFIXES = ['bb-', 'om-', 'nm-', 'ch-', 'mr-'];

function sanitizeLeaderboardEntries(list: any[]): LeaderboardEntry[] {
  if (!Array.isArray(list)) return [];
  return list.filter((item) => {
    if (!item || typeof item !== 'object' || !item.game || typeof item.score !== 'number') {
      return false;
    }
    // 더미 데이터 ID 제거 (bb-1, om-1 등)
    if (typeof item.id === 'string' && DUMMY_ID_PREFIXES.some((pre) => item.id.startsWith(pre))) {
      return false;
    }
    return true;
  });
}

export function loadLeaderboards(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    // 1. 현재 v4 키에서 확인
    const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const sanitized = sanitizeLeaderboardEntries(parsed);
      return sanitized;
    }

    // 2. 만약 v4가 없으면 이전 버전(v2, v1)에서 실제 유저가 기록한 데이터만 마이그레이션
    const legacyKeys = ['middle1_arcade_leaderboards_v2', 'middle1_arcade_leaderboards_v1'];
    for (const key of legacyKeys) {
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw);
          const sanitized = sanitizeLeaderboardEntries(parsed);
          // 더미를 제외하고 실제 유저 기록이 있으면 마이그레이션 저장
          localStorage.setItem(STORAGE_KEY_LEADERBOARDS, JSON.stringify(sanitized));
          // 이전 레거시 키 정리
          localStorage.removeItem(key);
          return sanitized;
        } catch {
          localStorage.removeItem(key);
        }
      }
    }

    // 아무 기록도 없으면 빈 배열 저장 후 반환
    localStorage.setItem(STORAGE_KEY_LEADERBOARDS, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
  const current = loadLeaderboards();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `user-${Date.now()}`,
    date: '방금 전',
    isUser: true,
  };

  const updated = [newEntry, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_LEADERBOARDS, JSON.stringify(updated));
    // 다른 컴포넌트 실시간 동기화용 이벤트 발생
    window.dispatchEvent(new CustomEvent('leaderboardUpdated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  return newEntry;
}

export function resetLeaderboards(): LeaderboardEntry[] {
  try {
    localStorage.removeItem(STORAGE_KEY_LEADERBOARDS);
    localStorage.removeItem('middle1_arcade_leaderboards_v3');
    localStorage.removeItem('middle1_arcade_leaderboards_v2');
    localStorage.removeItem('middle1_arcade_leaderboards_v1');
    localStorage.setItem(STORAGE_KEY_LEADERBOARDS, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('leaderboardUpdated', { detail: [] }));
  } catch (e) {
    console.error('Failed to reset leaderboards', e);
  }
  return [];
}

export function clearAllLeaderboards(): LeaderboardEntry[] {
  return resetLeaderboards();
}

export function getTopRankerForGame(game: GameType): LeaderboardEntry | null {
  const entries = loadLeaderboards();
  const list = entries.filter((e) => e && e.game === game);
  if (list.length === 0) return null;

  // baseball은 적은 횟수가 1위 (오름차순), 나머지는 높은 점수가 1위 (내림차순)
  const isAsc = game === 'baseball';
  const sorted = [...list].sort((a, b) => {
    const sA = typeof a?.score === 'number' ? a.score : 0;
    const sB = typeof b?.score === 'number' ? b.score : 0;
    return isAsc ? sA - sB : sB - sA;
  });

  return sorted[0] || null;
}

export function getUserProfile(): UserProfile {
  const defaultProfile: UserProfile = {
    name: '',
    studentId: '',
    gradeClass: '',
    avatar: '🎮',
    titles: ['새내기 중1 게이머'],
  };
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return defaultProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error(e);
  }
}

// 실시간 속보 안내 메시지 (허위 가상 학생 기록 배제)
export const LIVE_TICKER_MESSAGES = [
  '🎮 중1 챔피언 아케이드에 오신 것을 환영합니다!',
  '🏆 마리오, 오목, 야구, 님게임, 체스에서 전교 1위에 도전해보세요!',
  '✨ 게임을 클리어하면 내 이름과 점수가 실시간 명예의 전당에 즉시 등록됩니다.',
  '🔥 친구와 함께 점수 대결을 펼치고 최고의 승자가 되어보세요!',
  '📐 두뇌와 전략으로 승리하는 퇴계초중학교 중1 챔피언 아케이드!',
];

export const RIVAL_NAMES: { name: string; class: string; avatar: string }[] = [];
