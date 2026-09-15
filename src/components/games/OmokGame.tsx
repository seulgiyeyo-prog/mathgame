import { useState, useRef, useEffect, useCallback, type MouseEvent } from 'react';
import { RotateCcw, Undo2, Trophy, Bot, Users, Sparkles, HelpCircle } from 'lucide-react';
import { UserProfile, GameType } from '../../types';
import { soundEffects } from '../../utils/audio';
import { saveLeaderboardEntry } from '../../utils/storage';
import WinModal from '../WinModal';
import PlayerNameBanner from '../PlayerNameBanner';

interface OmokGameProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onOpenLeaderboard: (game: GameType) => void;
  onBackToHub: () => void;
}

const BOARD_SIZE = 15;

export default function OmokGame({ userProfile, onUpdateProfile, onOpenLeaderboard, onBackToHub }: OmokGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [board, setBoard] = useState<number[][]>(() =>
    Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0))
  );
  const [history, setHistory] = useState<{ x: number; y: number; player: number }[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1); // 1: Black, 2: White
  const [isPvE, setIsPvE] = useState<boolean>(true);
  const [p1Name, setP1Name] = useState<string>(userProfile.name || '흑돌');
  const [p2Name, setP2Name] = useState<string>('AI 컴퓨터');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winModalOpen, setWinModalOpen] = useState(false);
  const [lastScoreText, setLastScoreText] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [consecutiveWins, setConsecutiveWins] = useState<number>(0);

  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0)));
    setHistory([]);
    setCurrentPlayer(1);
    setGameOver(false);
    setWinner(null);
    setWinModalOpen(false);
    setAiThinking(false);
  }, []);

  // Update p1Name if user profile changes
  useEffect(() => {
    if (userProfile.name) {
      setP1Name(userProfile.name);
    }
  }, [userProfile.name]);

  // Check 5 in a row
  const checkWin = useCallback((grid: number[][], x: number, y: number, player: number): boolean => {
    const directions = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (const [dx, dy] of directions) {
      let count = 1;
      let cx = x + dx;
      let cy = y + dy;
      while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && grid[cx][cy] === player) {
        count++;
        cx += dx;
        cy += dy;
      }
      cx = x - dx;
      cy = y - dy;
      while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && grid[cx][cy] === player) {
        count++;
        cx -= dx;
        cy -= dy;
      }
      if (count >= 5) return true;
    }
    return false;
  }, []);

  // AI Evaluation logic
  const evaluateCell = useCallback((grid: number[][], x: number, y: number, player: number): number => {
    let score = 0;
    const dirs = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];

    for (const [dx, dy] of dirs) {
      let count = 1;
      let openEnds = 0;

      let cx = x + dx;
      let cy = y + dy;
      while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && grid[cx][cy] === player) {
        count++;
        cx += dx;
        cy += dy;
      }
      if (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && grid[cx][cy] === 0) openEnds++;

      cx = x - dx;
      cy = y - dy;
      while (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && grid[cx][cy] === player) {
        count++;
        cx -= dx;
        cy -= dy;
      }
      if (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE && grid[cx][cy] === 0) openEnds++;

      if (count >= 5) score += 100000;
      else if (count === 4) score += openEnds === 2 ? 12000 : openEnds === 1 ? 2500 : 0;
      else if (count === 3) score += openEnds === 2 ? 1500 : openEnds === 1 ? 200 : 0;
      else if (count === 2) score += openEnds === 2 ? 150 : openEnds === 1 ? 20 : 0;
    }
    return score;
  }, []);

  // AI Turn
  const executeAIMove = useCallback(
    (currentBoard: number[][], currentHist: { x: number; y: number; player: number }[]) => {
      let bestScore = -1;
      let bestMoves: { x: number; y: number }[] = [];

      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          if (currentBoard[i][j] === 0) {
            const aiScore = evaluateCell(currentBoard, i, j, 2);
            const humanScore = evaluateCell(currentBoard, i, j, 1);
            let totalScore = aiScore + humanScore * 1.25;

            if (aiScore >= 100000) totalScore += 500000;
            else if (humanScore >= 100000) totalScore += 400000;

            if (totalScore > bestScore) {
              bestScore = totalScore;
              bestMoves = [{ x: i, y: j }];
            } else if (totalScore === bestScore) {
              bestMoves.push({ x: i, y: j });
            }
          }
        }
      }

      let chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
      if (bestScore === 0 || !chosen) chosen = { x: 7, y: 7 };

      const newBoard = currentBoard.map((row) => [...row]);
      newBoard[chosen.x][chosen.y] = 2;
      const nextHist = [...currentHist, { x: chosen.x, y: chosen.y, player: 2 }];

      setBoard(newBoard);
      setHistory(nextHist);
      soundEffects.placeStone();
      setAiThinking(false);

      if (checkWin(newBoard, chosen.x, chosen.y, 2)) {
        setGameOver(true);
        setWinner(p2Name);
        soundEffects.lose();
      } else {
        setCurrentPlayer(1);
      }
    },
    [evaluateCell, checkWin, p2Name]
  );

  // Handle Player Click
  const handleBoardClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || aiThinking) return;
    if (isPvE && currentPlayer === 2) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    const margin = 20;
    const cellSize = (canvas.width - margin * 2) / (BOARD_SIZE - 1);

    const x = Math.round((clientX - margin) / cellSize);
    const y = Math.round((clientY - margin) / cellSize);

    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
    if (board[x][y] !== 0) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[x][y] = currentPlayer;
    const nextHist = [...history, { x, y, player: currentPlayer }];

    setBoard(newBoard);
    setHistory(nextHist);
    soundEffects.placeStone();

    if (checkWin(newBoard, x, y, currentPlayer)) {
      setGameOver(true);
      const winnerPlayer = currentPlayer === 1 ? p1Name : p2Name;
      setWinner(winnerPlayer);

      if (currentPlayer === 1) {
        const streak = consecutiveWins + 1;
        setConsecutiveWins(streak);
        const calculatedScore = Math.max(200, 1000 - nextHist.length * 15 + streak * 50);
        const sub = `${nextHist.length}수 만에 승리 (${streak}연승)`;
        setLastScoreText(sub);

        saveLeaderboardEntry({
          game: 'omok',
          playerName: userProfile.name,
          gradeClass: userProfile.gradeClass,
          score: calculatedScore,
          subText: sub,
          avatar: userProfile.avatar,
        });

        setWinModalOpen(true);
      }
      return;
    }

    if (isPvE) {
      setCurrentPlayer(2);
      setAiThinking(true);
      setTimeout(() => {
        executeAIMove(newBoard, nextHist);
      }, 450);
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  // Undo Move
  const handleUndo = () => {
    if (history.length === 0 || gameOver || aiThinking) return;
    soundEffects.click();
    if (isPvE) {
      // Undo both player and AI move
      if (history.length < 2) {
        resetGame();
        return;
      }
      const newHist = history.slice(0, -2);
      const newBoard = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
      newHist.forEach((m) => {
        newBoard[m.x][m.y] = m.player;
      });
      setBoard(newBoard);
      setHistory(newHist);
      setCurrentPlayer(1);
    } else {
      const last = history[history.length - 1];
      const newHist = history.slice(0, -1);
      const newBoard = board.map((row) => [...row]);
      newBoard[last.x][last.y] = 0;
      setBoard(newBoard);
      setHistory(newHist);
      setCurrentPlayer(last.player as 1 | 2);
    }
  };

  // Draw Board Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const margin = 20;
    const cellSize = (width - margin * 2) / (BOARD_SIZE - 1);

    // Board wood background
    ctx.fillStyle = '#dfb15b';
    ctx.fillRect(0, 0, width, height);

    // Subtle wood texture stripes
    ctx.fillStyle = 'rgba(180, 130, 40, 0.08)';
    for (let i = 0; i < height; i += 8) {
      ctx.fillRect(0, i, width, 4);
    }

    // Outer board border
    ctx.strokeStyle = '#5a3d1c';
    ctx.lineWidth = 3;
    ctx.strokeRect(margin - 4, margin - 4, width - (margin - 4) * 2, height - (margin - 4) * 2);

    // Grid lines
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#5a3d1c';

    for (let i = 0; i < BOARD_SIZE; i++) {
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(margin, margin + i * cellSize);
      ctx.lineTo(width - margin, margin + i * cellSize);
      ctx.stroke();

      // Vertical
      ctx.beginPath();
      ctx.moveTo(margin + i * cellSize, margin);
      ctx.lineTo(margin + i * cellSize, height - margin);
      ctx.stroke();
    }

    // Star points (화점)
    const starPoints = [3, 7, 11];
    ctx.fillStyle = '#5a3d1c';
    for (const x of starPoints) {
      for (const y of starPoints) {
        ctx.beginPath();
        ctx.arc(margin + x * cellSize, margin + y * cellSize, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Last move indicator
    const lastMove = history.length > 0 ? history[history.length - 1] : null;

    // Draw Stones
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        const val = board[x][y];
        if (val !== 0) {
          const cx = margin + x * cellSize;
          const cy = margin + y * cellSize;
          const radius = cellSize * 0.44;

          // Shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.45)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 2.5;
          ctx.shadowOffsetY = 3.5;

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);

          const grad = ctx.createRadialGradient(cx - radius * 0.35, cy - radius * 0.35, radius * 0.1, cx, cy, radius);
          if (val === 1) {
            // Black stone
            grad.addColorStop(0, '#555555');
            grad.addColorStop(0.5, '#222222');
            grad.addColorStop(1, '#050505');
          } else {
            // White stone
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.7, '#e8e8e8');
            grad.addColorStop(1, '#c2c2c2');
          }
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();

          // Highlight last move with ring
          if (lastMove && lastMove.x === x && lastMove.y === y) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
            ctx.strokeStyle = val === 1 ? '#ffcc00' : '#d90429';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }
        }
      }
    }
  }, [board, history]);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Player Name Banner */}
      <PlayerNameBanner
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        gameTitle="오목"
      />

      {/* Game Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
            ⚔️
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              진검승부 오목
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                15x15 정통 반상
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {isPvE ? '인공지능 컴퓨터와의 지략 대결' : '친구와 함께 두는 2인 대결'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                soundEffects.click();
                setIsPvE(true);
                setP2Name('AI 컴퓨터');
                resetGame();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isPvE ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI 대전</span>
            </button>
            <button
              onClick={() => {
                soundEffects.click();
                setIsPvE(false);
                setP2Name('백돌(친구)');
                resetGame();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isPvE ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2인 대결</span>
            </button>
          </div>

          <button
            onClick={() => onOpenLeaderboard('omok')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>랭킹</span>
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left/Top Status Card */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">현재 턴 정보</div>

            {/* Turn Box */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div
                className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center ${
                  currentPlayer === 1
                    ? 'bg-gradient-to-tr from-slate-950 to-slate-700 border border-slate-600'
                    : 'bg-gradient-to-tr from-slate-300 to-white border border-slate-400'
                }`}
              >
                <span className="text-[10px] font-bold text-amber-400">
                  {currentPlayer === 1 ? '흑' : '백'}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentPlayer === 1 ? p1Name : p2Name}
                </div>
                <div className="text-[11px] text-amber-400 font-medium">
                  {gameOver
                    ? '게임 종료'
                    : aiThinking
                    ? 'AI가 수읽기 중...'
                    : '착수할 차례입니다'}
                </div>
              </div>
            </div>

            {/* Match Info */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400">총 착수</div>
                <div className="text-base font-black text-white">{history.length}수</div>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400">내 AI 연승</div>
                <div className="text-base font-black text-amber-400">{consecutiveWins}연승</div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleUndo}
                disabled={history.length === 0 || gameOver || aiThinking}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>무르기 ({isPvE ? '2수' : '1수'})</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.click();
                  resetGame();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>판 새로고침</span>
              </button>
            </div>
          </div>

          {/* Quick Rules */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1 text-slate-300 font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>오목 승리 룰</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              가로, 세로, 대각선 중 먼저 연속 5개의 돌을 놓는 플레이어가 승리합니다! 적은 수로 AI를 격파하면 더 높은 랭킹 점수를 획득합니다.
            </p>
          </div>
        </div>

        {/* Center/Right Board Canvas */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          {winner && (
            <div className="mb-3 px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black text-sm flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4" />
              <span>{winner} 승리! 축하합니다!</span>
            </div>
          )}

          <div className="relative max-w-full">
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              onClick={handleBoardClick}
              className="w-full max-w-[480px] aspect-square rounded-xl cursor-pointer shadow-2xl transition-transform active:scale-[0.998]"
            />

            {aiThinking && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900/90 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg border border-amber-400/40 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  AI 수읽기 중...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Win Celebration Modal */}
      <WinModal
        isOpen={winModalOpen}
        game="omok"
        title="오목 대결 승리!"
        subTitle="인공지능 컴퓨터를 상대로 완벽한 5목을 완성했습니다!"
        scoreText={lastScoreText}
        onPlayAgain={resetGame}
        onViewLeaderboard={() => {
          setWinModalOpen(false);
          onOpenLeaderboard('omok');
        }}
        onBackToMenu={() => {
          setWinModalOpen(false);
          onBackToHub();
        }}
      />
    </div>
  );
}
