import { useState, useCallback, useMemo } from 'react';
import { RotateCcw, Trophy, HelpCircle, Bot, Users, Sparkles, BookOpen, Palette } from 'lucide-react';
import { UserProfile, GameType } from '../../types';
import { soundEffects } from '../../utils/audio';
import { saveLeaderboardEntry } from '../../utils/storage';
import WinModal from '../WinModal';
import ChessGuideModal from '../ChessGuideModal';
import PlayerNameBanner from '../PlayerNameBanner';
import RealisticChessPiece from '../RealisticChessPiece';

interface ChessGameProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onOpenLeaderboard: (game: GameType) => void;
  onBackToHub: () => void;
}

type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

type BoardState = (ChessPiece | null)[][];

type ChessBoardTheme = 'wood' | 'emerald' | 'blue' | 'obsidian';

interface ThemeConfig {
  id: ChessBoardTheme;
  name: string;
  light: string;
  dark: string;
  border: string;
  woodBg: string;
  previewClass: string;
}

const BOARD_THEMES: Record<ChessBoardTheme, ThemeConfig> = {
  wood: {
    id: 'wood',
    name: '정통 원목 체스판',
    light: '#f0d9b5',
    dark: '#b58863',
    border: 'border-[#784824]',
    woodBg: 'from-[#5a3416]/40 via-slate-900 to-slate-950',
    previewClass: 'bg-amber-600',
  },
  emerald: {
    id: 'emerald',
    name: '토너먼트 그린',
    light: '#ffffdd',
    dark: '#568b4f',
    border: 'border-[#2d5727]',
    woodBg: 'from-emerald-950/40 via-slate-900 to-slate-950',
    previewClass: 'bg-emerald-600',
  },
  blue: {
    id: 'blue',
    name: '로열 딥블루',
    light: '#dee3e6',
    dark: '#4b7399',
    border: 'border-[#233d59]',
    woodBg: 'from-blue-950/40 via-slate-900 to-slate-950',
    previewClass: 'bg-blue-600',
  },
  obsidian: {
    id: 'obsidian',
    name: '모던 흑요석',
    light: '#e2e8f0',
    dark: '#475569',
    border: 'border-slate-700',
    woodBg: 'from-slate-900 via-slate-900 to-slate-950',
    previewClass: 'bg-slate-600',
  },
};

const INITIAL_BOARD: BoardState = [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' },
  ],
  Array(8).fill(null).map(() => ({ type: 'p', color: 'b' })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'p', color: 'w' })),
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' },
  ],
];

const PIECE_SYMBOLS: Record<PieceType, { w: string; b: string }> = {
  k: { w: '♔', b: '♚' },
  q: { w: '♕', b: '♛' },
  r: { w: '♖', b: '♜' },
  b: { w: '♗', b: '♝' },
  n: { w: '♘', b: '♞' },
  p: { w: '♙', b: '♟' },
};

const PIECE_NAMES: Record<PieceType, string> = {
  k: '킹',
  q: '퀸',
  r: '룩',
  b: '비숍',
  n: '나이트',
  p: '폰',
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

export default function ChessGame({ userProfile, onUpdateProfile, onOpenLeaderboard, onBackToHub }: ChessGameProps) {
  const [board, setBoard] = useState<BoardState>(() => INITIAL_BOARD.map((row) => [...row]));
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [isPvE, setIsPvE] = useState<boolean>(true);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winModalOpen, setWinModalOpen] = useState<boolean>(false);
  const [lastScoreText, setLastScoreText] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<ChessBoardTheme>('wood');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD.map((row) => [...row]));
    setTurn('w');
    setSelectedPos(null);
    setAiThinking(false);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setMoveCount(0);
    setIsGameOver(false);
    setWinModalOpen(false);
  }, []);

  // Compute Raw Moves for piece at (r, c)
  const getRawMoves = useCallback((b: BoardState, r: number, c: number): [number, number][] => {
    const piece = b[r][c];
    if (!piece) return [];
    const moves: [number, number][] = [];
    const color = piece.color;
    const oppColor = color === 'w' ? 'b' : 'w';

    const addMove = (nr: number, nc: number) => {
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) return false;
      const target = b[nr][nc];
      if (!target) {
        moves.push([nr, nc]);
        return true;
      } else if (target.color === oppColor) {
        moves.push([nr, nc]);
        return false;
      }
      return false; // Friendly piece blocks
    };

    if (piece.type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;

      // 1 step forward
      if (r + dir >= 0 && r + dir < 8 && !b[r + dir][c]) {
        moves.push([r + dir, c]);
        // 2 steps from start
        if (r === startRow && !b[r + dir * 2][c]) {
          moves.push([r + dir * 2, c]);
        }
      }
      // Diagonal capture
      for (const dc of [-1, 1]) {
        const nr = r + dir;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = b[nr][nc];
          if (target && target.color === oppColor) {
            moves.push([nr, nc]);
          }
        }
      }
    } else if (piece.type === 'n') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      knightOffsets.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
      const dirs: [number, number][] = [];
      if (piece.type === 'r' || piece.type === 'q') {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      if (piece.type === 'b' || piece.type === 'q') {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (step < 8) {
          const cont = addMove(r + dr * step, c + dc * step);
          if (!cont) break;
          step++;
        }
      });
    } else if (piece.type === 'k') {
      const kingDirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ];
      kingDirs.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    }

    return moves;
  }, []);

  // Compute Legal Moves
  const legalMoves = useMemo(() => {
    if (!selectedPos) return [];
    const [r, c] = selectedPos;
    return getRawMoves(board, r, c);
  }, [selectedPos, board, getRawMoves]);

  // AI Move Decision (Alpha-heuristic)
  const makeAIMove = useCallback(
    (curBoard: BoardState, whiteCaps: ChessPiece[], blackCaps: ChessPiece[]) => {
      // Gather all black pieces moves
      interface CandidateMove {
        from: [number, number];
        to: [number, number];
        score: number;
        captured: ChessPiece | null;
      }

      const allMoves: CandidateMove[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = curBoard[r][c];
          if (p && p.color === 'b') {
            const raw = getRawMoves(curBoard, r, c);
            raw.forEach(([tr, tc]) => {
              const target = curBoard[tr][tc];
              let moveScore = 0;

              // Capture evaluation
              if (target) {
                moveScore += PIECE_VALUES[target.type] * 1.5 - PIECE_VALUES[p.type] * 0.1;
                if (target.type === 'k') moveScore += 99999;
              }

              // Positional bias: advance forward, control center
              const centerDist = Math.abs(tr - 3.5) + Math.abs(tc - 3.5);
              moveScore += (7 - centerDist) * 3;

              // Pawn promotion bonus
              if (p.type === 'p' && tr === 7) moveScore += 850;

              // Slight randomness to avoid repetitive games
              moveScore += Math.random() * 8;

              allMoves.push({
                from: [r, c],
                to: [tr, tc],
                score: moveScore,
                captured: target,
              });
            });
          }
        }
      }

      if (allMoves.length === 0) {
        // Stalemate or Checkmate
        setIsGameOver(true);
        soundEffects.win();
        setLastScoreText('AI가 둘 수 있는 수가 없습니다!');
        setWinModalOpen(true);
        setAiThinking(false);
        return;
      }

      // Sort by score descending
      allMoves.sort((a, b) => b.score - a.score);
      const chosen = allMoves[0];

      // Execute chosen move
      const nextBoard = curBoard.map((row) => [...row]);
      const movingPiece = nextBoard[chosen.from[0]][chosen.from[1]]!;
      nextBoard[chosen.from[0]][chosen.from[1]] = null;

      // Check promotion
      if (movingPiece.type === 'p' && chosen.to[0] === 7) {
        nextBoard[chosen.to[0]][chosen.to[1]] = { type: 'q', color: 'b' };
      } else {
        nextBoard[chosen.to[0]][chosen.to[1]] = movingPiece;
      }

      const nextBlackCaps = [...blackCaps];
      if (chosen.captured) {
        nextBlackCaps.push(chosen.captured);
        setCapturedByBlack(nextBlackCaps);
      }

      setBoard(nextBoard);
      soundEffects.placeStone();
      setAiThinking(false);

      // Check if King was captured
      if (chosen.captured && chosen.captured.type === 'k') {
        setIsGameOver(true);
        soundEffects.lose();
        setLastScoreText('백군 킹이 체크메이트 당했습니다. 다시 도전해보세요!');
        return;
      }

      setTurn('w');
    },
    [getRawMoves]
  );

  // Handle Square Click
  const handleSquareClick = (r: number, c: number) => {
    if (isGameOver || aiThinking) return;
    if (isPvE && turn === 'b') return;

    const piece = board[r][c];

    // If no piece selected yet
    if (!selectedPos) {
      if (piece && piece.color === turn) {
        setSelectedPos([r, c]);
        soundEffects.click();
      }
      return;
    }

    const [sr, sc] = selectedPos;

    // Clicked same square => deselect
    if (sr === r && sc === c) {
      setSelectedPos(null);
      return;
    }

    // Clicked another own piece => switch selection
    if (piece && piece.color === turn) {
      setSelectedPos([r, c]);
      soundEffects.click();
      return;
    }

    // Attempt to move to (r, c)
    const isLegal = legalMoves.some(([mr, mc]) => mr === r && mc === c);

    if (isLegal) {
      const movingPiece = board[sr][sc]!;
      const targetPiece = board[r][c];

      const nextBoard = board.map((row) => [...row]);
      nextBoard[sr][sc] = null;

      // Promotion logic (Pawn reaching opposite back rank)
      if (movingPiece.type === 'p' && ((movingPiece.color === 'w' && r === 0) || (movingPiece.color === 'b' && r === 7))) {
        nextBoard[r][c] = { type: 'q', color: movingPiece.color };
        soundEffects.powerup();
      } else {
        nextBoard[r][c] = movingPiece;
      }

      const nextWhiteCaps = [...capturedByWhite];
      const nextBlackCaps = [...capturedByBlack];

      if (targetPiece) {
        soundEffects.stomp();
        if (movingPiece.color === 'w') {
          nextWhiteCaps.push(targetPiece);
          setCapturedByWhite(nextWhiteCaps);
        } else {
          nextBlackCaps.push(targetPiece);
          setCapturedByBlack(nextBlackCaps);
        }
      } else {
        soundEffects.placeStone();
      }

      setBoard(nextBoard);
      setSelectedPos(null);
      setMoveCount((prev) => prev + 1);

      // Check King Capture (Checkmate Victory)
      if (targetPiece && targetPiece.type === 'k') {
        setIsGameOver(true);
        soundEffects.win();
        const score = Math.max(300, 1500 - moveCount * 25);
        const sub = `${moveCount + 1}수 만에 상대 킹을 체크메이트 승리!`;
        setLastScoreText(sub);

        saveLeaderboardEntry({
          game: 'chess',
          playerName: userProfile.name,
          gradeClass: userProfile.gradeClass,
          score,
          subText: sub,
          avatar: userProfile.avatar,
        });

        setWinModalOpen(true);
        return;
      }

      const nextTurn: PieceColor = turn === 'w' ? 'b' : 'w';
      setTurn(nextTurn);

      if (isPvE && nextTurn === 'b') {
        setAiThinking(true);
        setTimeout(() => {
          makeAIMove(nextBoard, nextWhiteCaps, capturedByBlack);
        }, 450);
      }
    } else {
      setSelectedPos(null);
    }
  };

  const currentThemeConfig = BOARD_THEMES[currentTheme];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Player Name Banner for Quick Identification */}
      <PlayerNameBanner
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        gameTitle="클래식 체스"
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl">
            ♟️
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              클래식 체스 아레나
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                입체 3D 말 & 테마 체스판
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              선택한 테마의 체스판과 정교한 입체 기물로 왕을 잡는 전략 승부를 펼쳐보세요.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Theme Selector Dropdown / Buttons */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <Palette className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-0.5" />
            {(Object.keys(BOARD_THEMES) as ChessBoardTheme[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => {
                  setCurrentTheme(themeKey);
                  soundEffects.click();
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentTheme === themeKey
                    ? 'bg-slate-700 text-amber-300 shadow ring-1 ring-amber-400/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={BOARD_THEMES[themeKey].name}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${BOARD_THEMES[themeKey].previewClass}`} />
                <span className="hidden sm:inline">{BOARD_THEMES[themeKey].name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Guide Book Button */}
          <button
            onClick={() => {
              setIsGuideOpen(true);
              soundEffects.click();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all"
            title="게임 방법 및 말 설명서 열기"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>기물 설명서</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => onOpenLeaderboard('chess')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>체스 랭킹</span>
          </button>
        </div>
      </div>

      {/* Main Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Game Status & Captured Pieces */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                경기 현황
              </span>
              <span className="text-xs text-amber-400 font-bold">
                {moveCount} 수 진행
              </span>
            </div>

            {/* Mode Switch */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => {
                  soundEffects.click();
                  setIsPvE(true);
                  resetGame();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                  isPvE ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI 체스봇</span>
              </button>
              <button
                onClick={() => {
                  soundEffects.click();
                  setIsPvE(false);
                  resetGame();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                  !isPvE ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2인 친구 대결</span>
              </button>
            </div>

            {/* Current Turn */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                {turn === 'w' ? '♔' : '♚'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {turn === 'w'
                    ? `${userProfile.name}(백군 ⚪)`
                    : isPvE
                    ? 'AI 체스봇(흑군 ⚫)'
                    : '2P 친구(흑군 ⚫)'}
                </div>
                <div className="text-[11px] text-blue-400 font-medium truncate">
                  {aiThinking ? 'AI 수읽기 계산 중...' : '공격할 말을 선택하세요'}
                </div>
              </div>
            </div>

            {/* Captured Pieces Graveyard */}
            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center justify-between">
                  <span>백군({userProfile.name})이 잡은 흑군 기물</span>
                  <span className="text-amber-400 font-black">{capturedByWhite.length}개</span>
                </div>
                <div className="flex flex-wrap gap-1 text-base min-h-[24px]">
                  {capturedByWhite.length === 0 ? (
                    <span className="text-[11px] text-slate-500">아직 잡은 기물 없음</span>
                  ) : (
                    capturedByWhite.map((p, i) => (
                      <span key={i} title={PIECE_NAMES[p.type]}>
                        {PIECE_SYMBOLS[p.type].b}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center justify-between">
                  <span>흑군이 잡은 백군 기물</span>
                  <span className="text-amber-400 font-black">{capturedByBlack.length}개</span>
                </div>
                <div className="flex flex-wrap gap-1 text-base min-h-[24px]">
                  {capturedByBlack.length === 0 ? (
                    <span className="text-[11px] text-slate-500">아직 잡은 기물 없음</span>
                  ) : (
                    capturedByBlack.map((p, i) => (
                      <span key={i} title={PIECE_NAMES[p.type]}>
                        {PIECE_SYMBOLS[p.type].w}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                soundEffects.click();
                resetGame();
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>체스판 초기화</span>
            </button>
          </div>

          {/* Quick Guide Card with Button */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>체스 기물 이동 비법</span>
              </div>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-bold"
              >
                전체 가이드 &gt;
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              • <strong>폰(P)</strong>: 첫 수 2칸, 대각선 전방 공격. 끝줄 도달 시 <strong>퀸(Q) 자동 승급!</strong><br />
              • <strong>나이트(N)</strong>: 유일하게 다른 말을 <strong>뛰어넘는 L자(2+1)</strong> 기마병<br />
              • <strong>퀸(Q)</strong>: 가로/세로/대각선 무제한 최강의 공격수
            </p>
          </div>
        </div>

        {/* Right Side: 8x8 Chessboard */}
        <div
          className={`lg:col-span-8 flex flex-col items-center justify-center bg-gradient-to-b ${currentThemeConfig.woodBg} border-2 ${currentThemeConfig.border} rounded-3xl p-4 sm:p-6 shadow-2xl transition-colors duration-300`}
        >
          {/* Visual Board Frame */}
          <div className="w-full max-w-[500px] aspect-square rounded-2xl overflow-hidden border-8 border-slate-900 shadow-2xl p-1 bg-slate-950/80">
            {/* Coordinates / Board Grid */}
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden shadow-inner">
              {board.map((row, r) =>
                row.map((piece, c) => {
                  const isLight = (r + c) % 2 === 0;
                  const isSelected = selectedPos && selectedPos[0] === r && selectedPos[1] === c;
                  const isLegalTarget = legalMoves.some(([mr, mc]) => mr === r && mc === c);

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      style={{
                        backgroundColor: isLight ? currentThemeConfig.light : currentThemeConfig.dark,
                      }}
                      className={`relative flex items-center justify-center select-none transition-all p-0.5 ${
                        isSelected ? 'ring-4 ring-amber-400 z-20 shadow-lg' : ''
                      }`}
                    >
                      {/* Board coordinate markers on edges */}
                      {c === 0 && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-black opacity-40 select-none pointer-events-none text-slate-800">
                          {8 - r}
                        </span>
                      )}
                      {r === 7 && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-black opacity-40 select-none pointer-events-none text-slate-800">
                          {String.fromCharCode(97 + c)}
                        </span>
                      )}

                      {/* Legal Move Marker Dot / Ring */}
                      {isLegalTarget && (
                        <div
                          className={`absolute z-10 pointer-events-none rounded-full ${
                            piece
                              ? 'w-full h-full border-4 border-rose-500/90 animate-pulse bg-rose-500/20'
                              : 'w-4 h-4 sm:w-5 sm:h-5 bg-amber-500/60 shadow ring-2 ring-amber-400/80'
                          }`}
                        />
                      )}

                      {/* 3D Realistic Chess Piece */}
                      {piece && (
                        <RealisticChessPiece
                          type={piece.type}
                          color={piece.color}
                          isSelected={isSelected || false}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400 text-center font-medium flex items-center gap-2">
            <span>선택된 테마: <strong>{currentThemeConfig.name}</strong></span>
            <span>·</span>
            <span>움직일 말을 누르면 갈 수 있는 칸이 표시됩니다</span>
          </div>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={winModalOpen}
        game="chess"
        title="체크메이트 승리!"
        subTitle="적의 킹을 완벽하게 포위하여 항복을 받아냈습니다!"
        scoreText={lastScoreText}
        onPlayAgain={() => resetGame()}
        onViewLeaderboard={() => {
          setWinModalOpen(false);
          onOpenLeaderboard('chess');
        }}
        onBackToMenu={() => {
          setWinModalOpen(false);
          onBackToHub();
        }}
      />

      {/* Chess Guide Modal */}
      <ChessGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
