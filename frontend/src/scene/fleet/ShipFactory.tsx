import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { coordToXZ } from '../../utils/coordinates';
import ShipWake from './ShipWake';
import ShipDamageFX from './ShipDamageFX';

interface ShipFactoryProps {
  coordinates: string[];
  isPreview?: boolean;
  damage?: number;
  showWake?: boolean;
}

type ShipClass = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

function getShipClass(size: number): ShipClass {
  if (size >= 5) return 'carrier';
  if (size === 4) return 'battleship';
  if (size === 3) return 'cruiser';
  if (size === 2) return 'destroyer';
  return 'destroyer';
}

/* ──────── smoothstep helper ──────── */
function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/* ──────── hull cross-section profiles by class ──────── */

function surfaceShipProfile(halfW: number, h: number): THREE.Vector2[] {
  // Classic naval hull: keel → bilge → tumblehome
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(0, -h * 0.15)); // keel
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 0.5;
    const x = Math.sin(angle) * halfW;
    const y = -h * 0.15 + (1 - Math.cos(angle)) * h * 0.45;
    pts.push(new THREE.Vector2(x, y));
  }
  pts.push(new THREE.Vector2(halfW, h * 0.7));
  pts.push(new THREE.Vector2(halfW * 0.93, h)); // tumblehome
  return pts;
}

function submarineProfile(halfW: number, h: number): THREE.Vector2[] {
  // Cylindrical: round cross-section
  const pts: THREE.Vector2[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI;
    const x = Math.sin(angle) * halfW;
    const y = -Math.cos(angle) * h * 0.5 + h * 0.35;
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}

function carrierProfile(halfW: number, h: number): THREE.Vector2[] {
  // Wide and flat-sided, slight bottom curve
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(0, -h * 0.1));
  pts.push(new THREE.Vector2(halfW * 0.4, -h * 0.05));
  pts.push(new THREE.Vector2(halfW * 0.8, h * 0.05));
  pts.push(new THREE.Vector2(halfW, h * 0.15));
  pts.push(new THREE.Vector2(halfW, h * 0.85));
  pts.push(new THREE.Vector2(halfW * 0.98, h)); // near-vertical sides
  return pts;
}

/* ──────── hull geometry builder ──────── */

interface HullParams {
  halfW: number;
  height: number;
  bowTaper: number;
  sternTaper: number;
  bowRake: number;      // how much the bow keeps its height (1 = full, 0.3 = low)
  bowSharpness: number; // where the taper starts (0.7 = last 30%)
}

const CLASS_PARAMS: Record<ShipClass, HullParams> = {
  carrier:     { halfW: 0.38, height: 0.16, bowTaper: 0.55, sternTaper: 0.65, bowRake: 0.85, bowSharpness: 0.82 },
  battleship:  { halfW: 0.34, height: 0.22, bowTaper: 0.30, sternTaper: 0.45, bowRake: 0.65, bowSharpness: 0.78 },
  cruiser:     { halfW: 0.30, height: 0.20, bowTaper: 0.28, sternTaper: 0.42, bowRake: 0.60, bowSharpness: 0.76 },
  submarine:   { halfW: 0.26, height: 0.22, bowTaper: 0.15, sternTaper: 0.15, bowRake: 0.40, bowSharpness: 0.72 },
  destroyer:   { halfW: 0.28, height: 0.18, bowTaper: 0.22, sternTaper: 0.38, bowRake: 0.55, bowSharpness: 0.74 },
};

function createHullGeometry(length: number, isHorizontal: boolean, shipClass: ShipClass): THREE.BufferGeometry {
  const hullLen = length * 0.92;
  const params = CLASS_PARAMS[shipClass];
  const { halfW, height, bowTaper, sternTaper, bowRake, bowSharpness } = params;

  const profile =
    shipClass === 'submarine' ? submarineProfile(halfW, height)
    : shipClass === 'carrier' ? carrierProfile(halfW, height)
    : surfaceShipProfile(halfW, height);

  const sections = 14;
  const halfLen = hullLen / 2;
  const verts: number[] = [];
  const indices: number[] = [];

  // Build mirrored profile ring (port-side reversed + starboard)
  const profileLen = profile.length;
  const ringSize = (profileLen - 1) * 2; // omit duplicate center at keel/top

  function pushRing(widthScale: number, heightScale: number, z: number) {
    // Port side (reverse, skip first to avoid keel duplicate later)
    for (let p = profileLen - 1; p >= 1; p--) {
      const x = -profile[p].x * widthScale;
      const y = profile[p].y * heightScale;
      if (isHorizontal) verts.push(z, y, x);
      else verts.push(x, y, z);
    }
    // Starboard side (skip last = same as first port vertex closing the loop)
    for (let p = 0; p < profileLen - 1; p++) {
      const x = profile[p].x * widthScale;
      const y = profile[p].y * heightScale;
      if (isHorizontal) verts.push(z, y, x);
      else verts.push(x, y, z);
    }
  }

  for (let s = 0; s <= sections; s++) {
    const t = s / sections; // 0 = stern, 1 = bow
    const z = -halfLen + t * hullLen;

    let wScale = 1.0;
    let hScale = 1.0;

    if (t < 0.18) {
      // Stern taper
      const st = smoothstep(t / 0.18);
      wScale = sternTaper + (1 - sternTaper) * st;
      hScale = 0.82 + 0.18 * st;
    } else if (t > bowSharpness) {
      // Bow taper
      const bt = (t - bowSharpness) / (1 - bowSharpness);
      const sbt = smoothstep(bt);
      wScale = 1.0 - sbt * (1 - bowTaper);
      hScale = 1.0 - sbt * (1 - bowRake);
    }

    pushRing(wScale, hScale, z);
  }

  // Connect rings with quads
  for (let s = 0; s < sections; s++) {
    for (let v = 0; v < ringSize; v++) {
      const nextV = (v + 1) % ringSize;
      const a = s * ringSize + v;
      const b = s * ringSize + nextV;
      const c = (s + 1) * ringSize + v;
      const d = (s + 1) * ringSize + nextV;
      indices.push(a, c, b, b, c, d);
    }
  }

  // Deck cap — flat polygon across top-edge vertices
  const deckStart = verts.length / 3;
  for (let s = 0; s <= sections; s++) {
    const t = s / sections;
    const z = -halfLen + t * hullLen;
    let wScale = 1.0, hScale = 1.0;
    if (t < 0.18) {
      const st = smoothstep(t / 0.18);
      wScale = sternTaper + (1 - sternTaper) * st;
      hScale = 0.82 + 0.18 * st;
    } else if (t > bowSharpness) {
      const bt = (t - bowSharpness) / (1 - bowSharpness);
      const sbt = smoothstep(bt);
      wScale = 1.0 - sbt * (1 - bowTaper);
      hScale = 1.0 - sbt * (1 - bowRake);
    }
    const deckW = (shipClass === 'carrier' ? halfW * 0.98 : halfW * 0.93) * wScale;
    const deckY = height * hScale;
    if (isHorizontal) {
      verts.push(z, deckY, -deckW);
      verts.push(z, deckY, deckW);
    } else {
      verts.push(-deckW, deckY, z);
      verts.push(deckW, deckY, z);
    }
  }
  for (let s = 0; s < sections; s++) {
    const a = deckStart + s * 2;
    const b = a + 1;
    const c = deckStart + (s + 1) * 2;
    const d = c + 1;
    indices.push(a, b, c, b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ──────── superstructure definitions ──────── */

interface DeckPart {
  pos: [number, number, number];
  args: [number, number, number];
  color: string;
  metalness: number;
  roughness: number;
  shape?: 'box' | 'cylinder';
}

function getSuperstructure(size: number, isHorizontal: boolean, shipClass: ShipClass): DeckPart[] {
  const parts: DeckPart[] = [];
  const h = CLASS_PARAMS[shipClass].height;

  // Orient helper — swaps x/z based on ship direction
  const p = (x: number, y: number, z: number): [number, number, number] =>
    isHorizontal ? [z, y, x] : [x, y, z];
  const sz = (w: number, ht: number, d: number): [number, number, number] =>
    isHorizontal ? [d, ht, w] : [w, ht, d];

  if (shipClass === 'carrier') {
    // Island superstructure — offset to starboard
    parts.push({ pos: p(0.20, h + 0.10, 0.4), args: sz(0.14, 0.20, 0.22), color: '#48556a', metalness: 0.6, roughness: 0.4 });
    // Radar mast
    parts.push({ pos: p(0.20, h + 0.28, 0.4), args: [0.035, 0.16, 0.035], color: '#6b7a8c', metalness: 0.8, roughness: 0.3, shape: 'cylinder' });
    // Flight deck line
    parts.push({ pos: p(0, h + 0.008, 0), args: sz(0.04, 0.005, size * 0.72), color: '#5a6370', metalness: 0.3, roughness: 0.8 });
    // Bow ramp slope marker
    parts.push({ pos: p(0, h + 0.008, size * 0.35), args: sz(0.28, 0.003, 0.12), color: '#555e6a', metalness: 0.3, roughness: 0.8 });
  } else if (shipClass === 'battleship') {
    const fwd = size * 0.22;
    // Forward main turret — cylinder
    parts.push({ pos: p(0, h + 0.06, fwd), args: [0.14, 0.09, 0.14], color: '#475568', metalness: 0.65, roughness: 0.45, shape: 'cylinder' });
    // Forward barrels
    parts.push({ pos: p(0.05, h + 0.08, fwd + 0.20), args: [0.022, 0.022, 0.22], color: '#5a6577', metalness: 0.7, roughness: 0.35, shape: 'cylinder' });
    parts.push({ pos: p(-0.05, h + 0.08, fwd + 0.20), args: [0.022, 0.022, 0.22], color: '#5a6577', metalness: 0.7, roughness: 0.35, shape: 'cylinder' });
    // Bridge tower — tiered
    parts.push({ pos: p(0, h + 0.10, 0), args: sz(0.20, 0.18, 0.22), color: '#4e5a6a', metalness: 0.55, roughness: 0.5 });
    parts.push({ pos: p(0, h + 0.22, 0), args: sz(0.14, 0.08, 0.14), color: '#556272', metalness: 0.5, roughness: 0.5 });
    // Mast
    parts.push({ pos: p(0, h + 0.34, 0), args: [0.022, 0.16, 0.022], color: '#7a8a9a', metalness: 0.8, roughness: 0.3, shape: 'cylinder' });
    // Funnel
    parts.push({ pos: p(0, h + 0.16, -0.28), args: [0.065, 0.14, 0.065], color: '#3e4e5e', metalness: 0.45, roughness: 0.55, shape: 'cylinder' });
    // Aft turret
    const aft = -size * 0.20;
    parts.push({ pos: p(0, h + 0.05, aft), args: [0.12, 0.08, 0.12], color: '#475568', metalness: 0.65, roughness: 0.45, shape: 'cylinder' });
    parts.push({ pos: p(0, h + 0.07, aft - 0.16), args: [0.022, 0.022, 0.18], color: '#5a6577', metalness: 0.7, roughness: 0.35, shape: 'cylinder' });
  } else if (shipClass === 'cruiser') {
    // Bridge
    parts.push({ pos: p(0, h + 0.09, 0.12), args: sz(0.16, 0.16, 0.18), color: '#4e5a6a', metalness: 0.55, roughness: 0.5 });
    parts.push({ pos: p(0, h + 0.20, 0.12), args: sz(0.10, 0.06, 0.10), color: '#556272', metalness: 0.5, roughness: 0.5 });
    // Mast
    parts.push({ pos: p(0, h + 0.30, 0.12), args: [0.018, 0.14, 0.018], color: '#7a8a9a', metalness: 0.8, roughness: 0.3, shape: 'cylinder' });
    // Forward weapon
    parts.push({ pos: p(0, h + 0.04, size * 0.22), args: [0.09, 0.06, 0.09], color: '#475568', metalness: 0.6, roughness: 0.45, shape: 'cylinder' });
    // Funnel
    parts.push({ pos: p(0, h + 0.13, -0.16), args: [0.05, 0.10, 0.05], color: '#3e4e5e', metalness: 0.45, roughness: 0.55, shape: 'cylinder' });
    // Aft weapon
    parts.push({ pos: p(0, h + 0.03, -size * 0.22), args: [0.07, 0.05, 0.07], color: '#475568', metalness: 0.6, roughness: 0.45, shape: 'cylinder' });
  } else if (shipClass === 'submarine') {
    // Low conning tower — rounded
    parts.push({ pos: p(0, h + 0.04, 0.12), args: [0.08, 0.10, 0.08], color: '#3e4e5e', metalness: 0.55, roughness: 0.55, shape: 'cylinder' });
    // Conning tower top fair-water
    parts.push({ pos: p(0, h + 0.10, 0.12), args: sz(0.10, 0.04, 0.16), color: '#3a4858', metalness: 0.5, roughness: 0.6 });
    // Periscope mast
    parts.push({ pos: p(0, h + 0.18, 0.14), args: [0.012, 0.10, 0.012], color: '#8899aa', metalness: 0.8, roughness: 0.3, shape: 'cylinder' });
    // Dive planes (small fins)
    parts.push({ pos: p(0.20, h * 0.4, 0.15), args: sz(0.14, 0.015, 0.04), color: '#3a4858', metalness: 0.5, roughness: 0.6 });
    parts.push({ pos: p(-0.20, h * 0.4, 0.15), args: sz(0.14, 0.015, 0.04), color: '#3a4858', metalness: 0.5, roughness: 0.6 });
  } else {
    // Destroyer — compact, aggressive
    // Bridge (forward)
    parts.push({ pos: p(0, h + 0.07, 0.05), args: sz(0.14, 0.13, 0.14), color: '#4e5a6a', metalness: 0.55, roughness: 0.5 });
    // Forward gun turret
    parts.push({ pos: p(0, h + 0.04, size * 0.24), args: [0.07, 0.055, 0.07], color: '#475568', metalness: 0.6, roughness: 0.45, shape: 'cylinder' });
    // Barrel
    parts.push({ pos: p(0, h + 0.055, size * 0.24 + 0.12), args: [0.018, 0.018, 0.14], color: '#5a6577', metalness: 0.7, roughness: 0.35, shape: 'cylinder' });
    // Funnel
    parts.push({ pos: p(0, h + 0.11, -0.10), args: [0.04, 0.08, 0.04], color: '#3e4e5e', metalness: 0.45, roughness: 0.55, shape: 'cylinder' });
    // Mast
    parts.push({ pos: p(0, h + 0.18, 0.05), args: [0.014, 0.08, 0.014], color: '#7a8a9a', metalness: 0.8, roughness: 0.3, shape: 'cylinder' });
  }

  return parts;
}

/* ──────── main component ──────── */

export default function ShipFactory({
  coordinates,
  isPreview = false,
  damage = 0,
  showWake = false,
}: ShipFactoryProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bobTimeRef = useRef(Math.random() * Math.PI * 2);
  const sinkRef = useRef(0);

  const size = coordinates.length;
  const shipClass = getShipClass(size);

  const { center, isHorizontal } = useMemo(() => {
    const positions = coordinates.map(coordToXZ);
    const cx = positions.reduce((s, p) => s + p[0], 0) / positions.length;
    const cz = positions.reduce((s, p) => s + p[1], 0) / positions.length;
    const horiz = size <= 1 ? true : coordinates[0][0] !== coordinates[1][0];
    return { center: [cx, cz] as [number, number], isHorizontal: horiz };
  }, [coordinates, size]);

  const hullGeometry = useMemo(
    () => createHullGeometry(size, isHorizontal, shipClass),
    [size, isHorizontal, shipClass],
  );

  const superstructure = useMemo(
    () => isPreview ? [] : getSuperstructure(size, isHorizontal, shipClass),
    [size, isHorizontal, shipClass, isPreview],
  );

  const hullColor = isPreview ? '#22c55e' : '#3b4a5c';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    bobTimeRef.current += dt;

    const isSunk = damage >= 1;
    sinkRef.current += ((isSunk ? 1 : 0) - sinkRef.current) * dt * 0.8;
    const sink = sinkRef.current;

    const bobAmp = 0.025 * (1 - sink);
    const bobY = 0.09 + Math.sin(bobTimeRef.current * 0.8) * bobAmp - sink * 0.12;
    groupRef.current.position.y = bobY;

    const tilt = sink * 0.25 + damage * 0.05;
    const roll = sink * 0.15;
    groupRef.current.rotation.x = tilt * (isHorizontal ? 0 : 1);
    groupRef.current.rotation.z = roll * (isHorizontal ? 1 : 0) + tilt * (isHorizontal ? 1 : 0);
  });

  return (
    <group ref={groupRef} position={[center[0], 0.09, center[1]]}>
      {/* Hull */}
      <mesh geometry={hullGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={hullColor}
          transparent={isPreview}
          opacity={isPreview ? 0.5 : 1}
          emissive={isPreview ? '#22c55e' : '#0f1923'}
          emissiveIntensity={isPreview ? 0.4 : 0.15}
          roughness={0.65}
          metalness={0.45}
        />
      </mesh>

      {/* Superstructure */}
      {superstructure.map((part, i) => (
        <mesh key={i} position={part.pos} castShadow>
          {part.shape === 'cylinder'
            ? <cylinderGeometry args={[part.args[0], part.args[0], part.args[1], 10]} />
            : <boxGeometry args={part.args} />
          }
          <meshStandardMaterial
            color={part.color}
            roughness={part.roughness}
            metalness={part.metalness}
            emissive="#0a1218"
            emissiveIntensity={0.06}
          />
        </mesh>
      ))}

      {showWake && !isPreview && <ShipWake length={size} isHorizontal={isHorizontal} />}
      {damage > 0 && !isPreview && <ShipDamageFX intensity={damage} />}
    </group>
  );
}
