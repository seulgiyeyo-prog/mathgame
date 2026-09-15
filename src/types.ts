export type GameType = 'omok' | 'baseball' | 'nim' | 'chess' | 'mario';

export type ThemeType = 'dark' | 'light' | 'cyber' | 'retro';

export interface LeaderboardEntry {
  id: string;
  game: GameType;
  playerName: string;
  gradeClass: string; // e.g., '1학년 2반'
  score: number;
  subText: string; // e.g., '4회 만에 성공', '12연승', '2,450점'
  date: string;
  avatar: string;
  isUser?: boolean;
}

export interface UserProfile {
  name: string;
  studentId?: string; // 학번 (예: 10101, 1-1 15번 등)
  gradeClass: string;
  avatar: string;
  titles: string[];
}
