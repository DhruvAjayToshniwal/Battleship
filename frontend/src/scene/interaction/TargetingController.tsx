import { useState, useCallback } from 'react';
import { rowColToCoord } from '../../utils/coordinates';
import { HALF_BOARD } from '../../utils/constants';

interface TargetingState {
  hoverCell: [number, number] | null;
  hoverWorldPos: [number, number, number] | null;
  hoverCoord: string | null;
}

export function useTargetingController(enabled: boolean) {
  const [targeting, setTargeting] = useState<TargetingState>({
    hoverCell: null,
    hoverWorldPos: null,
    hoverCoord: null,
  });

  const onCellHover = useCallback(
    (row: number, col: number) => {
      if (!enabled) return;
      const coord = rowColToCoord(row, col);
      const worldX = col - HALF_BOARD + 0.5;
      const worldZ = row - HALF_BOARD + 0.5;
      setTargeting({
        hoverCell: [row, col],
        hoverWorldPos: [worldX, 0.1, worldZ],
        hoverCoord: coord,
      });
    },
    [enabled]
  );

  const onCellLeave = useCallback(() => {
    setTargeting({
      hoverCell: null,
      hoverWorldPos: null,
      hoverCoord: null,
    });
  }, []);

  return { targeting, onCellHover, onCellLeave };
}
