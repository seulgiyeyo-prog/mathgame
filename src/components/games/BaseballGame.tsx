import { useState, useEffect, useCallback, useId } from 'react';
import { RotateCcw, Trophy, HelpCircle, Flame, Check, Delete, Sparkles, Timer } from 'lucide-react';
import { UserProfile, GameType } from '../../types';
import { soundEffects } from '../../utils/audio';
import { saveLeaderboardEntry } from '../../utils/storage';
import WinModal from '../WinModal';
import PlayerNameBanner from '../PlayerNameBanner';

interface BaseballGameProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onOpenLeaderboard: (game: GameType) => void;
  onBackToHub: () => void;
}

interface Attempt {
  guess: string;
  strikes: number;
  balls: number;
  outs: number;
  time: string;
}

// Generate distinct random digits
function generateTarget(digits: number): string {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const selected: number[] = [];
  while (selected.length < digits) {
    const idx = Math.floor(Math.random() * nums.length);
    selected.push(nums[idx]);
    nums.splice(idx, 1);
  }
  return selected.join('');
}

export default function BaseballGame({ userProfile, onUpdateProfile, onOpenLeaderboard, onBackToHub }: BaseballGameProps) {
  const [digitCount, setDigitCount] = useState<3 | 4>(3);
  const [targetNumber, setTargetNumber] = useState<string>(() => generateTarget(3));
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winModalOpen, setWinModalOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [pitcherComment, setPitcherComment] = useState('스트라이크존을 공략해봐! 각 숫자는 중복되지 않아.');
  const [lastScoreText, setLastScoreText] = useState('');
  const gameModeSelectId = useId();

  // Reset Game
  const resetGame = useCallback(
    (digits = digitCount) => {
      const newTarget = generateTarget(digits);
      setTargetNumber(newTarget);
      setCurrentGuess('');
      setAttempts([]);
      setIsGameOver(false);
      setWinModalOpen(false);
      setSeconds(0);
      setTimerActive(true);
      setPitcherComment(`새로운 ${digits}자리 공을 던졌다! 맞춰보시지!`);
    },
    [digitCount]
  );

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && !isGameOver) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, isGameOver]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Process a Guess
  const handleGuess = () => {
    if (currentGuess.length !== digitCount || isGameOver) return;

    // Check unique digits
    const uniqueSet = new Set(currentGuess.split(''));
    if (uniqueSet.size !== digitCount) {
      setPitcherComment('⚠️ 모든 자리는 서로 다른 숫자여야 해!');
      soundEffects.ball();
      return;
    }

    let strikes = 0;
    let balls = 0;

    for (let i = 0; i < digitCount; i++) {
      if (currentGuess[i] === targetNumber[i]) {
        strikes++;
      } else if (targetNumber.includes(currentGuess[i])) {
        balls++;
      }
    }
    const outs = digitCount - (strikes + balls);

    const newAttempt: Attempt = {
      guess: currentGuess,
      strikes,
      balls,
      outs,
      time: formatTime(seconds),
    };

    const nextAttempts = [newAttempt, ...attempts];
    setAttempts(nextAttempts);
    setCurrentGuess('');

    if (strikes === digitCount) {
      // HOMERUN Victory!
      setIsGameOver(true);
      setTimerActive(false);
      soundEffects.homerun();
      setPitcherComment('💥 으아악! 장외 홈런이다! 정답을 완벽하게 맞혔어!');

      const attemptCount = nextAttempts.length;
      const sub = `${attemptCount}회 만에 정답 (${formatTime(seconds)})`;
      setLastScoreText(sub);

      saveLeaderboardEntry({
        game: 'baseball',
        playerName: userProfile.name,
        gradeClass: userProfile.gradeClass,
        score: attemptCount,
        subText: sub,
        avatar: userProfile.avatar,
      });

      setWinModalOpen(true);
    } else {
      // Feedback
      if (strikes > 0 && balls > 0) {
        soundEffects.strike();
        setPitcherComment(`🔥 날카로운 배팅! ${strikes}스트라이크 ${balls}볼! 정답이 코앞이야!`);
      } else if (strikes > 0) {
        soundEffects.strike();
        setPitcherComment(`⚡ ${strikes}스트라이크! 위치까지 완벽한 숫자가 있어.`);
      } else if (balls > 0) {
        soundEffects.ball();
        setPitcherComment(`⚾ ${balls}볼! 숫자는 맞지만 자리가 달라.`);
      } else {
        soundEffects.out();
        setPitcherComment(`💨 아웃! 던진 숫자 중 일치하는 게 하나도 없어.`);
      }
    }
  };

  // Keyboard Keypad click
  const handleKeypadPress = (num: number) => {
    if (isGameOver) return;
    if (currentGuess.length < digitCount) {
      if (!currentGuess.includes(num.toString())) {
        soundEffects.click();
        setCurrentGuess((prev) => prev + num);
      } else {
        soundEffects.ball();
      }
    }
  };

  const handleBackspace = () => {
    soundEffects.click();
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  // Physical keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      if (e.key >= '1' && e.key <= '9') {
        const n = parseInt(e.key, 10);
        if (currentGuess.length < digitCount && !currentGuess.includes(e.key)) {
          soundEffects.click();
          setCurrentGuess((prev) => prev + n);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleGuess();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentGuess, digitCount, isGameOver]);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Player Name Banner */}
      <PlayerNameBanner
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        gameTitle="숫자 야구"
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
            ⚾
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              숫자 야구 게임
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                중1 수학 논리 추리
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {digitCount}자리 숫자를 최소 투구 수로 맞혀 전교 1위에 도전하세요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switch (3 digits vs 4 digits) */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                soundEffects.click();
                setDigitCount(3);
                resetGame(3);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                digitCount === 3
                  ? 'bg-emerald-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3자리 모드
            </button>
            <button
              onClick={() => {
                soundEffects.click();
                setDigitCount(4);
                resetGame(4);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                digitCount === 4
                  ? 'bg-emerald-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4자리 마스터
            </button>
          </div>

          <button
            onClick={() => onOpenLeaderboard('baseball')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>랭킹</span>
          </button>
        </div>
      </div>

      {/* Main Game Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Pitcher Mascot & Scoreboard Lamp */}
        <div className="lg:col-span-7 space-y-4">
          {/* Stadium Scoreboard Display */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-slate-800 p-5 shadow-2xl relative overflow-hidden">
            {/* Top Stats */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-bold">
              <div className="flex items-center gap-2 text-slate-300">
                <Timer className="w-4 h-4 text-emerald-400" />
                <span>경기 시간: {formatTime(seconds)}</span>
              </div>
              <div className="text-amber-400">
                현재 이닝: <span className="text-sm font-black">{attempts.length + 1}회초</span>
              </div>
            </div>

            {/* Pitcher Speech Bubble */}
            <div className="flex items-start gap-3 mb-5 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0">
                🧢
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-300">AI 에이스 투수</div>
                <div className="text-xs sm:text-sm text-white font-medium mt-0.5">
                  {pitcherComment}
                </div>
              </div>
            </div>

            {/* Guess Input Slot Display */}
            <div className="flex flex-col items-center justify-center py-2 mb-4">
              <div className="text-xs text-slate-400 font-semibold mb-2">내가 예측한 숫자</div>
              <div className="flex items-center gap-3">
                {Array.from({ length: digitCount }).map((_, idx) => {
                  const digit = currentGuess[idx];
                  return (
                    <div
                      key={idx}
                      className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black transition-all ${
                        digit
                          ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-slate-800/80 border-2 border-dashed border-slate-700 text-slate-500'
                      }`}
                    >
                      {digit || '?'}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stadium LED Lamps Indicator (Last Result) */}
            {attempts.length > 0 && (
              <div className="flex items-center justify-center gap-6 bg-slate-950/80 rounded-xl p-3 border border-slate-800">
                {/* Strikes */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-400">S</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: digitCount }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all ${
                          i < attempts[0].strikes
                            ? 'bg-amber-400 shadow-md shadow-amber-400'
                            : 'bg-slate-800 border border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Balls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400">B</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: digitCount }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all ${
                          i < attempts[0].balls
                            ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                            : 'bg-slate-800 border border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Out */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-400">O</span>
                  <span
                    className={`w-4 h-4 rounded-full transition-all ${
                      attempts[0].strikes === 0 && attempts[0].balls === 0
                        ? 'bg-rose-500 shadow-md shadow-rose-500 animate-pulse'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Keypad */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-sm mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const isUsed = currentGuess.includes(num.toString());
                return (
                  <button
                    key={num}
                    onClick={() => handleKeypadPress(num)}
                    disabled={isUsed || isGameOver}
                    className={`h-12 sm:h-14 rounded-xl font-black text-lg transition-all ${
                      isUsed
                        ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 shadow-sm'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}

              {/* Backspace */}
              <button
                onClick={handleBackspace}
                disabled={currentGuess.length === 0 || isGameOver}
                className="h-12 sm:h-14 rounded-xl font-bold text-xs sm:text-sm bg-slate-800/80 hover:bg-slate-700 text-rose-400 border border-slate-700 flex items-center justify-center gap-1 active:scale-95"
              >
                <Delete className="w-4 h-4" />
                <span>지우기</span>
              </button>

              {/* Reset Game Button */}
              <button
                onClick={() => {
                  soundEffects.click();
                  resetGame();
                }}
                className="h-12 sm:h-14 rounded-xl font-bold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>다시하기</span>
              </button>

              {/* Submit Guess Button */}
              <button
                onClick={handleGuess}
                disabled={currentGuess.length !== digitCount || isGameOver}
                className="h-12 sm:h-14 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 disabled:opacity-40 text-slate-950 flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>배팅!</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Inning History Record & Rules */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col h-[480px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>투구 기록표 ({attempts.length}회 투구)</span>
              </div>
              <span className="text-[10px] text-slate-500">최근 기록 위로</span>
            </div>

            {/* History Table List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {attempts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
                  <div className="text-3xl mb-2">⚾</div>
                  <div>아직 투구 기록이 없습니다.</div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    키패드나 키보드 숫자를 눌러 첫 공을 던져보세요!
                  </div>
                </div>
              ) : (
                attempts.map((att, idx) => {
                  const attemptNum = attempts.length - idx;
                  const isHomerun = att.strikes === digitCount;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isHomerun
                          ? 'bg-amber-400/20 border-amber-400/60 shadow-md'
                          : 'bg-slate-800/40 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 w-6">
                          #{attemptNum}
                        </span>
                        <span className="text-base font-black tracking-widest text-white">
                          {att.guess}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-black">
                        {isHomerun ? (
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> 홈런!
                          </span>
                        ) : att.strikes === 0 && att.balls === 0 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            아웃 (OUT)
                          </span>
                        ) : (
                          <>
                            {att.strikes > 0 && (
                              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                                {att.strikes}S
                              </span>
                            )}
                            {att.balls > 0 && (
                              <span className="px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                                {att.balls}B
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Rules Box */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1 text-slate-300 font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>숫자야구 규칙 (Strike / Ball / Out)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • <strong>스트라이크(S)</strong>: 숫자와 자리(위치)가 모두 일치<br />
              • <strong>볼(B)</strong>: 숫자는 포함되어 있으나 자리가 다름<br />
              • <strong>아웃(OUT)</strong>: 제시한 모든 숫자가 불일치
            </p>
          </div>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={winModalOpen}
        game="baseball"
        title="홈런! 숫자 야구 정답!"
        subTitle="완벽한 수학적 논리로 AI의 마구 번호를 간파했습니다!"
        scoreText={lastScoreText}
        onPlayAgain={() => resetGame()}
        onViewLeaderboard={() => {
          setWinModalOpen(false);
          onOpenLeaderboard('baseball');
        }}
        onBackToMenu={() => {
          setWinModalOpen(false);
          onBackToHub();
        }}
      />
    </div>
  );
}
