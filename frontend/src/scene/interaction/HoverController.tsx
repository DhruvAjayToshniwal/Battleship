import { useCallback } from 'react';

interface HoverControllerProps {
  enabled: boolean;
  onHover: (row: number, col: number) => void;
  onHoverEnd: () => void;
  children: (handlers: {
    onPointerEnter: (row: number, col: number) => void;
    onPointerLeave: () => void;
  }) => React.ReactNode;
}

export default function HoverController({
  enabled,
  onHover,
  onHoverEnd,
  children,
}: HoverControllerProps) {
  const handleEnter = useCallback(
    (row: number, col: number) => {
      if (enabled) onHover(row, col);
    },
    [enabled, onHover]
  );

  const handleLeave = useCallback(() => {
    onHoverEnd();
  }, [onHoverEnd]);

  return <>{children({ onPointerEnter: handleEnter, onPointerLeave: handleLeave })}</>;
}
