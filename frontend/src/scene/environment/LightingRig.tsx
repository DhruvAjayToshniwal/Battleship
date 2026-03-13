export default function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.25} />

      <directionalLight
        position={[15, 25, 10]}
        intensity={0.9}
        color="#b4c6d4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <directionalLight position={[-10, 15, -10]} intensity={0.15} color="#38bdf8" />

      <directionalLight position={[0, 8, -20]} intensity={0.12} color="#fbbf24" />

      <hemisphereLight args={['#1e3a5f', '#0a0e1a', 0.25]} />
    </>
  );
}
