import { GameType, LeaderboardEntry, UserProfile } from '../types';

const STORAGE_KEY_LEADERBOARDS = 'middle1_arcade_leaderboards_v2';
const STORAGE_KEY_USER_PROFILE = 'middle1_arcade_user_profile_v1';

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  // Baseball (숫자야구: 적은 횟수일수록 고득점)
  { id: 'bb-1', game: 'baseball', playerName: '야구천재 민서', gradeClass: '1학년 3반', score: 3, subText: '3회 만에 정답 (01:24)', date: '방금 전', avatar: '⚾' },
  { id: 'bb-2', game: 'baseball', playerName: '홈런왕 준우', gradeClass: '1학년 1반', score: 4, subText: '4회 만에 정답 (01:45)', date: '5분 전', avatar: '🧢' },
  { id: 'bb-3', game: 'baseball', playerName: '수학탐정 시우', gradeClass: '1학년 5반', score: 5, subText: '5회 만에 정답 (02:10)', date: '12분 전', avatar: '🔍' },
  { id: 'bb-4', game: 'baseball', playerName: '번개투수 하은', gradeClass: '1학년 2반', score: 6, subText: '6회 만에 정답 (02:30)', date: '30분 전', avatar: '⚡' },
  { id: 'bb-5', game: 'baseball', playerName: '불꽃타자 도윤', gradeClass: '1학년 4반', score: 7, subText: '7회 만에 정답 (03:15)', date: '1시간 전', avatar: '🔥' },

  // Omok (오목: 연승 수 & 승리 점수)
  { id: 'om-1', game: 'omok', playerName: '오목의신 예준', gradeClass: '1학년 4반', score: 950, subText: 'AI전 12연승 (24수 승리)', date: '2분 전', avatar: '🥋' },
  { id: 'om-2', game: 'omok', playerName: '흑돌마스터 지아', gradeClass: '1학년 2반', score: 880, subText: 'AI전 9연승 (28수 승리)', date: '15분 전', avatar: '⚫' },
  { id: 'om-3', game: 'omok', playerName: '삼삼수호자 건우', gradeClass: '1학년 1반', score: 820, subText: 'AI전 8연승 (32수 승리)', date: '35분 전', avatar: '🛡️' },
  { id: 'om-4', game: 'omok', playerName: '백돌여왕 서윤', gradeClass: '1학년 6반', score: 760, subText: 'AI전 6연승 (36수 승리)', date: '40분 전', avatar: '⚪' },

  // Nim (님게임: 수학적 승리 연승 및 턴 점수)
  { id: 'nm-1', game: 'nim', playerName: '수학전교1등 현우', gradeClass: '1학년 2반', score: 990, subText: '천재 AI 상대로 완승 (3연속)', date: '방금 전', avatar: '📐' },
  { id: 'nm-2', game: 'nim', playerName: '논리괴물 다은', gradeClass: '1학년 3반', score: 910, subText: '보통 AI 상대로 완승', date: '8분 전', avatar: '🧩' },
  { id: 'nm-3', game: 'nim', playerName: '돌멩이수집가 윤서', gradeClass: '1학년 1반', score: 840, subText: '베스킨라빈스 모드 승리', date: '22분 전', avatar: '💎' },

  // Chess (체스: 레이팅 점수 / 승리)
  { id: 'ch-1', game: 'chess', playerName: '그랜드마스터 태오', gradeClass: '1학년 5반', score: 1450, subText: '체크메이트 18수만 달성', date: '4분 전', avatar: '👑' },
  { id: 'ch-2', game: 'chess', playerName: '나이트질주 채원', gradeClass: '1학년 4반', score: 1380, subText: 'AI 격파 (퀸 희생 전술)', date: '18분 전', avatar: '🐴' },
  { id: 'ch-3', game: 'chess', playerName: '비숍사냥꾼 유찬', gradeClass: '1학년 2반', score: 1310, subText: 'AI 중급전 승리', date: '45분 전', avatar: '⚔️' },

  // Mario (마리오 점프런: 코인 + 밟기 + 거리 점수)
  { id: 'mr-1', game: 'mario', playerName: '점프대장 동현', gradeClass: '1학년 1반', score: 4850, subText: '거리 680m · 코인 32개', date: '1분 전', avatar: '🍄' },
  { id: 'mr-2', game: 'mario', playerName: '스피드스타 수아', gradeClass: '1학년 3반', score: 4120, subText: '거리 540m · 굼바 14마리 처치', date: '10분 전', avatar: '⭐' },
  { id: 'mr-3', game: 'mario', playerName: '코인헌터 민재', gradeClass: '1학년 6반', score: 3680, subText: '거리 490m · 코인 45개', date: '25분 전', avatar: '🪙' },
  { id: 'mr-4', game: 'mario', playerName: '황금마리오 하율', gradeClass: '1학년 2반', score: 3200, subText: '거리 410m · 슈퍼스타 달성', date: '50분 전', avatar: '🏃' },
];

export function loadLeaderboards(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return INITIAL_LEADERBOARD;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADERBOARDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LEADERBOARDS, JSON.stringify(INITIAL_LEADERBOARD));
      return INITIAL_LEADERBOARD;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter(
        (item) => item && typeof item === 'object' && item.game && typeof item.score === 'number'
      );
      if (valid.length > 0) return valid;
    }
    localStorage.setItem(STORAGE_KEY_LEADERBOARDS, JSON.stringify(INITIAL_LEADERBOARD));
    return INITIAL_LEADERBOARD;
  } catch {
    return INITIAL_LEADERBOARD;
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
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  return newEntry;
}

export function resetLeaderboards(): LeaderboardEntry[] {
  try {
    localStorage.removeItem(STORAGE_KEY_LEADERBOARDS);
    localStorage.removeItem('middle1_arcade_leaderboards_v1');
    localStorage.setItem(STORAGE_KEY_LEADERBOARDS, JSON.stringify(INITIAL_LEADERBOARD));
  } catch (e) {
    console.error('Failed to reset leaderboards', e);
  }
  return INITIAL_LEADERBOARD;
}

export function clearAllLeaderboards(): LeaderboardEntry[] {
  try {
    localStorage.removeItem(STORAGE_KEY_LEADERBOARDS);
    localStorage.removeItem('middle1_arcade_leaderboards_v1');
    localStorage.setItem(STORAGE_KEY_LEADERBOARDS, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear leaderboards', e);
  }
  return [];
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

// Live real-time feed generator for classmates
export const RIVAL_NAMES = [
  { name: '도윤', class: '1학년 3반', avatar: '⚡' },
  { name: '지우', class: '1학년 2반', avatar: '🔥' },
  { name: '서아', class: '1학년 5반', avatar: '✨' },
  { name: '시우', class: '1학년 1반', avatar: '🎯' },
  { name: '하은', class: '1학년 4반', avatar: '🎮' },
  { name: '민서', class: '1학년 6반', avatar: '🚀' },
  { name: '예준', class: '1학년 2반', avatar: '🥋' },
  { name: '수아', class: '1학년 3반', avatar: '👑' },
];

export const LIVE_TICKER_MESSAGES = [
  '📢 [1학년 2반 지우] 마리오 러너에서 4,350점 신기록 달성!',
  '📢 [1학년 3반 도윤] 숫자 야구 3회 만에 스트라이크 올킬 성공!',
  '📢 [1학년 5반 서아] 오목 AI 하드모드를 18수만에 격파했습니다!',
  '📢 [1학년 1반 시우] 님 게임에서 수학천재 AI 상대로 완승!',
  '📢 [1학년 4반 하은] 체스에서 퀸 희생 전술로 체크메이트 달성!',
  '🔥 실시간 중1 아케이드 동시 접속자 184명 플레이 중!',
  '🏆 오늘의 중1 통합 MVP 도전자가 현재 1위를 달리고 있습니다!',
];
