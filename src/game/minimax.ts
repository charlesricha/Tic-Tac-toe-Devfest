export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type BoardState = CellValue[];
export type GameMode = 'computer' | 'two-player';
export type Difficulty = 'easy' | 'unbeatable';

export interface WinResult {
  winner: Player;
  line: [number, number, number];
}

export const WINNING_LINES: ReadonlyArray<[number, number, number]> = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Main diagonal
  [2, 4, 6], // Anti-diagonal
];

export function createEmptyBoard(): BoardState {
  return Array<CellValue>(9).fill(null);
}

export function checkWinner(board: BoardState): WinResult | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const value = board[a];
    if (value && value === board[b] && value === board[c]) {
      return { winner: value, line };
    }
  }
  return null;
}

export function isBoardFull(board: BoardState): boolean {
  return board.every((cell) => cell !== null);
}

export function getAvailableMoves(board: BoardState): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

export function getRandomMove(board: BoardState): number | null {
  const available = getAvailableMoves(board);
  if (available.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

/**
 * Minimax algorithm with alpha-beta pruning and depth weighting.
 * Computer plays as 'O' (maximizer), Human plays as 'X' (minimizer).
 * Picks randomly among equally optimal moves so games feel varied while staying unbeatable.
 */
function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  const win = checkWinner(board);
  if (win) {
    return win.winner === 'O' ? 10 - depth : depth - 10;
  }
  if (isBoardFull(board)) {
    return 0;
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        const score = minimax(board, depth + 1, false, alpha, beta);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
        }
        if (bestScore > alpha) {
          alpha = bestScore;
        }
        if (beta <= alpha) {
          break;
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        const score = minimax(board, depth + 1, true, alpha, beta);
        board[i] = null;
        if (score < bestScore) {
          bestScore = score;
        }
        if (bestScore < beta) {
          beta = bestScore;
        }
        if (beta <= alpha) {
          break;
        }
      }
    }
    return bestScore;
  }
}

export function getBestMove(board: BoardState): number | null {
  const available = getAvailableMoves(board);
  if (available.length === 0) return null;

  // Fast path if board is completely empty (center or corner are optimal)
  if (available.length === 9) {
    return 4;
  }

  const workingBoard = [...board];
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const move of available) {
    workingBoard[move] = 'O';
    const score = minimax(workingBoard, 0, false, -Infinity, Infinity);
    workingBoard[move] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  const chosenIndex = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[chosenIndex];
}

export function getComputerMove(board: BoardState, difficulty: Difficulty): number | null {
  if (difficulty === 'easy') {
    return getRandomMove(board);
  }
  return getBestMove(board);
}
