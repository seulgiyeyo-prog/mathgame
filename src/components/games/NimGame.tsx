import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, HelpCircle, Bot, Users, Sparkles, Brain, Lightbulb } from 'lucide-react';
import { UserProfile, GameType } from '../../types';
import { soundEffects } from '../../utils/audio';
import { saveLeaderboardEntry } from '../../utils/storage';
import WinModal from '../WinModal';
import PlayerNameBanner from '../PlayerNameBanner';

interface NimGameProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onOpenLeaderboard: (game: GameType) => void;
  onBackToHub: () => void;
}

type NimMode = 'single' | 'triple'; // 'single' = 21 stones, 1-3 take. 'triple' = 3-5-7 piles classic.
type AiDifficulty = 'easy' | 'normal' | 'genius';

export default function NimGame({ userProfile, onUpdateProfile, onOpenLeaderboard, onBackToHub }: NimGameProps) {
  const [mode, setMode] = useState<NimMode>('single');
  const [isPvE, setIsPvE] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<AiDifficulty>('normal');

  // Single Pile State (21 stones default)
  const [singleCount, setSingleCount] = useState<number>(21);
  const [singleSelected, setSingleSelected] = useState<number>(1);

  // Triple Piles State (3, 5, 7 stones)
  const [piles, setPiles] = useState<number[]>([3, 5, 7]);
  const [selectedPileIdx, setSelectedPileIdx] = useState<number | null>(null);
  const [takeCount, setTakeCount] = useState<number>(1);

  // Turn: 1 = Player 1, 2 = Player 2 (or AI)
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [winModalOpen, setWinModalOpen] = useState<boolean>(false);
  const [lastScoreText, setLastScoreText] = useState<string>('');

  const p1Name = userProfile.name || '나(도전자)';
  const p2Name = isPvE
    ? `AI (${difficulty === 'genius' ? '수학천재' : difficulty === 'normal' ? '보통' : '초급'})`
    : '2P (친구)';

  // Reset Game
  const resetGame = useCallback(
    (newMode = mode) => {
      setMode(newMode);
      setSingleCount(21);
      setSingleSelected(1);
      setPiles([3, 5, 7]);
      setSelectedPileIdx(null);
      setTakeCount(1);
      setCurrentPlayer(1);
      setIsGameOver(false);
      setWinner(null);
      setAiThinking(false);
      setActionLog([
        newMode === 'single'
          ? '게임 시작! 21개의 크리스탈 중 1~3개를 가져가세요. 마지막 돌을 가져가는 사람이 패배합니다!'
          : '게임 시작! 3개의 더미 중 한 더미를 골라 원하는 만큼 돌을 가져가세요!',
      ]);
      setShowHint(false);
      setWinModalOpen(false);
    },
    [mode]
  );

  // Math hint for middle school students
  const getMathHint = () => {
    if (mode === 'single') {
      // For Misere 21 stones, 1-3 take:
      // Winning positions leaving 1, 5, 9, 13, 17, 21 (remainder 1 modulo 4)
      const targetRemainder = 1;
      const rem = (singleCount - targetRemainder) % 4;
      if (rem > 0) {
        return `💡 수학 비법: 지금 돌을 [${rem}개] 가져가면 남은 돌을 4의 배수 + 1로 만들어 무조건 승리할 수 있어!`;
      }
      return '💡 수학 비법: 현재 상대방이 유리한 위치입니다. 상대의 실수를 기다리며 1개를 가져가보세요!';
    } else {
      // Nim-sum (XOR)
      const xor = piles[0] ^ piles[1] ^ piles[2];
      if (xor !== 0) {
        return `💡 님-합(XOR) 수학 비법: 현재 전체 님-합은 ${xor}입니다. 더미를 조정해 님-합을 0으로 만들면 필승!`;
      }
      return '💡 현재 님-합이 0인 균형 상태입니다. 상대가 균형을 깰 때까지 1개만 신중히 가져가세요.';
    }
  };

  // AI Logic for Single Mode (Misere 1-3 take)
  const calculateAiSingleMove = useCallback(
    (currentStones: number): number => {
      // If easy, just random 1~3
      if (difficulty === 'easy') {
        return Math.min(currentStones, Math.floor(Math.random() * Math.min(3, currentStones)) + 1);
      }

      // If genius or normal (normal has 70% chance to play optimal)
      if (difficulty === 'normal' && Math.random() > 0.75) {
        return Math.min(currentStones, Math.floor(Math.random() * Math.min(3, currentStones)) + 1);
      }

      // Winning strategy: leave (4k + 1) stones so opponent is forced to take the last one
      // If currentStones is 4k + 2 -> take 1 -> leaves 4k + 1
      // If currentStones is 4k + 3 -> take 2 -> leaves 4k + 1
      // If currentStones is 4k + 4 -> take 3 -> leaves 4k + 1
      // If currentStones is 4k + 1 -> already stuck, take 1
      const desiredRemainder = 1;
      const diff = (currentStones - desiredRemainder) % 4;
      if (diff > 0 && diff <= 3) {
        return diff;
      }
      // If already at 4k + 1 or last stones:
      if (currentStones <= 3) {
        return Math.max(1, currentStones - 1);
      }
      return 1;
    },
    [difficulty]
  );

  // AI Logic for Triple Piles (XOR Nim-sum)
  const calculateAiTripleMove = useCallback(
    (currentPiles: number[]): { pileIdx: number; count: number } => {
      if (difficulty === 'easy' || (difficulty === 'normal' && Math.random() > 0.7)) {
        // Random valid pile
        const validIndices = currentPiles
          .map((c, i) => (c > 0 ? i : -1))
          .filter((i) => i !== -1);
        const pIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
        const count = Math.floor(Math.random() * currentPiles[pIdx]) + 1;
        return { pileIdx: pIdx, count };
      }

      // Genius / optimal Nim-Sum (XOR = 0)
      const xorSum = currentPiles[0] ^ currentPiles[1] ^ currentPiles[2];
      if (xorSum !== 0) {
        for (let i = 0; i < 3; i++) {
          const target = currentPiles[i] ^ xorSum;
          if (target < currentPiles[i]) {
            return { pileIdx: i, count: currentPiles[i] - target };
          }
        }
      }

      // If already balanced, take 1 from biggest pile
      let maxIdx = 0;
      for (let i = 1; i < 3; i++) {
        if (currentPiles[i] > currentPiles[maxIdx]) maxIdx = i;
      }
      return { pileIdx: maxIdx, count: 1 };
    },
    [difficulty]
  );

  // Handle Player Take in Single Mode
  const handleSingleTake = (countToTake: number) => {
    if (isGameOver || aiThinking) return;
    if (countToTake < 1 || countToTake > 3 || countToTake > singleCount) return;

    soundEffects.takeStones();
    const remaining = singleCount - countToTake;
    setSingleCount(remaining);

    const log = `[${currentPlayer === 1 ? p1Name : p2Name}] 크리스탈 ${countToTake}개 가져감 (남은 수: ${remaining}개)`;
    setActionLog((prev) => [log, ...prev.slice(0, 7)]);

    // Check Win/Loss (Misere: whoever takes the last stone LOSES)
    if (remaining === 0) {
      setIsGameOver(true);
      const winPlayer = currentPlayer === 1 ? p2Name : p1Name;
      setWinner(winPlayer);

      if (currentPlayer === 2) {
        // Player 1 Won!
        soundEffects.win();
        const score = difficulty === 'genius' ? 950 : difficulty === 'normal' ? 800 : 650;
        const sub = `${difficulty === 'genius' ? '천재 AI' : 'AI'} 상대로 수학 승리`;
        setLastScoreText(sub);

        saveLeaderboardEntry({
          game: 'nim',
          playerName: userProfile.name,
          gradeClass: userProfile.gradeClass,
          score,
          subText: sub,
          avatar: userProfile.avatar,
        });

        setWinModalOpen(true);
      } else {
        soundEffects.lose();
      }
      return;
    }

    if (isPvE) {
      setCurrentPlayer(2);
      setAiThinking(true);
      setTimeout(() => {
        const aiTake = calculateAiSingleMove(remaining);
        soundEffects.takeStones();
        const afterAi = remaining - aiTake;
        setSingleCount(afterAi);

        const aiLog = `[${p2Name}] 크리스탈 ${aiTake}개 가져감 (남은 수: ${afterAi}개)`;
        setActionLog((prev) => [aiLog, ...prev.slice(0, 7)]);

        if (afterAi === 0) {
          // AI took the last stone -> Player 1 WINS!
          setIsGameOver(true);
          setWinner(p1Name);
          setAiThinking(false);

          soundEffects.win();
          const score = difficulty === 'genius' ? 990 : difficulty === 'normal' ? 850 : 700;
          const sub = `${difficulty === 'genius' ? '수학천재 AI' : 'AI'} 제압 (완승)`;
          setLastScoreText(sub);

          saveLeaderboardEntry({
            game: 'nim',
            playerName: userProfile.name,
            gradeClass: userProfile.gradeClass,
            score,
            subText: sub,
            avatar: userProfile.avatar,
          });

          setWinModalOpen(true);
        } else {
          setCurrentPlayer(1);
          setAiThinking(false);
        }
      }, 600);
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  // Handle Player Take in Triple Piles Mode
  const handleTripleTake = () => {
    if (isGameOver || aiThinking || selectedPileIdx === null) return;
    const currentPileAmount = piles[selectedPileIdx];
    if (takeCount < 1 || takeCount > currentPileAmount) return;

    soundEffects.takeStones();
    const nextPiles = [...piles];
    nextPiles[selectedPileIdx] -= takeCount;
    setPiles(nextPiles);
    setSelectedPileIdx(null);
    setTakeCount(1);

    const log = `[${currentPlayer === 1 ? p1Name : p2Name}] ${selectedPileIdx + 1}번 더미에서 ${takeCount}개 가져감`;
    setActionLog((prev) => [log, ...prev.slice(0, 7)]);

    const totalRemaining = nextPiles.reduce((a, b) => a + b, 0);
    if (totalRemaining === 0) {
      // Normal rule: last to take WINS
      setIsGameOver(true);
      const winPlayer = currentPlayer === 1 ? p1Name : p2Name;
      setWinner(winPlayer);

      if (currentPlayer === 1) {
        soundEffects.win();
        const score = 920;
        const sub = '3더미 Nim-Sum 수학 승리';
        setLastScoreText(sub);

        saveLeaderboardEntry({
          game: 'nim',
          playerName: userProfile.name,
          gradeClass: userProfile.gradeClass,
          score,
          subText: sub,
          avatar: userProfile.avatar,
        });

        setWinModalOpen(true);
      } else {
        soundEffects.lose();
      }
      return;
    }

    if (isPvE) {
      setCurrentPlayer(2);
      setAiThinking(true);
      setTimeout(() => {
        const aiMove = calculateAiTripleMove(nextPiles);
        soundEffects.takeStones();
        const afterAiPiles = [...nextPiles];
        afterAiPiles[aiMove.pileIdx] -= aiMove.count;
        setPiles(afterAiPiles);

        const aiLog = `[${p2Name}] ${aiMove.pileIdx + 1}번 더미에서 ${aiMove.count}개 가져감`;
        setActionLog((prev) => [aiLog, ...prev.slice(0, 7)]);

        const afterAiTotal = afterAiPiles.reduce((a, b) => a + b, 0);
        if (afterAiTotal === 0) {
          setIsGameOver(true);
          setWinner(p2Name);
          setAiThinking(false);
          soundEffects.lose();
        } else {
          setCurrentPlayer(1);
          setAiThinking(false);
        }
      }, 700);
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Player Name Banner */}
      <PlayerNameBanner
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        gameTitle="님 게임"
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl">
            📐
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              수학 님 게임 (Nim Game)
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                중1 필승 수학 전략
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'single'
                ? '베스킨라빈스31 룰! 마지막 1개를 남겨 상대를 함정에 빠뜨리세요!'
                : '3개의 돌무더기에서 님-합(XOR)을 0으로 만드는 자가 승리합니다!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => resetGame('single')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'single'
                  ? 'bg-purple-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1~3개 집기 (21개)
            </button>
            <button
              onClick={() => resetGame('triple')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'triple'
                  ? 'bg-purple-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3더미 Nim-sum
            </button>
          </div>

          <button
            onClick={() => onOpenLeaderboard('nim')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>랭킹</span>
          </button>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Game Board */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            {/* Status Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    currentPlayer === 1
                      ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                      : 'bg-purple-400 ring-4 ring-purple-400/20'
                  }`}
                />
                <span className="text-sm font-black text-white">
                  {currentPlayer === 1 ? p1Name : p2Name}의 차례
                </span>
                {aiThinking && (
                  <span className="text-xs text-amber-400 animate-pulse font-bold">
                    (AI 수학 계산 중...)
                  </span>
                )}
              </div>

              {/* Difficulty switch for PvE */}
              {isPvE && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <span>AI 난이도:</span>
                  {(['easy', 'normal', 'genius'] as AiDifficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDifficulty(d);
                        soundEffects.click();
                      }}
                      className={`px-2 py-0.5 rounded ${
                        difficulty === d
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 font-bold'
                          : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {d === 'easy' ? '초급' : d === 'normal' ? '보통' : '천재'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mode 1: Single Pile (21 crystals) */}
            {mode === 'single' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-xs text-slate-400 font-medium mb-1">
                    남은 크리스탈
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-purple-400 tracking-tight">
                    {singleCount} <span className="text-lg text-slate-400">개</span>
                  </div>
                  <div className="text-[11px] text-rose-400 font-bold mt-1">
                    ⚠️ 주의: 마지막 1개를 가져가는 사람이 패배합니다!
                  </div>
                </div>

                {/* Crystals Visual Field */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap justify-center gap-2 sm:gap-3 min-h-[140px] items-center">
                  {Array.from({ length: singleCount }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-300 flex items-center justify-center text-lg sm:text-xl shadow-md shadow-purple-500/20 transform hover:scale-110 transition-transform animate-in fade-in zoom-in"
                    >
                      💎
                    </div>
                  ))}
                </div>

                {/* Action Buttons (Take 1, 2, or 3) */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 text-center">
                    가져갈 크리스탈 개수를 선택하세요
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                    {[1, 2, 3].map((count) => {
                      const disabled = count > singleCount || isGameOver || aiThinking;
                      return (
                        <button
                          key={count}
                          onClick={() => handleSingleTake(count)}
                          disabled={disabled}
                          className="py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-black text-base shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex flex-col items-center justify-center"
                        >
                          <span>{count}개</span>
                          <span className="text-[10px] text-purple-200 font-normal">가져가기</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Triple Piles (3, 5, 7) */}
            {mode === 'triple' && (
              <div className="space-y-6">
                <div className="text-center text-xs text-slate-400 mb-2">
                  가져올 더미를 클릭한 뒤, 가져갈 개수를 정하고 확인을 누르세요!
                </div>

                {/* 3 Piles */}
                <div className="grid grid-cols-3 gap-3">
                  {piles.map((count, pIdx) => {
                    const isSelected = selectedPileIdx === pIdx;
                    return (
                      <button
                        key={pIdx}
                        onClick={() => {
                          if (count > 0 && !isGameOver && !aiThinking) {
                            soundEffects.click();
                            setSelectedPileIdx(pIdx);
                            setTakeCount(1);
                          }
                        }}
                        disabled={count === 0 || isGameOver || aiThinking}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[180px] ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/40'
                            : count === 0
                            ? 'bg-slate-950/40 border-slate-800 opacity-40 cursor-not-allowed'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-300">더미 #{pIdx + 1}</div>
                        <div className="flex flex-wrap justify-center gap-1 my-2 max-w-[90px]">
                          {Array.from({ length: count }).map((_, i) => (
                            <span key={i} className="text-base">
                              💎
                            </span>
                          ))}
                        </div>
                        <div className="text-xl font-black text-purple-300">{count}개 남음</div>
                      </button>
                    );
                  })}
                </div>

                {/* Take amount selection for selected pile */}
                {selectedPileIdx !== null && (
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-500/40 max-w-sm mx-auto space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200">
                        {selectedPileIdx + 1}번 더미에서 가져갈 개수
                      </span>
                      <span className="text-purple-400 font-black text-base">{takeCount}개</span>
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={piles[selectedPileIdx]}
                      value={takeCount}
                      onChange={(e) => setTakeCount(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />

                    <button
                      onClick={handleTripleTake}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-sm shadow-md active:scale-95 transition-all"
                    >
                      돌 {takeCount}개 가져가기 결정
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Math Strategy & Action Logs */}
        <div className="lg:col-span-4 space-y-3">
          {/* Action Log Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md h-[260px] flex flex-col">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
              실시간 대결 기록
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs text-slate-300">
              {actionLog.map((log, i) => (
                <div key={i} className="p-1.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Math Teacher Hint Toggle */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Brain className="w-4 h-4 text-amber-400" />
                <span>중1 수학 족집게 힌트</span>
              </div>
              <button
                onClick={() => {
                  soundEffects.click();
                  setShowHint(!showHint);
                }}
                className="text-[11px] text-purple-400 hover:text-purple-300 underline font-semibold"
              >
                {showHint ? '힌트 닫기' : '힌트 보기'}
              </button>
            </div>

            {showHint ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed animate-in fade-in">
                {getMathHint()}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                님 게임은 수학적 배수(modulo)와 2진법 XOR 연산으로 100% 이길 수 있는 필승법이 존재합니다!
              </p>
            )}

            <button
              onClick={() => {
                soundEffects.click();
                resetGame();
              }}
              className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>새 게임 시작</span>
            </button>
          </div>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={winModalOpen}
        game="nim"
        title="수학 님 게임 승리!"
        subTitle="상대를 수학적 함정에 완벽하게 몰아넣어 승리했습니다!"
        scoreText={lastScoreText}
        onPlayAgain={() => resetGame()}
        onViewLeaderboard={() => {
          setWinModalOpen(false);
          onOpenLeaderboard('nim');
        }}
        onBackToMenu={() => {
          setWinModalOpen(false);
          onBackToHub();
        }}
      />
    </div>
  );
}
