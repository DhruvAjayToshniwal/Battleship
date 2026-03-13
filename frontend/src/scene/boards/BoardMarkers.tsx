interface BoardMarkersProps {
  size?: number;
}

export default function BoardMarkers({ size = 10 }: BoardMarkersProps) {
  const half = size / 2;

  return (
    <group>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={`col-${i}`} position={[i - half + 0.5, 0.06, -half - 0.3]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#22d3ee"
            emissive="#22d3ee"
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}

      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={`row-${i}`} position={[-half - 0.3, 0.06, i - half + 0.5]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}
