import type { Difficulty } from '../../services/api';
import { colors } from '../../design/theme';
import { textStyle } from '../../design/typography';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <div className="fixed top-4 left-4 z-20">
      <span
        style={{
          ...textStyle.caption,
          color: colors.text.tertiary,
        }}
      >
        {difficulty}
      </span>
    </div>
  );
}
