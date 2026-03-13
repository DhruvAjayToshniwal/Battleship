import * as THREE from 'three'

export default function LightingRig() {
  return (
    <>
      <directionalLight
        color="#b4c6e7"
        intensity={1.5}
        position={[15, 25, 10]}
        castShadow
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <directionalLight
        color="#ffd4a3"
        intensity={0.15}
        position={[-10, 8, -5]}
      />

      <directionalLight
        color="#38bdf8"
        intensity={0.3}
        position={[-5, 10, -15]}
      />

      <hemisphereLight
        args={[new THREE.Color('#1a2a4a'), new THREE.Color('#0a0a1a'), 0.4]}
      />
    </>
  )
}
