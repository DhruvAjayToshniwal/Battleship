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
  const barDepth = 0.2;
  const barHeight = 0.12;
  const longLength = size + barDepth * 2;
  const cornerSize = barDepth + 0.06;

  const bars: { pos: [number, number, number]; args: [number, number, number] }[] = [
    { pos: [0, barHeight / 2, -half - barDepth / 2], args: [longLength, barHeight, barDepth] },
    { pos: [0, barHeight / 2, half + barDepth / 2], args: [longLength, barHeight, barDepth] },
    { pos: [-half - barDepth / 2, barHeight / 2, 0], args: [barDepth, barHeight, longLength] },
    { pos: [half + barDepth / 2, barHeight / 2, 0], args: [barDepth, barHeight, longLength] },
  ];

  const corners: [number, number][] = [
    [-half - barDepth / 2, -half - barDepth / 2],
    [half + barDepth / 2, -half - barDepth / 2],
    [-half - barDepth / 2, half + barDepth / 2],
    [half + barDepth / 2, half + barDepth / 2],
  ];

  return (
    <group>
      {bars.map((bar, i) => (
        <mesh key={`bar-${i}`} position={bar.pos}>
          <boxGeometry args={bar.args} />
          <meshStandardMaterial
            color={color}
            emissive={glowColor}
            emissiveIntensity={0.4}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}

      {bars.map((bar, i) => (
        <mesh key={`trim-${i}`} position={[bar.pos[0], barHeight + 0.005, bar.pos[2]]}>
          <boxGeometry args={[bar.args[0], 0.01, bar.args[2]]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {corners.map(([x, z], i) => (
        <group key={`corner-${i}`}>
          <mesh position={[x, barHeight / 2, z]}>
            <boxGeometry args={[cornerSize, barHeight + 0.02, cornerSize]} />
            <meshStandardMaterial
              color={color}
              emissive={glowColor}
              emissiveIntensity={0.6}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[x, barHeight + 0.015, z]}>
            <boxGeometry args={[cornerSize * 0.6, 0.03, cornerSize * 0.6]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
