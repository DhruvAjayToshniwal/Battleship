
interface BoardFrameProps {
  size?: number;
  color?: string;
  glowColor?: string;
}

export default function BoardFrame({
  size = 10,
  color = '#1e3a5f',
  glowColor = '#38bdf8',
}: BoardFrameProps) {
  const half = size / 2;
  const barDepth = 0.15;
  const barHeight = 0.08;
  const longLength = size + 0.4;

  return (
    <group>
      <mesh position={[0, barHeight / 2, -half - barDepth / 2]}>
        <boxGeometry args={[longLength, barHeight, barDepth]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh position={[0, barHeight / 2, half + barDepth / 2]}>
        <boxGeometry args={[longLength, barHeight, barDepth]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh position={[-half - barDepth / 2, barHeight / 2, 0]}>
        <boxGeometry args={[barDepth, barHeight, longLength]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh position={[half + barDepth / 2, barHeight / 2, 0]}>
        <boxGeometry args={[barDepth, barHeight, longLength]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      {[
        [-half - barDepth / 2, -half - barDepth / 2],
        [half + barDepth / 2, -half - barDepth / 2],
        [-half - barDepth / 2, half + barDepth / 2],
        [half + barDepth / 2, half + barDepth / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, barHeight / 2, z]}>
          <boxGeometry args={[0.2, 0.12, 0.2]} />
          <meshStandardMaterial
            color={color}
            emissive={glowColor}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
