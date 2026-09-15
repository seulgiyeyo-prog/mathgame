import { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, ArrowRight, RotateCcw, CheckCircle2, XCircle, HelpCircle, Flame } from 'lucide-react';
import { BonusQuiz, MarioStage } from '../../utils/marioStages';
import { soundEffects } from '../../utils/audio';

interface MarioBonusModalProps {
  isOpen: boolean;
  stage: MarioStage;
  quiz: BonusQuiz;
  currentScore: number;
  currentCoins: number;
  onApplyBonus: (bonusScore: number, bonusCoins: number) => void;
  onNextStage?: () => void;
  onFinishGame: () => void;
  onRetryStage: () => void;
}

export default function MarioBonusModal({
  isOpen,
  stage,
  quiz,
  currentScore,
  currentCoins,
  onApplyBonus,
  onNextStage,
  onFinishGame,
  onRetryStage,
}: MarioBonusModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectOption = (idx: number) => {
    if (answered) return;
    setSelectedIndex(idx);
    setAnswered(true);

    const correct = idx === quiz.answerIndex;
    setIsCorrect(correct);

    if (correct) {
      soundEffects.win();
      soundEffects.powerup();
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
      onApplyBonus(quiz.bonusScore, quiz.bonusCoins);
    } else {
      soundEffects.out();
      onApplyBonus(0, 0);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case '수학':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case '과학':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case '게임':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-7 max-w-md w-full text-center shadow-2xl shadow-amber-500/25 animate-in zoom-in-95 duration-200 text-slate-100">
        {/* Stage Clear Banner */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl animate-bounce">{stage.badgeEmoji}</span>
          <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/50 text-xs font-black tracking-wide">
            {stage.stageCode} : {stage.name} CLEAR!
          </span>
          <span className="text-2xl animate-bounce">🚩</span>
        </div>

        <h3 className="text-xl font-black text-white mb-1">
          골인 보너스 퀴즈 타임!
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          문제를 맞히면 <strong className="text-amber-300 font-bold">+{quiz.bonusScore.toLocaleString()}점</strong> 및 <strong className="text-amber-300 font-bold">코인 +{quiz.bonusCoins}개</strong> 보너스를 획득합니다!
        </p>

        {/* Question Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left mb-4 shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${getCategoryBadge(quiz.category)}`}>
              {quiz.category} 퀴즈
            </span>
            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              보너스 +{quiz.bonusScore.toLocaleString()}P
            </span>
          </div>

          <p className="text-sm font-bold text-slate-100 leading-snug">
            {quiz.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-4 text-left">
          {quiz.options.map((option, idx) => {
            let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700';

            if (answered) {
              if (idx === quiz.answerIndex) {
                btnStyle = 'bg-emerald-600/30 border-emerald-400 text-emerald-300 font-black shadow-md shadow-emerald-500/20';
              } else if (idx === selectedIndex) {
                btnStyle = 'bg-rose-600/30 border-rose-400 text-rose-300 font-bold';
              } else {
                btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                disabled={answered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all duration-150 ${btnStyle}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-950/60 border border-slate-700 text-[11px] flex items-center justify-center font-black">
                    {idx + 1}
                  </span>
                  <span>{option}</span>
                </div>

                {answered && idx === quiz.answerIndex && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {answered && idx === selectedIndex && idx !== quiz.answerIndex && (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Result Banner */}
        {answered && (
          <div className="mb-4 animate-in fade-in duration-200">
            {isCorrect ? (
              <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs text-left">
                <div className="font-black flex items-center gap-1.5 text-emerald-300 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  정답입니다! +{quiz.bonusScore.toLocaleString()}점 보너스 획득! 🪙 x{quiz.bonusCoins}
                </div>
                <p className="text-slate-300 text-[11px]">{quiz.explanation}</p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs text-left">
                <div className="font-black flex items-center gap-1.5 text-rose-300 mb-1">
                  <HelpCircle className="w-4 h-4" />
                  아쉽네요! 정답은 {quiz.answerIndex + 1}번입니다.
                </div>
                <p className="text-slate-300 text-[11px]">{quiz.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {answered ? (
          <div className="space-y-2 animate-in fade-in duration-150">
            {onNextStage && (
              <button
                onClick={onNextStage}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
              >
                <span>다음 스테이지 도전하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onFinishGame}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>랭킹 등록 및 완료</span>
              </button>

              <button
                onClick={onRetryStage}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1"
                title="현재 스테이지 다시하기"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>다시하기</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-[11px] text-slate-500">
            정답을 선택하시면 결과와 다음 스테이지 버튼이 활성화됩니다!
          </div>
        )}
      </div>
    </div>
  );
}
