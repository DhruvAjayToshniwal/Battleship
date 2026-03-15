import * as THREE from 'three'

interface LightingRigProps {
  shadowMapSize?: number;
}

export default function LightingRig({ shadowMapSize = 2048 }: LightingRigProps) {
  return (
    <>
      {/* Key moonlight — matches sky moon direction (0.4, 0.7, -0.5) and ocean specular */}
      <directionalLight
        color="#90aac4"
        intensity={1.3}
        position={[8, 20, -12]}
        castShadow
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
      />

      {/* Warm counter-fill from opposite side — separation light */}
      <directionalLight
        color="#b09070"
        intensity={0.08}
        position={[-12, 6, 10]}
      />

      {/* Cool top fill — lifts shadows without flattening */}
      <directionalLight
        color="#4a6a8a"
        intensity={0.12}
        position={[-3, 15, -10]}
      />

      {/* Warm ambient center — gives the boards and mid-scene subtle warmth */}
      <pointLight
        color="#a08060"
        intensity={0.12}
        distance={28}
        position={[0, 1.5, 0]}
        decay={2}
      />

      {/* Hemisphere — blue sky dome, near-black ground bounce */}
      <hemisphereLight
        args={[new THREE.Color('#0e1a28'), new THREE.Color('#030303'), 0.32]}
      />
    </>
  )
}
