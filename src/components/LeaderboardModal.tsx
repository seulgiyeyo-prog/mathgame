import { useState, useMemo, useEffect } from 'react';
import { Trophy, X, RefreshCw, Flame, Crown, Sparkles, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import { GameType, LeaderboardEntry } from '../types';
import { loadLeaderboards, resetLeaderboards, clearAllLeaderboards } from '../utils/storage';
import { soundEffects } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGame?: GameType;
}

const GAME_NAMES: Record<
  GameType,
  { title: string; icon: string; scoreUnit: string; sortDesc: boolean; subtitle: string }
> = {
  mario: { title: '마리오 점프런', icon: '🍄', scoreUnit: '점', sortDesc: true, subtitle: '높은 점수 순 (거리+코인)' },
  omok: { title: '진검승부 오목', icon: '⚔️', scoreUnit: '점', sortDesc: true, subtitle: '승리 점수 & 연승 순' },
  baseball: { title: '숫자 야구', icon: '⚾', scoreUnit: '회', sortDesc: false, subtitle: '적은 시도 횟수 순' },
  nim: { title: '수학 님 게임', icon: '📐', scoreUnit: '점', sortDesc: true, subtitle: '수학 논리 대결 승리 순' },
  chess: { title: '클래식 체스', icon: '♟️', scoreUnit: '점', sortDesc: true, subtitle: '체크메이트 레이팅 점수' },
};

export default function LeaderboardModal({
  isOpen,
  onClose,
  initialGame = 'mario',
}: LeaderboardModalProps) {
  const [selectedGame, setSelectedGame] = useState<GameType>(() => {
    return (initialGame && GAME_NAMES[initialGame]) ? initialGame : 'mario';
  });
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => loadLeaderboards());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Synchronize initial game and refresh entries when modal opens or initialGame changes
  useEffect(() => {
    if (isOpen) {
      if (initialGame && GAME_NAMES[initialGame]) {
        setSelectedGame(initialGame);
      }
      setEntries(loadLeaderboards());
      setShowResetConfirm(false);
    }
  }, [isOpen, initialGame]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    soundEffects.click();
    setTimeout(() => {
      setEntries(loadLeaderboards());
      setIsRefreshing(false);
    }, 350);
  };

  const handleResetLeaderboard = () => {
    soundEffects.powerup();
    const updated = resetLeaderboards();
    setEntries(updated);
    setShowResetConfirm(false);
  };

  const handleClearAll = () => {
    soundEffects.out();
    const updated = clearAllLeaderboards();
    setEntries(updated);
    setShowResetConfirm(false);
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(entries)) return [];
    const targetGame = GAME_NAMES[selectedGame] ? selectedGame : 'mario';
    const config = GAME_NAMES[targetGame];
    const list = entries.filter((e) => e && e.game === targetGame);
    return [...list].sort((a, b) => {
      const sA = typeof a?.score === 'number' ? a.score : 0;
      const sB = typeof b?.score === 'number' ? b.score : 0;
      if (config.sortDesc) return sB - sA;
      return sA - sB;
    });
  }, [entries, selectedGame]);

  if (!isOpen) return null;

  const currentConfig = GAME_NAMES[selectedGame] || GAME_NAMES.mario;
  const first = filtered[0];
  const second = filtered[1];
  const third = filtered[2];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-amber-400/70 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-amber-500/10 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-amber-500/10 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20">
              <Trophy className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">중1 실시간 명예의 전당</h2>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  실시간 연동
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-400/50 transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => {
                soundEffects.click();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Tabs */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex gap-1.5 overflow-x-auto no-scrollbar">
          {(Object.keys(GAME_NAMES) as GameType[]).map((game) => {
            const isSelected = selectedGame === game;
            const meta = GAME_NAMES[game];
            return (
              <button
                key={game}
                onClick={() => {
                  soundEffects.click();
                  setSelectedGame(game);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Top 3 Podium Cards */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 items-end">
              {/* 2nd Place (Left) */}
              <div className="relative rounded-2xl bg-slate-800/80 border border-slate-700/90 p-3 flex flex-col items-center text-center">
                {second ? (
                  <>
                    <div className="absolute -top-3.5 bg-slate-300 text-slate-950 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
                      2
                    </div>
                    <div className="text-2xl sm:text-3xl mt-1 mb-1">{second.avatar || '🥈'}</div>
                    <div className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                      {second.playerName || '익명'}
                    </div>
                    <div className="text-[10px] text-slate-400 mb-1">{second.gradeClass || '1학년'}</div>
                    <div className="text-[11px] font-extrabold text-slate-200 bg-slate-700/80 px-2 py-0.5 rounded-lg border border-slate-600/50 truncate max-w-full">
                      {second.subText || `${second.score}${currentConfig.scoreUnit}`}
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-[11px] text-slate-500">
                    2위석 비어있음
                  </div>
                )}
              </div>

              {/* 1st Place (Center - Gold) */}
              <div className="relative rounded-2xl bg-gradient-to-b from-amber-500/25 via-amber-950/20 to-slate-900 border-2 border-amber-400 p-3.5 flex flex-col items-center text-center shadow-xl shadow-amber-500/10 scale-105 z-10">
                {first ? (
                  <>
                    <div className="absolute -top-4 bg-amber-400 text-slate-950 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md border-2 border-amber-200">
                      <Crown className="w-4 h-4 fill-slate-950" />
                    </div>
                    <div className="text-3xl sm:text-4xl mt-1 mb-1">{first.avatar || '👑'}</div>
                    <div className="text-xs sm:text-base font-black text-amber-300 truncate max-w-full">
                      {first.playerName || '1위 플레이어'}
                    </div>
                    <div className="text-[10px] text-amber-200/90 mb-1 font-bold">{first.gradeClass || '1학년'}</div>
                    <div className="text-xs font-black text-amber-400 bg-amber-400/20 px-2.5 py-0.5 rounded-lg border border-amber-400/50 truncate max-w-full">
                      {first.subText || `${first.score}${currentConfig.scoreUnit}`}
                    </div>
                    <span className="mt-1 text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-amber-400" /> 1위 왕좌
                    </span>
                  </>
                ) : (
                  <div className="py-6 text-center text-xs text-amber-400">
                    첫 번째 1위에 도전하세요!
                  </div>
                )}
              </div>

              {/* 3rd Place (Right) */}
              <div className="relative rounded-2xl bg-slate-800/80 border border-slate-700/90 p-3 flex flex-col items-center text-center">
                {third ? (
                  <>
                    <div className="absolute -top-3.5 bg-amber-700 text-amber-100 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-amber-500">
                      3
                    </div>
                    <div className="text-2xl sm:text-3xl mt-1 mb-1">{third.avatar || '🥉'}</div>
                    <div className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                      {third.playerName || '익명'}
                    </div>
                    <div className="text-[10px] text-slate-400 mb-1">{third.gradeClass || '1학년'}</div>
                    <div className="text-[11px] font-extrabold text-amber-500 bg-slate-700/80 px-2 py-0.5 rounded-lg border border-slate-600/50 truncate max-w-full">
                      {third.subText || `${third.score}${currentConfig.scoreUnit}`}
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-[11px] text-slate-500">
                    3위석 비어있음
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Ranking List */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between px-1 mb-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>전체 순위 리스트</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                총 {filtered.length}명의 기록
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-sm text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                아직 등록된 기록이 없습니다. 게임을 완료하여 첫 번째 명예의 전당 주인공이 되어보세요!
              </div>
            ) : (
              filtered.map((entry, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={entry.id || `entry-${idx}`}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                      entry.isUser
                        ? 'bg-amber-500/20 border-amber-400/60 ring-1 ring-amber-400/40'
                        : 'bg-slate-800/50 border-slate-800/90 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-6 text-center font-black text-xs sm:text-sm ${
                          rank === 1
                            ? 'text-amber-400'
                            : rank === 2
                            ? 'text-slate-300'
                            : rank === 3
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {rank}
                      </div>

                      <div className="text-xl shrink-0">{entry.avatar || '🎮'}</div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-black text-white truncate">
                            {entry.playerName || '플레이어'}
                          </span>
                          {entry.isUser && (
                            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                              나
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {entry.gradeClass || '1학년'} · {entry.date || '최근'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-amber-400">
                        {entry.subText || `${entry.score}${currentConfig.scoreUnit}`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors"
                title="실시간 랭킹 기록을 초기화합니다"
              >
                <RotateCcw className="w-3 h-3" />
                <span>랭킹 초기화</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-rose-950/80 p-1 px-2 rounded-lg border border-rose-500/40 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-rose-300">정말 초기화할까요?</span>
                <button
                  onClick={handleResetLeaderboard}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black transition-colors"
                >
                  기본값 복원
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-200 text-[10px] font-black border border-rose-500/30 transition-colors"
                >
                  완전 삭제
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white"
                >
                  취소
                </button>
              </div>
            )}
            <span className="hidden sm:inline text-slate-500 text-[11px]">
              💡 게임 클리어 시 실시간으로 랭킹에 즉시 등록됩니다.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold transition-colors ml-auto"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
