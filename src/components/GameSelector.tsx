import { useState, useEffect } from 'react';
import { Trophy, Play, Sparkles, Brain, Flame, Target, Swords, Zap } from 'lucide-react';
import { GameType, LeaderboardEntry } from '../types';
import { loadLeaderboards } from '../utils/storage';
import { soundEffects } from '../utils/audio';

interface GameSelectorProps {
  onSelectGame: (game: GameType) => void;
  onOpenLeaderboard: (game: GameType) => void;
}

interface GameCardMeta {
  id: GameType;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  gradient: string;
  borderHover: string;
  icon: string;
  description: string;
  features: string[];
}

const GAMES: GameCardMeta[] = [
  {
    id: 'mario',
    title: '마리오 점프런',
    subtitle: 'Super Mario Runner',
    badge: '대형 와이드 화면',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    gradient: 'from-rose-500/10 via-amber-500/5 to-slate-900',
    borderHover: 'hover:border-rose-400/60',
    icon: '🍄',
    description: '더 넓어진 대형 와이드 스크린에서 신나는 2D 횡스크롤 질주! 굼바를 밟고 황금 코인을 쓸어 담으세요.',
    features: ['넓어진 840px 와이드 뷰', '점프 & 몬스터 퇴치', '실시간 플레이어 랭킹'],
  },
  {
    id: 'baseball',
    title: '숫자 야구',
    subtitle: 'Number Baseball',
    badge: '두뇌 풀가동',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    gradient: 'from-emerald-500/10 via-cyan-500/5 to-slate-900',
    borderHover: 'hover:border-emerald-400/60',
    icon: '⚾',
    description: '중1 수학 논리의 끝판왕! 3자리/4자리 숫자를 스트라이크 & 볼 단서로 최소 횟수에 맞혀보세요.',
    features: ['3자리 / 4자리 모드', '실시간 투수 리액션', '최소 시도 횟수 랭킹'],
  },
  {
    id: 'omok',
    title: '진검승부 오목',
    subtitle: 'Gomoku vs AI',
    badge: '스테디셀러',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    gradient: 'from-amber-500/10 via-orange-500/5 to-slate-900',
    borderHover: 'hover:border-amber-400/60',
    icon: '⚔️',
    description: '15x15 정통 반상에서 펼쳐지는 명승부! 영리한 AI 컴퓨터 또는 친구와 2인 대결을 즐기세요.',
    features: ['AI 대전 / 2인 친구 대결', '승리 애니메이션 & 착수음', '연승 기록 보관소'],
  },
  {
    id: 'nim',
    title: '수학 님 게임',
    subtitle: 'Nim & Baskin 31',
    badge: '중1 수학필수',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    gradient: 'from-purple-500/10 via-pink-500/5 to-slate-900',
    borderHover: 'hover:border-purple-400/60',
    icon: '📐',
    description: '돌멩이를 번갈아 가져가는 필승 전략 수학 게임! 베스킨라빈스31 모드와 3더미 모드 지원.',
    features: ['1~3개 집기 모드', '3더미(Nim-Sum) 모드', '수학 천재 AI 탑재'],
  },
  {
    id: 'chess',
    title: '클래식 체스',
    subtitle: 'Smart Chess Arena',
    badge: '체크 대응 & 고지능 AI',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    gradient: 'from-blue-500/10 via-indigo-500/5 to-slate-900',
    borderHover: 'hover:border-blue-400/60',
    icon: '♟️',
    description: '알파베타 수읽기 AI 탑재! 체크 회피와 3단계 난이도(초급/중급/마스터), 실시간 기물 밸런스 분석 지원.',
    features: ['알파베타 미니맥스 AI', '체크 경고 & 합법수 필터', '초급/중급/마스터 3단계'],
  },
];

export default function GameSelector({ onSelectGame, onOpenLeaderboard }: GameSelectorProps) {
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>(() => loadLeaderboards());

  useEffect(() => {
    const handleUpdate = () => {
      setLeaderboards(loadLeaderboards());
    };
    window.addEventListener('leaderboardUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('leaderboardUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const getRankInfo = (gameId: GameType) => {
    const list = leaderboards.filter((e) => e && e.game === gameId);
    if (list.length === 0) {
      return {
        topRanker: '1위: 아직 등록된 기록 없음 (도전하세요!)',
        statsText: '도전 대기 중',
      };
    }
    const isAsc = gameId === 'baseball';
    const sorted = [...list].sort((a, b) => {
      const sA = typeof a?.score === 'number' ? a.score : 0;
      const sB = typeof b?.score === 'number' ? b.score : 0;
      return isAsc ? sA - sB : sB - sA;
    });
    const top = sorted[0];
    const unit = gameId === 'baseball' ? '회' : '점';
    const scoreText = top.subText || `${top.score}${unit}`;
    return {
      topRanker: `1위: ${top.playerName} (${scoreText})`,
      statsText: `기록 ${list.length}개`,
    };
  };
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-indigo-500/20 border border-slate-700/80 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>중1을 위한 최고의 5대 명작 아케이드</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            어떤 게임으로 <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              전교 1위 랭킹
            </span>에 도전할래?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            순발력 만점 마리오부터 추리 야구, 두뇌 수학 님게임, 오목과 체스까지!
            원하는 게임을 선택하고 실시간으로 우리 학년 친구들과 점수를 겨뤄보세요.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-rose-400" /> 실시간 랭킹 자동 반영
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-4 h-4 text-amber-400" /> AI 봇 & 2인 대결 완비
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-cyan-400" /> 8비트 사운드 FX 탑재
            </span>
          </div>
        </div>

        {/* Decorative background icons */}
        <div className="absolute right-4 -bottom-6 text-8xl opacity-15 select-none pointer-events-none hidden sm:block">
          🎮
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`group relative rounded-2xl bg-slate-900/90 border border-slate-800 ${game.borderHover} p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 overflow-hidden`}
          >
            {/* Ambient background glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${game.gradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`}
            />

            <div className="relative z-10">
              {/* Header inside card */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    {game.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                      {game.title}
                    </h3>
                    <div className="text-xs text-slate-400 font-medium">
                      {game.subtitle}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${game.badgeColor}`}
                >
                  {game.badge}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {game.description}
              </p>

              {/* Feature Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {game.features.map((feat) => (
                  <span
                    key={feat}
                    className="text-[10px] font-medium bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60"
                  >
                    ✓ {feat}
                  </span>
                ))}
              </div>

              {/* Top Ranker Banner */}
              {(() => {
                const rankInfo = getRankInfo(game.id);
                return (
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-2.5 flex items-center justify-between text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold truncate">
                      <Trophy className="w-3.5 h-3.5 shrink-0 fill-amber-400 text-amber-400" />
                      <span className="truncate">{rankInfo.topRanker}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{rankInfo.statsText}</span>
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="relative z-10 flex gap-2 pt-1 border-t border-slate-800/80">
              <button
                id={`play-btn-${game.id}`}
                onClick={() => {
                  soundEffects.click();
                  onSelectGame(game.id);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>게임 시작</span>
              </button>

              <button
                id={`rank-btn-${game.id}`}
                onClick={() => {
                  soundEffects.click();
                  onOpenLeaderboard(game.id);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-amber-400 transition-colors"
                title="이 게임 랭킹 보기"
              >
                <Trophy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
