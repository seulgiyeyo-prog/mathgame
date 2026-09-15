import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { GameType } from '../types';
import { soundEffects } from '../utils/audio';

interface WinModalProps {
  isOpen: boolean;
  game: GameType;
  title: string;
  subTitle: string;
  scoreText: string;
  isNewRecord?: boolean;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  onBackToMenu: () => void;
}

export default function WinModal({
  isOpen,
  title,
  subTitle,
  scoreText,
  isNewRecord = true,
  onPlayAgain,
  onViewLeaderboard,
  onBackToMenu,
}: WinModalProps) {
  useEffect(() => {
    if (isOpen) {
      soundEffects.win();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-4xl shadow-inner animate-bounce">
          🏆
        </div>

        {isNewRecord && (
          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 mb-2 shadow-sm">
            <Sparkles className="w-3 h-3" />
            실시간 랭킹 등록 완료!
          </span>
        )}

        <h3 className="text-xl sm:text-2xl font-black text-white">{title}</h3>
        <p className="text-xs text-slate-300 mt-1 mb-4">{subTitle}</p>

        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 mb-6">
          <div className="text-[11px] text-slate-400 font-semibold mb-0.5">내 최종 기록</div>
          <div className="text-lg sm:text-xl font-black text-amber-300">{scoreText}</div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              soundEffects.click();
              onPlayAgain();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>한 판 더 대결하기!</span>
          </button>

          <button
            onClick={() => {
              soundEffects.click();
              onViewLeaderboard();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs transition-colors"
          >
            <Trophy className="w-4 h-4" />
            <span>실시간 전교 랭킹 확인</span>
          </button>

          <button
            onClick={() => {
              soundEffects.click();
              onBackToMenu();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
          >
            <span>게임 메뉴로 나가기</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
