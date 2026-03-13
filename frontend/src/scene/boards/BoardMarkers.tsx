import { Text } from '@react-three/drei';

interface BoardMarkersProps {
  size?: number;
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const MARKER_COLOR = '#64748b';

export default function BoardMarkers({ size = 10 }: BoardMarkersProps) {
  const half = size / 2;

  return (
    <group>
      {COLUMNS.map((letter, i) => (
        <group key={`col-${i}`} position={[i - half + 0.5, 0.06, -half - 0.45]}>
          <mesh>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color={MARKER_COLOR}
              emissive={MARKER_COLOR}
              emissiveIntensity={0.3}
              transparent
              opacity={0.6}
            />
          </mesh>
          <Text
            position={[0, 0.12, 0]}
            fontSize={0.18}
            color={MARKER_COLOR}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.5}
          >
            {letter}
          </Text>
        </group>
      ))}

      {Array.from({ length: 10 }, (_, i) => (
        <group key={`row-${i}`} position={[-half - 0.45, 0.06, i - half + 0.5]}>
          <mesh>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color={MARKER_COLOR}
              emissive={MARKER_COLOR}
              emissiveIntensity={0.3}
              transparent
              opacity={0.6}
            />
          </mesh>
          <Text
            position={[-0.12, 0.0, 0]}
            fontSize={0.18}
            color={MARKER_COLOR}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.5}
          >
            {String(i + 1)}
          </Text>
        </group>
      ))}
    </group>
  );
}
