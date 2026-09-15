import { useState, useEffect } from 'react';
import { Radio, Flame } from 'lucide-react';
import { LIVE_TICKER_MESSAGES, RIVAL_NAMES } from '../utils/storage';

interface LiveTickerProps {
  onOpenLeaderboard: () => void;
}

export default function LiveTicker({ onOpenLeaderboard }: LiveTickerProps) {
  const [messages, setMessages] = useState<string[]>(LIVE_TICKER_MESSAGES);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate ticker every 4.5 seconds and randomly inject a real-time event
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [messages.length]);

  // Simulate spontaneous school rivals breaking records
  useEffect(() => {
    const interval = setInterval(() => {
      const rival = RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)];
      const games = [
        { name: '오목 AI', result: '연승 기록을 갱신했습니다!' },
        { name: '숫자야구', result: '4회 만에 스트라이크 올킬!' },
        { name: '마리오 점프런', result: `${Math.floor(Math.random() * 2000 + 2500)}점 돌파!` },
        { name: '님 게임', result: '수학 천재 AI를 물리쳤습니다!' },
        { name: '체스', result: '멋진 포크 전술로 승리!' },
      ];
      const g = games[Math.floor(Math.random() * games.length)];
      const newMsg = `🔥 [${rival.class} ${rival.name}] ${g.name}에서 ${g.result}`;
      
      setMessages((prev) => [newMsg, ...prev.slice(0, 10)]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
