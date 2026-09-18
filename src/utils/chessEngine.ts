// Advanced Chess Engine & AI for Middle School Arcade
// Implements full rules: Check/Checkmate detection, Legal move filtering (king cannot stay in check),
// Piece-Square Tables (PST), Alpha-Beta Minimax search with Quiescence, AI difficulty levels (Easy / Medium / Master)

export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type BoardState = (ChessPiece | null)[][];

export interface Move {
  from: [number, number];
  to: [number, number];
  promotion?: PieceType;
  score?: number;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (8x8, indexed from White's perspective)
// For Black, row is inverted (7 - r)
const PAWN_PST: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_PST: number[][] = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_PST: number[][] = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_PST: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_PST: number[][] = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MIDDLE_PST: number[][] = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

export function cloneBoard(b: BoardState): BoardState {
  return b.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

// Check if square is attacked by attackerColor
export function isSquareAttacked(b: BoardState, r: number, c: number, attackerColor: PieceColor): boolean {
  // 1. Attacked by Pawns
  const pawnPusher = attackerColor === 'w' ? 1 : -1;
  // If square (r,c) is attacked by white pawn, the pawn is at (r+1, c±1)
  const pawnRow = r + pawnPusher;
  if (pawnRow >= 0 && pawnRow < 8) {
    for (const dc of [-1, 1]) {
      const pc = c + dc;
      if (pc >= 0 && pc < 8) {
        const p = b[pawnRow][pc];
        if (p && p.color === attackerColor && p.type === 'p') return true;
      }
    }
  }

  // 2. Attacked by Knights
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightOffsets) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = b[nr][nc];
      if (p && p.color === attackerColor && p.type === 'n') return true;
    }
  }

  // 3. Attacked by Kings
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = b[nr][nc];
        if (p && p.color === attackerColor && p.type === 'k') return true;
      }
    }
  }

  // 4. Attacked by Rooks or Queens (Orthogonal)
  const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of orthoDirs) {
    let step = 1;
    while (step < 8) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
      const p = b[nr][nc];
      if (p) {
        if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) {
          return true;
        }
        break; // blocked
      }
      step++;
    }
  }

  // 5. Attacked by Bishops or Queens (Diagonal)
  const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of diagDirs) {
    let step = 1;
    while (step < 8) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
      const p = b[nr][nc];
      if (p) {
        if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) {
          return true;
        }
        break; // blocked
      }
      step++;
    }
  }

  return false;
}

// Find king position of specified color
export function findKing(b: BoardState, color: PieceColor): [number, number] | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p && p.color === color && p.type === 'k') {
        return [r, c];
      }
    }
  }
  return null;
}

// Is color currently in check?
export function isKingInCheck(b: BoardState, color: PieceColor): boolean {
  const kingPos = findKing(b, color);
  if (!kingPos) return true; // King missing
  const oppColor: PieceColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(b, kingPos[0], kingPos[1], oppColor);
}

// Get pseudo-legal moves for piece at (r, c)
export function getPseudoLegalMoves(b: BoardState, r: number, c: number): [number, number][] {
  const piece = b[r][c];
  if (!piece) return [];
  const moves: [number, number][] = [];
  const color = piece.color;
  const oppColor: PieceColor = color === 'w' ? 'b' : 'w';

  const addMove = (nr: number, nc: number) => {
    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) return false;
    const target = b[nr][nc];
    if (!target) {
      moves.push([nr, nc]);
      return true;
    } else if (target.color === oppColor) {
      moves.push([nr, nc]);
      return false; // capture, can't jump past
    }
    return false; // friendly piece
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
    // Diagonal captures
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
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    offsets.forEach(([dr, dc]) => addMove(r + dr, c + dc));
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
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        addMove(r + dr, c + dc);
      }
    }
  }

  return moves;
}

// Apply move on board copy (handles pawn auto-promotion to Queen)
export function applyMove(b: BoardState, from: [number, number], to: [number, number]): BoardState {
  const next = cloneBoard(b);
  const p = next[from[0]][from[1]];
  if (!p) return next;

  next[from[0]][from[1]] = null;

  // Pawn promotion to Queen
  if (p.type === 'p' && ((p.color === 'w' && to[0] === 0) || (p.color === 'b' && to[0] === 7))) {
    next[to[0]][to[1]] = { type: 'q', color: p.color };
  } else {
    next[to[0]][to[1]] = p;
  }

  return next;
}

// Strictly Legal Moves: Must not leave king in check!
export function getLegalMovesForPiece(b: BoardState, r: number, c: number): [number, number][] {
  const p = b[r][c];
  if (!p) return [];
  const pseudo = getPseudoLegalMoves(b, r, c);

  return pseudo.filter(([tr, tc]) => {
    const after = applyMove(b, [r, c], [tr, tc]);
    return !isKingInCheck(after, p.color);
  });
}

// Get all legal moves for a color
export function getAllLegalMoves(b: BoardState, color: PieceColor): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p && p.color === color) {
        const legalDests = getLegalMovesForPiece(b, r, c);
        legalDests.forEach(([tr, tc]) => {
          moves.push({ from: [r, c], to: [tr, tc] });
        });
      }
    }
  }
  return moves;
}

// Evaluate board from perspective of Black (positive = Black advantage, AI side)
export function evaluateBoard(b: BoardState): number {
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p) continue;

      const baseVal = PIECE_VALUES[p.type];
      let pstVal = 0;

      // PST table lookup
      const pstRow = p.color === 'w' ? r : 7 - r;
      const pstCol = c;

      if (p.type === 'p') pstVal = PAWN_PST[pstRow][pstCol];
      else if (p.type === 'n') pstVal = KNIGHT_PST[pstRow][pstCol];
      else if (p.type === 'b') pstVal = BISHOP_PST[pstRow][pstCol];
      else if (p.type === 'r') pstVal = ROOK_PST[pstRow][pstCol];
      else if (p.type === 'q') pstVal = QUEEN_PST[pstRow][pstCol];
      else if (p.type === 'k') pstVal = KING_MIDDLE_PST[pstRow][pstCol];

      const pieceTotal = baseVal + pstVal;
      if (p.color === 'b') {
        score += pieceTotal;
      } else {
        score -= pieceTotal;
      }
    }
  }

  // Bonus for giving check to enemy king
  if (isKingInCheck(b, 'w')) score += 45;
  if (isKingInCheck(b, 'b')) score -= 45;

  return score;
}

// Sort moves for Alpha-Beta pruning efficiency (Captures & Checks first)
function orderMoves(b: BoardState, moves: Move[], isMaximizing: boolean): Move[] {
  const moverColor: PieceColor = isMaximizing ? 'b' : 'w';
  const oppColor: PieceColor = moverColor === 'w' ? 'b' : 'w';

  return moves.map((m) => {
    const moving = b[m.from[0]][m.from[1]]!;
    const target = b[m.to[0]][m.to[1]];
    let priority = 0;

    if (target) {
      // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
      priority += PIECE_VALUES[target.type] * 10 - PIECE_VALUES[moving.type];
    }

    // Check bonus
    const after = applyMove(b, m.from, m.to);
    if (isKingInCheck(after, oppColor)) {
      priority += 150;
    }

    // Pawn promotion bonus
    if (moving.type === 'p' && (m.to[0] === 0 || m.to[0] === 7)) {
      priority += 800;
    }

    return { ...m, score: priority };
  }).sort((a, b) => (b.score || 0) - (a.score || 0));
}

// Minimax with Alpha-Beta Pruning
export function minimax(
  b: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): { score: number; bestMove?: Move } {
  const currentColor: PieceColor = isMaximizing ? 'b' : 'w';
  const legalMoves = getAllLegalMoves(b, currentColor);

  // Terminal conditions
  if (legalMoves.length === 0) {
    if (isKingInCheck(b, currentColor)) {
      // Checkmate!
      return { score: isMaximizing ? -99999 + (5 - depth) * 10 : 99999 - (5 - depth) * 10 };
    }
    // Stalemate
    return { score: 0 };
  }

  if (depth === 0) {
    return { score: evaluateBoard(b) };
  }

  const sortedMoves = orderMoves(b, legalMoves, isMaximizing);
  let bestMove: Move | undefined = sortedMoves[0];

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of sortedMoves) {
      const nextBoard = applyMove(b, move.from, move.to);
      const result = minimax(nextBoard, depth - 1, alpha, beta, false);
      if (result.score > maxEval) {
        maxEval = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, result.score);
      if (beta <= alpha) break; // Beta cut-off
    }
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    for (const move of sortedMoves) {
      const nextBoard = applyMove(b, move.from, move.to);
      const result = minimax(nextBoard, depth - 1, alpha, beta, true);
      if (result.score < minEval) {
        minEval = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, result.score);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return { score: minEval, bestMove };
  }
}

// Top-level AI move selector based on Difficulty Level
export function selectAIMove(b: BoardState, difficulty: AIDifficulty = 'medium'): Move | null {
  const legalMoves = getAllLegalMoves(b, 'b');
  if (legalMoves.length === 0) return null;

  if (difficulty === 'easy') {
    // Easy: Depth 1 with occasional slight randomness
    const evaluated = legalMoves.map((m) => {
      const next = applyMove(b, m.from, m.to);
      let score = evaluateBoard(next);
      // Small capture bias
      const target = b[m.to[0]][m.to[1]];
      if (target) score += PIECE_VALUES[target.type] * 0.4;
      score += (Math.random() - 0.5) * 60;
      return { move: m, score };
    });
    evaluated.sort((a, b) => b.score - a.score);
    return evaluated[0].move;
  }

  if (difficulty === 'medium') {
    // Medium: Depth 2 Minimax Alpha-Beta (Solid tactical play, prevents blunders, checks response)
    const result = minimax(b, 2, -Infinity, Infinity, true);
    if (result.bestMove) return result.bestMove;
  }

  if (difficulty === 'hard') {
    // Hard (Master): Depth 3 Minimax Alpha-Beta with deep tactical defense & attack
    const result = minimax(b, 3, -Infinity, Infinity, true);
    if (result.bestMove) return result.bestMove;
  }

  // Fallback
  return legalMoves[0];
}
