import { useRef, useState, useCallback, useMemo } from 'react';
import Ocean from './Ocean';
import Grid from './Grid';
import Cell from './Cell';
import Ship from './Ship';
import Missile from './Missile';
import Explosion from './Explosion';
import Splash from './Splash';
import type { ShotResult } from '../services/api';

interface Board3DProps {
  position: [number, number, number];
  grid: (string | null)[][];
  showShips: boolean;
  isClickable: boolean;
  onCellClick?: (row: number, col: number, coordinate: string) => void;
  shipCoordinates?: string[][];
  previewCoords?: string[] | null;
  latestResult?: ShotResult | null;
}

function rowColToCoord(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (row + 1);
}

function coordToPosition(coord: string): [number, number, number] {
  const col = coord.charCodeAt(0) - 65;
  const row = parseInt(coord.slice(1), 10) - 1;
  const half = 5;
  return [col - half + 0.5, 0.1, row - half + 0.5];
}

interface EffectEntry {
  id: string;
  type: 'missile' | 'explosion' | 'splash';
  position: [number, number, number];
  resultType?: 'hit' | 'miss' | 'sunk';
}

export default function Board3D({
  position,
  grid,
  showShips,
  isClickable,
  onCellClick,
  shipCoordinates = [],
  previewCoords = null,
  latestResult,
}: Board3DProps) {
  const [effects, setEffects] = useState<EffectEntry[]>([]);
  const lastResultRef = useRef<string | null>(null);

  const resultKey = latestResult
    ? `${latestResult.coordinate}-${latestResult.result}`
    : null;
  if (resultKey && resultKey !== lastResultRef.current) {
    lastResultRef.current = resultKey;
    const pos = coordToPosition(latestResult!.coordinate);

    const newEffect: EffectEntry = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'missile',
      position: pos,
      resultType: latestResult!.result,
    };
    setEffects((prev) => [...prev, newEffect]);
  }

  const handleMissileImpact = useCallback((id: string, resultType: string, pos: [number, number, number]) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));

    const impactEffect: EffectEntry = {
      id: `impact-${Date.now()}-${Math.random()}`,
      type: resultType === 'miss' ? 'splash' : 'explosion',
      position: pos,
    };
    setEffects((prev) => [...prev, impactEffect]);
  }, []);

  const removeEffect = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const previewSet = useMemo(() => new Set(previewCoords ?? []), [previewCoords]);

  const half = 5;

  return (
    <group position={position}>
      <Ocean position={[0, -0.1, 0]} size={[12, 12]} />

      <Grid position={[0, 0.02, 0]} />

      {grid.map((row, rowIdx) =>
        row.map((cellState, colIdx) => {
          const coord = rowColToCoord(rowIdx, colIdx);
          const x = colIdx - half + 0.5;
          const z = rowIdx - half + 0.5;
          const isPreview = previewSet.has(coord);

          if (isPreview) {
            return (
              <Cell
                key={coord}
                position={[x, 0.02, z]}
                state={null}
                isPreview
              />
            );
          }

          return (
            <Cell
              key={coord}
              position={[x, 0.02, z]}
              state={cellState}
              showShips={showShips}
              isClickable={isClickable && !cellState}
              onClick={() => onCellClick?.(rowIdx, colIdx, coord)}
            />
          );
        })
      )}

      {showShips &&
        shipCoordinates.map((coords, i) => (
          <Ship key={`ship-${i}`} coordinates={coords} />
        ))}

      {previewCoords && previewCoords.length > 0 && (
        <Ship coordinates={previewCoords} isPreview />
      )}

      {effects.map((effect) => {
        if (effect.type === 'missile') {
          return (
            <Missile
              key={effect.id}
              position={effect.position}
              onImpact={() =>
                handleMissileImpact(effect.id, effect.resultType || 'miss', effect.position)
              }
            />
          );
        }
        if (effect.type === 'explosion') {
          return (
            <Explosion
              key={effect.id}
              position={effect.position}
              onComplete={() => removeEffect(effect.id)}
            />
          );
        }
        return (
          <Splash
            key={effect.id}
            position={effect.position}
            onComplete={() => removeEffect(effect.id)}
          />
        );
      })}
    </group>
  );
}
