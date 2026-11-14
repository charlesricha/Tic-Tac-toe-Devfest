/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { MarkIcon } from './components/MarkIcon';
import {
  checkWinner,
  createEmptyBoard,
  getComputerMove,
  isBoardFull,
  type BoardState,
  type Difficulty,
  type GameMode,
  type Player,
} from './game/minimax';
import { playDrawSound, playMoveSound, playWinSound } from './game/sound';

interface ScoreBoard {
  X: number;
  O: number;
  draws: number;
}

const INITIAL_SCORES: ScoreBoard = { X: 0, O: 0, draws: 0 };

function getWinLineCoords(line: [number, number, number]) {
  const [start, , end] = line;
  const startRow = Math.floor(start / 3);
  const startCol = start % 3;
  const endRow = Math.floor(end / 3);
  const endCol = end % 3;

  return {
    x1: startCol * 100 + 50,
    y1: startRow * 100 + 50,
    x2: endCol * 100 + 50,
    y2: endRow * 100 + 50,
  };
}

export default function App() {
  const [board, setBoard] = useState<BoardState>(() => createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<Player>('X');
  const [mode, setMode] = useState<GameMode>('computer');
  const [difficulty, setDifficulty] = useState<Difficulty>('unbeatable');
  const [scoresByMode, setScoresByMode] = useState<Record<GameMode, ScoreBoard>>({
    computer: { ...INITIAL_SCORES },
    'two-player': { ...INITIAL_SCORES },
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);

  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const computerTimerRef = useRef<number | null>(null);
  const roundScoredRef = useRef<boolean>(false);

  const winResult = useMemo(() => checkWinner(board), [board]);
  const isDraw = useMemo(() => !winResult && isBoardFull(board), [winResult, board]);
  const isRoundOver = Boolean(winResult || isDraw);
  const isComputerTurn = mode === 'computer' && currentTurn === 'O' && !isRoundOver;

  const scores = scoresByMode[mode];

  const clearComputerTimer = useCallback(() => {
    if (computerTimerRef.current !== null) {
      window.clearTimeout(computerTimerRef.current);
      computerTimerRef.current = null;
    }
  }, []);

  // Record score and play outcome sound exactly once when a round finishes
  useEffect(() => {
    if (isRoundOver && !roundScoredRef.current) {
      roundScoredRef.current = true;
      if (winResult) {
        playWinSound(soundEnabled);
        setScoresByMode((prev) => ({
          ...prev,
          [mode]: {
            ...prev[mode],
            [winResult.winner]: prev[mode][winResult.winner] + 1,
          },
        }));
      } else if (isDraw) {
        playDrawSound(soundEnabled);
        setScoresByMode((prev) => ({
          ...prev,
          [mode]: {
            ...prev[mode],
            draws: prev[mode].draws + 1,
          },
        }));
      }
    }
  }, [isRoundOver, winResult, isDraw, mode, soundEnabled]);

  // Trigger computer move locally via Minimax or Random when it is O's turn
  useEffect(() => {
    if (!isComputerTurn) return;

    computerTimerRef.current = window.setTimeout(() => {
      const move = getComputerMove(board, difficulty);
      if (move !== null) {
        setBoard((prev) => {
          if (prev[move] !== null) return prev;
          const next = [...prev];
          next[move] = 'O';
          return next;
        });
        setLastMoveIndex(move);
        setCurrentTurn('X');
        playMoveSound('O', soundEnabled);
      }
      computerTimerRef.current = null;
    }, 360);

    return clearComputerTimer;
  }, [isComputerTurn, board, difficulty, soundEnabled, clearComputerTimer]);

  const startNewRound = useCallback(() => {
    clearComputerTimer();
    roundScoredRef.current = false;
    setBoard(createEmptyBoard());
    setCurrentTurn('X');
    setLastMoveIndex(null);
    setHoveredCell(null);
  }, [clearComputerTimer]);

  const handleModeChange = useCallback(
    (nextMode: GameMode) => {
      if (nextMode === mode) return;
      clearComputerTimer();
      roundScoredRef.current = false;
      setMode(nextMode);
      setBoard(createEmptyBoard());
      setCurrentTurn('X');
      setLastMoveIndex(null);
      setHoveredCell(null);
    },
    [mode, clearComputerTimer]
  );

  const handleDifficultyChange = useCallback(
    (nextDifficulty: Difficulty) => {
      if (nextDifficulty === difficulty) return;
      clearComputerTimer();
      roundScoredRef.current = false;
      setDifficulty(nextDifficulty);
      setBoard(createEmptyBoard());
      setCurrentTurn('X');
      setLastMoveIndex(null);
      setHoveredCell(null);
    },
    [difficulty, clearComputerTimer]
  );

  const handleResetScores = useCallback(() => {
    setScoresByMode((prev) => ({
      ...prev,
      [mode]: { ...INITIAL_SCORES },
    }));
    startNewRound();
  }, [mode, startNewRound]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] !== null || isRoundOver || isComputerTurn) {
        return;
      }

      const nextBoard = [...board];
      nextBoard[index] = currentTurn;
      setBoard(nextBoard);
      setLastMoveIndex(index);
      setHoveredCell(null);
      playMoveSound(currentTurn, soundEnabled);

      const nextWin = checkWinner(nextBoard);
      const nextDraw = !nextWin && isBoardFull(nextBoard);
      if (!nextWin && !nextDraw) {
        setCurrentTurn(currentTurn === 'X' ? 'O' : 'X');
      }
    },
    [board, currentTurn, isRoundOver, isComputerTurn, soundEnabled]
  );

  const handleCellKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      let targetIndex: number | null = null;

      if (e.key === 'ArrowRight') {
        targetIndex = row * 3 + ((col + 1) % 3);
      } else if (e.key === 'ArrowLeft') {
        targetIndex = row * 3 + ((col + 2) % 3);
      } else if (e.key === 'ArrowDown') {
        targetIndex = ((row + 1) % 3) * 3 + col;
      } else if (e.key === 'ArrowUp') {
        targetIndex = ((row + 2) % 3) * 3 + col;
      }

      if (targetIndex !== null) {
        e.preventDefault();
        cellRefs.current[targetIndex]?.focus();
      }
    },
    []
  );

  const playerXLabel = mode === 'computer' ? 'You (X)' : 'Player 1 (X)';
  const playerOLabel = mode === 'computer' ? 'Computer (O)' : 'Player 2 (O)';

  const statusMessage = useMemo(() => {
    if (winResult) {
      if (mode === 'computer') {
        return winResult.winner === 'X' ? 'You win! (X)' : 'Computer wins! (O)';
      }
      return winResult.winner === 'X' ? 'Player 1 wins! (X)' : 'Player 2 wins! (O)';
    }
    if (isDraw) {
      return "It's a draw.";
    }
    if (mode === 'computer') {
      return currentTurn === 'X' ? 'Your turn · X' : 'Computer thinking · O';
    }
    return currentTurn === 'X' ? "Player 1's turn · X" : "Player 2's turn · O";
  }, [winResult, isDraw, mode, currentTurn]);

  const statusToneClass = useMemo(() => {
    if (winResult) {
      return winResult.winner === 'X' ? 'text-blue-700' : 'text-rose-700';
    }
    if (isDraw) {
      return 'text-slate-700';
    }
    return currentTurn === 'X' ? 'text-blue-700' : 'text-rose-700';
  }, [winResult, isDraw, currentTurn]);

  const winCoords = winResult ? getWinLineCoords(winResult.line) : null;
  const hasScoreHistory = scores.X > 0 || scores.O > 0 || scores.draws > 0;
  const hasMovesOnBoard = board.some((cell) => cell !== null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Minimal Header */}
      <header className="w-full max-w-2xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Tic-Tac-Toe
        </h1>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            title={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pb-10 flex flex-col items-center justify-center gap-6">
        {/* Mode & Difficulty Controls */}
        <section
          aria-label="Game settings"
          className="w-full max-w-[400px] flex flex-wrap items-center justify-between gap-3"
        >
          {/* Mode Toggle */}
          <div
            role="group"
            aria-label="Game mode"
            className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg"
          >
            <button
              type="button"
              onClick={() => handleModeChange('computer')}
              aria-pressed={mode === 'computer'}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                mode === 'computer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              vs Computer
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('two-player')}
              aria-pressed={mode === 'two-player'}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                mode === 'two-player'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2 Players
            </button>
          </div>

          {/* Difficulty Switch (shown when vs Computer is active) */}
          {mode === 'computer' && (
            <div
              role="group"
              aria-label="Computer difficulty"
              className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg"
            >
              <button
                type="button"
                onClick={() => handleDifficultyChange('easy')}
                aria-pressed={difficulty === 'easy'}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  difficulty === 'easy'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Easy
              </button>
              <button
                type="button"
                onClick={() => handleDifficultyChange('unbeatable')}
                aria-pressed={difficulty === 'unbeatable'}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  difficulty === 'unbeatable'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unbeatable
              </button>
            </div>
          )}
        </section>

        {/* Unboxed Scoreboard & Turn Indicator */}
        <section
          aria-label="Scoreboard and turn status"
          className="w-full max-w-[400px] border-y border-slate-200 py-4 flex flex-col gap-3"
        >
          <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
            <div
              className={`px-2 transition-opacity duration-150 ${
                !isRoundOver && currentTurn === 'X' ? 'opacity-100' : 'opacity-70'
              }`}
            >
              <div className="text-xs font-medium text-blue-700 truncate">
                {playerXLabel}
              </div>
              <div className="mt-0.5 text-2xl font-semibold font-mono-tabular text-slate-900">
                {scores.X}
              </div>
            </div>

            <div className="px-2">
              <div className="text-xs font-medium text-slate-500">Draws</div>
              <div className="mt-0.5 text-2xl font-semibold font-mono-tabular text-slate-900">
                {scores.draws}
              </div>
            </div>

            <div
              className={`px-2 transition-opacity duration-150 ${
                !isRoundOver && currentTurn === 'O' ? 'opacity-100' : 'opacity-70'
              }`}
            >
              <div className="text-xs font-medium text-rose-700 truncate">
                {playerOLabel}
              </div>
              <div className="mt-0.5 text-2xl font-semibold font-mono-tabular text-slate-900">
                {scores.O}
              </div>
            </div>
          </div>

          <div
            role="status"
            aria-live="polite"
            className={`text-center text-base font-semibold tracking-tight ${statusToneClass}`}
          >
            {statusMessage}
          </div>
        </section>

        {/* 3x3 Board Surface */}
        <section aria-label="Tic-Tac-Toe board" className="w-full max-w-[400px]">
          <div className="relative w-full aspect-square bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
            <div
              role="grid"
              aria-label="3 by 3 Tic-Tac-Toe grid"
              className="grid grid-cols-3 grid-rows-3 w-full h-full"
            >
              {board.map((cell, index) => {
                const row = Math.floor(index / 3) + 1;
                const col = (index % 3) + 1;
                const isWinningCell = winResult?.line.includes(index) ?? false;
                const isDimmed = Boolean(winResult && !isWinningCell);
                const canClick = cell === null && !isRoundOver && !isComputerTurn;
                const showGhost = canClick && hoveredCell === index;

                // Hairline grid borders without outer edges
                const borderClasses = [
                  index % 3 < 2 ? 'border-r border-slate-200' : '',
                  index < 6 ? 'border-b border-slate-200' : '',
                ].join(' ');

                const winningTint = isWinningCell
                  ? winResult?.winner === 'X'
                    ? 'bg-blue-50/75'
                    : 'bg-rose-50/75'
                  : '';

                return (
                  <button
                    key={index}
                    ref={(el) => {
                      cellRefs.current[index] = el;
                    }}
                    type="button"
                    role="gridcell"
                    aria-label={`Row ${row}, Column ${col}: ${cell ?? 'empty'}`}
                    aria-disabled={!canClick}
                    onClick={() => handleCellClick(index)}
                    onKeyDown={(e) => handleCellKeyDown(index, e)}
                    onMouseEnter={() => {
                      if (canClick) setHoveredCell(index);
                    }}
                    onMouseLeave={() => {
                      if (hoveredCell === index) setHoveredCell(null);
                    }}
                    className={`relative flex items-center justify-center min-h-[44px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset ${borderClasses} ${winningTint} ${
                      canClick ? 'cursor-pointer hover:bg-slate-50/80' : 'cursor-default'
                    }`}
                  >
                    {cell && (
                      <MarkIcon
                        player={cell}
                        animated={index === lastMoveIndex}
                        dimmed={isDimmed}
                      />
                    )}
                    {!cell && showGhost && <MarkIcon player={currentTurn} ghost />}
                  </button>
                );
              })}
            </div>

            {/* Winning Strike-Through Line Overlay */}
            {winCoords && winResult && (
              <svg
                viewBox="0 0 300 300"
                aria-hidden="true"
                className="pointer-events-none absolute inset-3 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)]"
              >
                <line
                  x1={winCoords.x1}
                  y1={winCoords.y1}
                  x2={winCoords.x2}
                  y2={winCoords.y2}
                  pathLength={100}
                  stroke={winResult.winner === 'X' ? '#2563EB' : '#E11D48'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="animate-win-line"
                />
              </svg>
            )}
          </div>
        </section>

        {/* Action Controls */}
        <section className="w-full max-w-[400px] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={startNewRound}
            disabled={!hasMovesOnBoard && !isRoundOver}
            className={`flex-1 min-h-[44px] px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isRoundOver
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : hasMovesOnBoard
                  ? 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRoundOver ? 'Play Again' : 'Restart Round'}</span>
          </button>

          {hasScoreHistory && (
            <button
              type="button"
              onClick={handleResetScores}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Reset Scores
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
