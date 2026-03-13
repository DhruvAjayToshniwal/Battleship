import { useMemo } from 'react';
import * as THREE from 'three';
import { coordToXZ } from '../../utils/coordinates';

interface ShipProps {
  coordinates: string[];
  isPreview?: boolean;
}

function createHullGeometry(length: number, isHorizontal: boolean): THREE.BufferGeometry {
  const w = isHorizontal ? length * 0.92 : 0.55;
  const d = isHorizontal ? 0.55 : length * 0.92;
  const h = 0.18;
  const bowTaper = 0.35;

  const hw = w / 2;
  const hd = d / 2;

  const vertices: number[] = [];
  const indices: number[] = [];

  const addQuad = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number]
  ) => {
    const idx = vertices.length / 3;
    vertices.push(...a, ...b, ...c, ...d);
    indices.push(idx, idx + 1, idx + 2, idx, idx + 2, idx + 3);
  };

  const bowX = isHorizontal ? hw + bowTaper * 0.3 : 0;
  const bowZ = isHorizontal ? 0 : hd + bowTaper * 0.3;
  const sternX = isHorizontal ? -hw - bowTaper * 0.1 : 0;
  const sternZ = isHorizontal ? 0 : -hd - bowTaper * 0.1;

  if (isHorizontal) {
    addQuad([-hw, h, -hd], [hw, h, -hd], [hw, h, hd], [-hw, h, hd]);
    addQuad([-hw, 0, hd], [hw, 0, hd], [hw, h, hd], [-hw, h, hd]);
    addQuad([hw, 0, -hd], [-hw, 0, -hd], [-hw, h, -hd], [hw, h, -hd]);
    addQuad([-hw, 0, -hd], [-hw, 0, hd], [-hw, h, hd], [-hw, h, -hd]);
    addQuad([hw, 0, hd], [hw, 0, -hd], [hw, h, -hd], [hw, h, hd]);
    addQuad([-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd]);

    const bowIdx = vertices.length / 3;
    vertices.push(bowX, h * 0.7, 0);
    vertices.push(hw, h, -hd);
    vertices.push(hw, h, hd);
    indices.push(bowIdx, bowIdx + 1, bowIdx + 2);

    vertices.push(bowX, 0, 0);
    vertices.push(hw, 0, hd);
    vertices.push(hw, 0, -hd);
    indices.push(bowIdx + 3, bowIdx + 4, bowIdx + 5);

    const sternIdx = vertices.length / 3;
    vertices.push(sternX, h * 0.85, 0);
    vertices.push(-hw, h, hd);
    vertices.push(-hw, h, -hd);
    indices.push(sternIdx, sternIdx + 1, sternIdx + 2);
  } else {
    addQuad([-hw, h, -hd], [hw, h, -hd], [hw, h, hd], [-hw, h, hd]);
    addQuad([-hw, 0, hd], [hw, 0, hd], [hw, h, hd], [-hw, h, hd]);
    addQuad([hw, 0, -hd], [-hw, 0, -hd], [-hw, h, -hd], [hw, h, -hd]);
    addQuad([-hw, 0, -hd], [-hw, 0, hd], [-hw, h, hd], [-hw, h, -hd]);
    addQuad([hw, 0, hd], [hw, 0, -hd], [hw, h, -hd], [hw, h, hd]);
    addQuad([-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd]);

    const bowIdx = vertices.length / 3;
    vertices.push(0, h * 0.7, bowZ);
    vertices.push(-hw, h, hd);
    vertices.push(hw, h, hd);
    indices.push(bowIdx, bowIdx + 1, bowIdx + 2);

    vertices.push(0, 0, bowZ);
    vertices.push(hw, 0, hd);
    vertices.push(-hw, 0, hd);
    indices.push(bowIdx + 3, bowIdx + 4, bowIdx + 5);

    const sternIdx = vertices.length / 3;
    vertices.push(0, h * 0.85, sternZ);
    vertices.push(hw, h, -hd);
    vertices.push(-hw, h, -hd);
    indices.push(sternIdx, sternIdx + 1, sternIdx + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export default function Ship({ coordinates, isPreview = false }: ShipProps) {
  const size = coordinates.length;

  const { center, isHorizontal } = useMemo(() => {
    const positions = coordinates.map(coordToXZ);
    const cx = positions.reduce((s, p) => s + p[0], 0) / positions.length;
    const cz = positions.reduce((s, p) => s + p[1], 0) / positions.length;
    const horiz = size <= 1 ? true : coordinates[0][0] !== coordinates[1][0];
    return { center: [cx, cz] as [number, number], isHorizontal: horiz };
  }, [coordinates, size]);

  const hullGeometry = useMemo(
    () => createHullGeometry(size, isHorizontal),
    [size, isHorizontal]
  );

  const deckFeatures = useMemo(() => {
    const features: Array<{
      pos: [number, number, number];
      size: [number, number, number];
      type: 'bridge' | 'turret' | 'antenna';
    }> = [];

    if (isPreview) return features;

    if (size >= 3) {
      const bridgeOffset = size >= 4 ? -0.3 : 0;
      features.push({
        pos: isHorizontal
          ? [bridgeOffset, 0.24, 0]
          : [0, 0.24, bridgeOffset],
        size: [0.25, 0.12, 0.25],
        type: 'bridge',
      });
    }

    if (size >= 4) {
      const turretFwd = (size / 2 - 1) * 0.6;
      const turretAft = -(size / 2 - 1.5) * 0.5;

      features.push({
        pos: isHorizontal ? [turretFwd, 0.22, 0] : [0, 0.22, turretFwd],
        size: [0.18, 0.08, 0.18],
        type: 'turret',
      });
      features.push({
        pos: isHorizontal ? [turretAft, 0.22, 0] : [0, 0.22, turretAft],
        size: [0.15, 0.06, 0.15],
        type: 'turret',
      });
    }

    if (size >= 5) {
      features.push({
        pos: isHorizontal ? [0.4, 0.36, 0] : [0, 0.36, 0.4],
        size: [0.04, 0.14, 0.04],
        type: 'antenna',
      });
    }

    return features;
  }, [size, isHorizontal, isPreview]);

  const hullColor = isPreview ? '#22c55e' : '#3b4a5c';
  const deckColor = isPreview ? '#22c55e' : '#4a5568';

  return (
    <group position={[center[0], 0.09, center[1]]}>
      <mesh geometry={hullGeometry}>
        <meshStandardMaterial
          color={hullColor}
          transparent={isPreview}
          opacity={isPreview ? 0.5 : 1}
          emissive={isPreview ? '#22c55e' : '#0f1923'}
          emissiveIntensity={isPreview ? 0.4 : 0.15}
          roughness={0.7}
          metalness={0.4}
        />
      </mesh>

      {!isPreview && (
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry
            args={[
              isHorizontal ? size * 0.78 : 0.4,
              0.02,
              isHorizontal ? 0.4 : size * 0.78,
            ]}
          />
          <meshStandardMaterial
            color={deckColor}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      )}

      {deckFeatures.map((feature, i) => (
        <mesh key={i} position={feature.pos}>
          <boxGeometry args={feature.size} />
          <meshStandardMaterial
            color={feature.type === 'bridge' ? '#5a6577' : feature.type === 'antenna' ? '#8899aa' : '#4d5969'}
            roughness={0.5}
            metalness={feature.type === 'antenna' ? 0.7 : 0.4}
          />
        </mesh>
      ))}

      {!isPreview && size >= 3 && (
        <>
          <mesh
            position={isHorizontal ? [size * 0.35, 0.02, 0.22] : [0.22, 0.02, size * 0.35]}
            rotation={isHorizontal ? [0, 0, 0] : [0, Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.04, 0.08, 0.35]} />
            <meshStandardMaterial color="#3d4d5c" roughness={0.6} metalness={0.5} />
          </mesh>
          <mesh
            position={isHorizontal ? [size * 0.35, 0.02, -0.22] : [-0.22, 0.02, size * 0.35]}
            rotation={isHorizontal ? [0, 0, 0] : [0, Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.04, 0.08, 0.35]} />
            <meshStandardMaterial color="#3d4d5c" roughness={0.6} metalness={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
}
