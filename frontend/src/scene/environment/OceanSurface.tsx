import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createOceanMaterial } from '../materials/oceanMaterial'

interface OceanSurfaceProps {
  position?: [number, number, number]
  size?: [number, number]
  segments?: number
}

export default function OceanSurface({
  position = [0, 0, 0],
  size = [80, 80],
  segments = 192,
}: OceanSurfaceProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const material = useMemo(() => {
    try {
      return createOceanMaterial()
    } catch (e) {
      console.error('Failed to create ocean material:', e)
      return new THREE.MeshStandardMaterial({ color: '#0a2a4a' }) as unknown as THREE.ShaderMaterial
    }
  }, [])

  useFrame(({ clock }) => {
    if (materialRef.current && materialRef.current.uniforms && materialRef.current.uniforms.uTime) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size[0], size[1], segments, segments]} />
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  )
}
