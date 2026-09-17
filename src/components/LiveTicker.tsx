import { useState, useEffect, useCallback } from 'react';
import { Radio, Flame } from 'lucide-react';
import { LIVE_TICKER_MESSAGES, loadLeaderboards } from '../utils/storage';
import { GameType } from '../types';

interface LiveTickerProps {
  onOpenLeaderboard: () => void;
}

const GAME_TITLE_MAP: Record<GameType, string> = {
  mario: '마리오 점프런',
  baseball: '숫자 야구',
  omok: '진검승부 오목',
  nim: '수학 님 게임',
  chess: '클래식 체스',
};

export default function LiveTicker({ onOpenLeaderboard }: LiveTickerProps) {
  const buildMessages = useCallback((): string[] => {
    const entries = loadLeaderboards();
    const realPlayerMsgs: string[] = [];

    // 최근 기록 최대 5개 추출하여 실시간 속보로 표시
    const recentEntries = entries.slice(0, 5);
    for (const entry of recentEntries) {
      if (entry && entry.playerName) {
        const gameName = GAME_TITLE_MAP[entry.game] || '게임';
        const grade = entry.gradeClass ? `[${entry.gradeClass} ${entry.playerName}]` : `[${entry.playerName}]`;
        const scoreInfo = entry.subText || `${entry.score}점`;
        realPlayerMsgs.push(`🔥 ${grade} ${gameName}에서 ${scoreInfo} 달성! (${entry.date || '최근'})`);
      }
    }

    // 실제 등록된 기록 메시지 + 기본 아케이드 안내 메시지
    return realPlayerMsgs.length > 0 ? [...realPlayerMsgs, ...LIVE_TICKER_MESSAGES] : LIVE_TICKER_MESSAGES;
  }, []);

  const [messages, setMessages] = useState<string[]>(() => buildMessages());
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate ticker every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [messages.length]);

  // Listen for leaderboard updates (new record saved, ranking reset, etc.)
  useEffect(() => {
    const handleUpdate = () => {
      const updated = buildMessages();
      setMessages(updated);
      setCurrentIndex(0);
    };

    window.addEventListener('leaderboardUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('leaderboardUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [buildMessages]);

  return (
    <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-1.5 overflow-hidden">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[11px] shrink-0 border border-rose-500/30">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>실시간 중1 속보</span>
          </div>

          <div
            key={currentIndex}
            className="truncate text-slate-300 font-medium transition-all duration-500 transform animate-in fade-in slide-in-from-bottom-1"
          >
            {messages[currentIndex]}
          </div>
        </div>

        <button
          onClick={onOpenLeaderboard}
          className="shrink-0 text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors underline underline-offset-2"
        >
          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>순위표 보기</span>
        </button>
      </div>
    </div>
  );
}
