import { useState, useCallback, useMemo, useEffect } from 'react';
import { RotateCcw, Trophy, Bot, Users, Sparkles, BookOpen, Palette, ShieldAlert, Swords, Brain, Zap, AlertTriangle } from 'lucide-react';
import { UserProfile, GameType } from '../../types';
import { soundEffects } from '../../utils/audio';
import { saveLeaderboardEntry } from '../../utils/storage';
import WinModal from '../WinModal';
import ChessGuideModal from '../ChessGuideModal';
import PlayerNameBanner from '../PlayerNameBanner';
import RealisticChessPiece from '../RealisticChessPiece';
import {
  BoardState,
  ChessPiece,
  PieceColor,
  PieceType,
  AIDifficulty,
  PIECE_VALUES,
  isKingInCheck,
  findKing,
  getLegalMovesForPiece,
  getAllLegalMoves,
  applyMove,
  selectAIMove,
  evaluateBoard,
} from '../../utils/chessEngine';

interface ChessGameProps {
  userProfile: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onOpenLeaderboard: (game: GameType) => void;
  onBackToHub: () => void;
}

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

export default function ChessGame({ userProfile, onUpdateProfile, onOpenLeaderboard, onBackToHub }: ChessGameProps) {
  const [board, setBoard] = useState<BoardState>(() => INITIAL_BOARD.map((row) => [...row]));
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [lastMove, setLastMove] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  const [isPvE, setIsPvE] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winModalOpen, setWinModalOpen] = useState<boolean>(false);
  const [winModalData, setWinModalData] = useState<{ title: string; subTitle: string; scoreText: string }>({
    title: '',
    subTitle: '',
    scoreText: '',
  });
  const [currentTheme, setCurrentTheme] = useState<ChessBoardTheme>('wood');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [checkStatusMessage, setCheckStatusMessage] = useState<string | null>(null);

  // Check state calculation
  const whiteInCheck = useMemo(() => isKingInCheck(board, 'w'), [board]);
  const blackInCheck = useMemo(() => isKingInCheck(board, 'b'), [board]);

  const whiteKingPos = useMemo(() => findKing(board, 'w'), [board]);
  const blackKingPos = useMemo(() => findKing(board, 'b'), [board]);

  // Material evaluation bar calculation
  const materialAdvantage = useMemo(() => {
    let whiteSum = 0;
    let blackSum = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || p.type === 'k') continue;
        if (p.color === 'w') whiteSum += PIECE_VALUES[p.type];
        else blackSum += PIECE_VALUES[p.type];
      }
    }
    return whiteSum - blackSum;
  }, [board]);

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD.map((row) => [...row]));
    setTurn('w');
    setSelectedPos(null);
    setLastMove(null);
    setAiThinking(false);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setMoveCount(0);
    setIsGameOver(false);
    setWinModalOpen(false);
    setCheckStatusMessage(null);
  }, []);

  // Compute Legal Moves for currently selected square
  const legalMoves = useMemo(() => {
    if (!selectedPos) return [];
    const [r, c] = selectedPos;
    const p = board[r][c];
    if (!p || p.color !== turn) return [];
    return getLegalMovesForPiece(board, r, c);
  }, [selectedPos, board, turn]);

  // AI execution routine
  const triggerAIMove = useCallback(
    (curBoard: BoardState, whiteCaps: ChessPiece[], blackCaps: ChessPiece[]) => {
      setAiThinking(true);

      // Add human-like reaction delay
      const thinkTime = difficulty === 'hard' ? 650 : difficulty === 'medium' ? 450 : 350;

      setTimeout(() => {
        const aiMove = selectAIMove(curBoard, difficulty);

        if (!aiMove) {
          // No legal moves for Black
          setAiThinking(false);
          setIsGameOver(true);

          if (isKingInCheck(curBoard, 'b')) {
            // White wins by Checkmate
            soundEffects.win();
            const score = Math.max(500, 1600 - moveCount * 20);
            const sub = `${moveCount}수 만에 AI 흑군을 정밀 체크메이트 승리!`;
            saveLeaderboardEntry({
              game: 'chess',
              playerName: userProfile.name,
              gradeClass: userProfile.gradeClass,
              score,
              subText: sub,
              avatar: userProfile.avatar,
            });
            setWinModalData({
              title: '체크메이트 승리! 🏆',
              subTitle: 'AI의 킹을 완벽하게 포위하여 체크메이트를 달성했습니다!',
              scoreText: sub,
            });
            setWinModalOpen(true);
          } else {
            // Stalemate (Draw)
            soundEffects.out();
            setWinModalData({
              title: '스테일메이트 (무승부)',
              subTitle: 'AI가 둘 수 있는 합법적인 수가 없어 무승부로 종료되었습니다.',
              scoreText: '치열한 두뇌 승부 (무승부)',
            });
            setWinModalOpen(true);
          }
          return;
        }

        // Apply AI Move
        const targetPiece = curBoard[aiMove.to[0]][aiMove.to[1]];
        const nextBoard = applyMove(curBoard, aiMove.from, aiMove.to);

        const nextBlackCaps = [...blackCaps];
        if (targetPiece) {
          nextBlackCaps.push(targetPiece);
          setCapturedByBlack(nextBlackCaps);
          soundEffects.chessCapture();
        } else {
          soundEffects.chessMove();
        }

        setBoard(nextBoard);
        setLastMove({ from: aiMove.from, to: aiMove.to });
        setAiThinking(false);

        // Check if White is in check after AI move
        const whiteChecked = isKingInCheck(nextBoard, 'w');
        const whiteMoves = getAllLegalMoves(nextBoard, 'w');

        if (whiteMoves.length === 0) {
          setIsGameOver(true);
          if (whiteChecked) {
            // AI wins by Checkmate
            soundEffects.lose();
            setCheckStatusMessage('백군 킹이 체크메이트 당했습니다!');
            setWinModalData({
              title: '아쉬운 패배...',
              subTitle: 'AI가 정확한 수읽기로 백군 킹을 체크메이트했습니다. 다시 복기해보세요!',
              scoreText: 'AI 체스봇 승리',
            });
            setWinModalOpen(true);
          } else {
            // Stalemate
            soundEffects.out();
            setCheckStatusMessage('스테일메이트(무승부)입니다.');
            setWinModalData({
              title: '스테일메이트 (무승부)',
              subTitle: '합법적인 수가 없어 무승부로 종료되었습니다.',
              scoreText: '치열한 두뇌 승부 (무승부)',
            });
            setWinModalOpen(true);
          }
          return;
        }

        if (whiteChecked) {
          soundEffects.check();
          setCheckStatusMessage('⚠️ 경고: 백군 킹이 체크당했습니다! 킹을 피하거나 방어하세요.');
        } else {
          setCheckStatusMessage(null);
        }

        setTurn('w');
      }, thinkTime);
    },
    [difficulty, moveCount, userProfile]
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

      const nextBoard = applyMove(board, [sr, sc], [r, c]);
      const nextWhiteCaps = [...capturedByWhite];
      const nextBlackCaps = [...capturedByBlack];

      if (targetPiece) {
        soundEffects.chessCapture();
        if (movingPiece.color === 'w') {
          nextWhiteCaps.push(targetPiece);
          setCapturedByWhite(nextWhiteCaps);
        } else {
          nextBlackCaps.push(targetPiece);
          setCapturedByBlack(nextBlackCaps);
        }
      } else {
        soundEffects.chessMove();
      }

      setBoard(nextBoard);
      setLastMove({ from: [sr, sc], to: [r, c] });
      setSelectedPos(null);
      const nextMoveCount = moveCount + 1;
      setMoveCount(nextMoveCount);

      const nextTurn: PieceColor = turn === 'w' ? 'b' : 'w';

      // Check if enemy is in check / checkmate
      const enemyInCheck = isKingInCheck(nextBoard, nextTurn);
      const enemyLegalMoves = getAllLegalMoves(nextBoard, nextTurn);

      if (enemyLegalMoves.length === 0) {
        setIsGameOver(true);
        if (enemyInCheck) {
          // Checkmate!
          soundEffects.win();
          const score = Math.max(400, 1600 - nextMoveCount * 20);
          const sub = `${nextMoveCount}수 만에 상대 킹을 완벽 체크메이트 승리!`;
          saveLeaderboardEntry({
            game: 'chess',
            playerName: userProfile.name,
            gradeClass: userProfile.gradeClass,
            score,
            subText: sub,
            avatar: userProfile.avatar,
          });
          setWinModalData({
            title: '체크메이트 승리! 👑',
            subTitle: '상대의 킹을 완전히 포위하여 승리를 쟁취했습니다!',
            scoreText: sub,
          });
          setWinModalOpen(true);
        } else {
          // Stalemate
          soundEffects.out();
          setWinModalData({
            title: '스테일메이트 (무승부)',
            subTitle: '상대방이 둘 수 있는 합법적인 수가 없어 무승부로 끝났습니다.',
            scoreText: '치열한 두뇌 명승부 (무승부)',
          });
          setWinModalOpen(true);
        }
        return;
      }

      if (enemyInCheck) {
        soundEffects.check();
        setCheckStatusMessage(
          nextTurn === 'b'
            ? '🔥 백군이 흑군 킹에게 체크(Check)를 걸었습니다!'
            : '⚠️ 흑군이 백군 킹에게 체크(Check)를 걸었습니다!'
        );
      } else {
        setCheckStatusMessage(null);
      }

      setTurn(nextTurn);

      if (isPvE && nextTurn === 'b') {
        triggerAIMove(nextBoard, nextWhiteCaps, nextBlackCaps);
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
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Brain className="w-3 h-3 text-emerald-400" />
                알파베타 정밀 엔진 탑재
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              체크 회피, 완벽한 합법수 필터링, 수준별 3단계 AI 엔진과 입체 3D 기물로 대결하세요.
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

      {/* Real-time Check Alert Banner */}
      {checkStatusMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-rose-950/90 via-rose-900/60 to-slate-900 border-2 border-rose-500/80 text-rose-200 text-xs font-bold animate-pulse shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{checkStatusMessage}</span>
        </div>
      )}

      {/* Main Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Game Status & Controls */}
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

            {/* Mode Switch (AI vs 2P) */}
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

            {/* AI Difficulty Selector (When in PvE Mode) */}
            {isPvE && (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-cyan-400" />
                    AI 난이도 설정
                  </span>
                  <span className="text-amber-300">
                    {difficulty === 'easy' ? '초급 (루키)' : difficulty === 'medium' ? '중급 (스마트 전략가)' : '마스터 (전교 1위 AI)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                  <button
                    onClick={() => {
                      soundEffects.click();
                      setDifficulty('easy');
                    }}
                    className={`py-1 rounded-lg transition-all ${
                      difficulty === 'easy'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    초급
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.click();
                      setDifficulty('medium');
                    }}
                    className={`py-1 rounded-lg transition-all ${
                      difficulty === 'medium'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    중급
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.click();
                      setDifficulty('hard');
                    }}
                    className={`py-1 rounded-lg transition-all ${
                      difficulty === 'hard'
                        ? 'bg-rose-600 text-white shadow ring-1 ring-rose-400'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    마스터 🔥
                  </button>
                </div>
              </div>
            )}

            {/* Current Turn & Check Indicator */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  (turn === 'w' && whiteInCheck) || (turn === 'b' && blackInCheck)
                    ? 'bg-rose-500/30 border border-rose-500 animate-pulse text-rose-300'
                    : 'bg-slate-800'
                }`}
              >
                {turn === 'w' ? '♔' : '♚'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span>
                    {turn === 'w'
                      ? `${userProfile.name}(백군 ⚪)`
                      : isPvE
                      ? `AI 체스봇(${difficulty.toUpperCase()} ⚫)`
                      : '2P 친구(흑군 ⚫)'}
                  </span>
                  {turn === 'w' && whiteInCheck && (
                    <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.2 rounded">
                      체크!
                    </span>
                  )}
                  {turn === 'b' && blackInCheck && (
                    <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.2 rounded">
                      체크!
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-blue-400 font-medium truncate">
                  {aiThinking
                    ? 'AI 알파베타 수읽기 계산 중...'
                    : (turn === 'w' && whiteInCheck)
                    ? '킹이 공격받고 있습니다! 킹을 피하거나 지키세요.'
                    : '공격할 말을 선택하세요'}
                </div>
              </div>
            </div>

            {/* Material Advantage Bar */}
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px]">
              <div className="flex justify-between font-bold text-slate-400 mb-1">
                <span>기물 형세 (밸런스)</span>
                <span className={materialAdvantage > 0 ? 'text-amber-400' : materialAdvantage < 0 ? 'text-rose-400' : 'text-slate-300'}>
                  {materialAdvantage > 0 ? `백군 우세 (+${(materialAdvantage / 100).toFixed(1)})` : materialAdvantage < 0 ? `흑군 우세 (+${(Math.abs(materialAdvantage) / 100).toFixed(1)})` : '동등'}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min(95, Math.max(5, 50 + materialAdvantage / 40))}%` }}
                />
                <div className="bg-slate-600 flex-1" />
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
              <span>체스판 새로고침 (새 게임)</span>
            </button>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>체크와 체크메이트 필승법</span>
              </div>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-bold"
              >
                상세 가이드 &gt;
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              • <strong>체크(Check) 대응법</strong>: 킹을 안전한 칸으로 피신하거나, 공격 기물을 아군으로 가로막거나 직접 잡아내야 합니다.<br />
              • <strong>불법수 금지</strong>: 킹이 공격받는 위험한 자리로는 이동할 수 없으며, 체크를 풀지 않는 수는 둘 수 없습니다.<br />
              • <strong>폰 승급</strong>: 적진 끝 8번째 칸에 도달하면 무적의 <strong>퀸(Q)</strong>으로 변신합니다!
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

                  // Highlight last moved squares
                  const isLastMoveSquare =
                    lastMove &&
                    ((lastMove.from[0] === r && lastMove.from[1] === c) ||
                      (lastMove.to[0] === r && lastMove.to[1] === c));

                  // Highlight King in check in glowing red
                  const isWhiteKingInCheck = whiteInCheck && whiteKingPos && whiteKingPos[0] === r && whiteKingPos[1] === c;
                  const isBlackKingInCheck = blackInCheck && blackKingPos && blackKingPos[0] === r && blackKingPos[1] === c;
                  const isCheckedKing = isWhiteKingInCheck || isBlackKingInCheck;

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      style={{
                        backgroundColor: isCheckedKing
                          ? '#ef4444'
                          : isLight
                          ? currentThemeConfig.light
                          : currentThemeConfig.dark,
                      }}
                      className={`relative flex items-center justify-center select-none transition-all p-0.5 ${
                        isSelected ? 'ring-4 ring-amber-400 z-20 shadow-lg' : ''
                      } ${isCheckedKing ? 'ring-4 ring-rose-500 animate-pulse z-10' : ''}`}
                    >
                      {/* Last move highlight subtle overlay */}
                      {isLastMoveSquare && !isCheckedKing && (
                        <div className="absolute inset-0 bg-amber-400/25 pointer-events-none" />
                      )}

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
                              ? 'w-full h-full border-4 border-rose-500/90 animate-pulse bg-rose-500/25'
                              : 'w-4 h-4 sm:w-5 sm:h-5 bg-amber-500/70 shadow ring-2 ring-amber-400/90'
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
            <span>체스판 테마: <strong>{currentThemeConfig.name}</strong></span>
            <span>·</span>
            <span className="text-slate-300">합법적인 수만 둘 수 있으며 킹이 위협받으면 체크가 표시됩니다</span>
          </div>
        </div>
      </div>

      {/* Win Modal */}
      <WinModal
        isOpen={winModalOpen}
        game="chess"
        title={winModalData.title}
        subTitle={winModalData.subTitle}
        scoreText={winModalData.scoreText}
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
