import type { Difficulty } from '../../services/api';
import { DIFFICULTY_COLORS } from '../../utils/constants';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const color = DIFFICULTY_COLORS[difficulty];

  return (
    <div
      className="fixed top-4 left-4 z-20 px-3 py-1 rounded-full"
      style={{
        background: 'rgba(2, 6, 23, 0.8)',
        border: `1px solid ${color}60`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <span
        className="text-[10px] font-bold tracking-widest uppercase"
        style={{ color }}
      >
        {difficulty}
      </span>
    </div>
  );
}
