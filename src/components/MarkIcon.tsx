import type { Player } from '../game/minimax';

interface MarkIconProps {
  player: Player;
  ghost?: boolean;
  animated?: boolean;
  dimmed?: boolean;
}

export function MarkIcon({
  player,
  ghost = false,
  animated = false,
  dimmed = false,
}: MarkIconProps) {
  if (player === 'X') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={`w-1/2 h-1/2 transition-opacity duration-150 ${
          ghost
            ? 'text-blue-600/25'
            : dimmed
              ? 'text-blue-600/35'
              : 'text-blue-600'
        }`}
      >
        <line
          x1="14"
          y1="14"
          x2="50"
          y2="50"
          pathLength={100}
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
          className={animated ? 'animate-stroke-draw' : undefined}
        />
        <line
          x1="50"
          y1="14"
          x2="14"
          y2="50"
          pathLength={100}
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
          className={animated ? 'animate-stroke-draw-delayed' : undefined}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`w-1/2 h-1/2 transition-opacity duration-150 ${
        ghost
          ? 'text-rose-600/25'
          : dimmed
            ? 'text-rose-600/35'
            : 'text-rose-600'
      }`}
    >
      <circle
        cx="32"
        cy="32"
        r="19"
        pathLength={100}
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
        className={animated ? 'animate-stroke-draw' : undefined}
      />
    </svg>
  );
}
