import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { HALF_BOARD } from '../../utils/constants';
import { rowColToCoord, coordToPosition } from '../../utils/coordinates';
import type { ShotResult } from '../../services/api';
import OceanSurface from '../environment/OceanSurface';
import GridPlane from './GridPlane';
import BoardFrame from './BoardFrame';
import BoardMarkers from './BoardMarkers';
import TargetLock from './TargetLock';
import Cell from '../entities/Cell';
import Ship from '../entities/Ship';
import SmokeEffect from '../effects/SmokeEffect';
import Missile from '../effects/Missile';
import Explosion from '../effects/Explosion';
import Splash from '../effects/Splash';
import RadarSweep from '../environment/RadarSweep';

interface EnemyBoard3DProps {
  position: [number, number, number];
  grid: (string | null)[][];
  isClickable: boolean;
  onCellClick?: (row: number, col: number, coord: string) => void;
  shipCoordinates?: string[][];
  previewCoords?: string[] | null;
  latestResult?: ShotResult | null;
  hoverCell?: [number, number] | null;
}

interface EffectEntry {
  id: string;
  type: 'missile' | 'explosion' | 'splash';
  position: [number, number, number];
  resultType?: 'hit' | 'miss' | 'sunk';
}

export default function EnemyBoard3D({
  position,
  grid,
  isClickable,
  onCellClick,
  shipCoordinates = [],
  previewCoords = null,
  latestResult,
  hoverCell = null,
}: EnemyBoard3DProps) {
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

  const targetLockPosition = useMemo((): [number, number, number] | null => {
    if (!hoverCell) return null;
    const [row, col] = hoverCell;
    return [col - HALF_BOARD + 0.5, 0.02, row - HALF_BOARD + 0.5];
  }, [hoverCell]);

  return (
    <group position={position}>
      <OceanSurface position={[0, -0.1, 0]} size={[12, 12]} />

      <GridPlane position={[0, 0.02, 0]} />

      <BoardFrame color="#3f1e1e" glowColor="#ef4444" />

      <BoardMarkers />

      <RadarSweep position={[0, 0.01, 0]} size={10} active={isClickable} />

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
                isEnemyBoard
              />
            );
          }

          return (
            <Cell
              key={coord}
              position={[x, 0.02, z]}
              state={cellState}
              showShips={false}
              isClickable={isClickable && !cellState}
              isEnemyBoard
              onClick={() => onCellClick?.(rowIdx, colIdx, coord)}
            />
          );
        })
      )}

      {shipCoordinates.map((coords, i) => (
        <Ship key={`ship-${i}`} coordinates={coords} />
      ))}

      {previewCoords && previewCoords.length > 0 && (
        <Ship coordinates={previewCoords} isPreview />
      )}

      {hitPositions.map((pos, i) => (
        <SmokeEffect key={`smoke-${i}`} position={pos} />
      ))}

      {targetLockPosition && (
        <TargetLock position={targetLockPosition} active={!!hoverCell} />
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
