import { useState, useCallback } from 'react';

interface PlacementState {
  hoverCell: [number, number] | null;
}

export function usePlacementController(enabled: boolean) {
  const [placement, setPlacement] = useState<PlacementState>({
    hoverCell: null,
  });

  const onCellHover = useCallback(
    (row: number, col: number) => {
      if (!enabled) return;
      setPlacement({ hoverCell: [row, col] });
    },
    [enabled]
  );

  const onCellLeave = useCallback(() => {
    setPlacement({ hoverCell: null });
  }, []);

  return { placement, onCellHover, onCellLeave };
}
