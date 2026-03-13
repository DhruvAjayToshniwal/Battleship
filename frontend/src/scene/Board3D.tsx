import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import Ocean from './environment/Ocean';
import Grid from './environment/Grid';
import Cell from './entities/Cell';
import Ship from './entities/Ship';
import Missile from './effects/Missile';
import Explosion from './effects/Explosion';
import Splash from './effects/Splash';
import SmokeEffect from './effects/SmokeEffect';
import RadarSweep from './environment/RadarSweep';
import { rowColToCoord, coordToPosition } from '../utils/coordinates';
import { HALF_BOARD } from '../utils/constants';
import type { ShotResult } from '../services/api';

interface Board3DProps {
  position: [number, number, number];
  grid: (string | null)[][];
  showShips: boolean;
  isClickable: boolean;
  isEnemyBoard?: boolean;
  onCellClick?: (row: number, col: number, coordinate: string) => void;
  shipCoordinates?: string[][];
  previewCoords?: string[] | null;
  latestResult?: ShotResult | null;
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
  isEnemyBoard = false,
  onCellClick,
  shipCoordinates = [],
  previewCoords = null,
  latestResult,
}: Board3DProps) {
  const [effects, setEffects] = useState<EffectEntry[]>([]);
  const lastResultRef = useRef<string | null>(null);

  useEffect(() => {
    if (!latestResult) return;
    const resultKey = `${latestResult.coordinate}-${latestResult.result}`;
    if (resultKey === lastResultRef.current) return;
    lastResultRef.current = resultKey;

    const pos = coordToPosition(latestResult.coordinate);
    const newEffect: EffectEntry = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'missile',
      position: pos,
      resultType: latestResult.result,
    };
    setEffects((prev) => [...prev, newEffect]);
  }, [latestResult]);

  const handleMissileImpact = useCallback((id: string, resultType: string, pos: [number, number, number]) => {
    setEffects((prev) => {
      const without = prev.filter((e) => e.id !== id);
      const impactEffect: EffectEntry = {
        id: `impact-${Date.now()}-${Math.random()}`,
        type: resultType === 'miss' ? 'splash' : 'explosion',
        position: pos,
      };
      return [...without, impactEffect];
    });
  }, []);

  const removeEffect = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const previewSet = useMemo(() => new Set(previewCoords ?? []), [previewCoords]);

  const hitPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    grid.forEach((row, rowIdx) => {
      row.forEach((cellState, colIdx) => {
        if (cellState === 'hit') {
          positions.push([colIdx - HALF_BOARD + 0.5, 0.1, rowIdx - HALF_BOARD + 0.5]);
        }
      });
    });
    return positions;
  }, [grid]);

  return (
    <group position={position}>
      <Ocean position={[0, -0.1, 0]} size={[12, 12]} />

      <Grid position={[0, 0.02, 0]} />

      {isEnemyBoard && (
        <RadarSweep position={[0, 0.01, 0]} size={10} active={isClickable} />
      )}

      {grid.map((row, rowIdx) =>
        row.map((cellState, colIdx) => {
          const coord = rowColToCoord(rowIdx, colIdx);
          const x = colIdx - HALF_BOARD + 0.5;
          const z = rowIdx - HALF_BOARD + 0.5;
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
              isEnemyBoard={isEnemyBoard}
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

      {hitPositions.map((pos, i) => (
        <SmokeEffect key={`smoke-${i}`} position={pos} />
      ))}

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
