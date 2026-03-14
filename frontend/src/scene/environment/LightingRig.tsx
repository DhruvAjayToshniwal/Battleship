import * as THREE from 'three'

interface LightingRigProps {
  shadowMapSize?: number;
}

export default function LightingRig({ shadowMapSize = 2048 }: LightingRigProps) {
  return (
    <>
      <directionalLight
        color="#8a9aaa"
        intensity={1.0}
        position={[15, 25, 10]}
        castShadow
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />

      <directionalLight
        color="#aa9888"
        intensity={0.1}
        position={[-10, 8, -5]}
      />

      <directionalLight
        color="#4a6a7a"
        intensity={0.15}
        position={[-5, 10, -15]}
      />

      <hemisphereLight
        args={[new THREE.Color('#0a1520'), new THREE.Color('#050505'), 0.25]}
      />
    </>
  )
}
