import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface FogControllerProps {
  near: number
  far: number
  color?: string
}

export default function FogController({ near, far, color = '#0a0e1a' }: FogControllerProps) {
  const { scene } = useThree()

  useEffect(() => {
    try {
      scene.fog = new THREE.Fog(color, near, far)
    } catch (e) {
      console.error('Failed to set scene fog:', e)
    }

    return () => {
      scene.fog = null
    }
  }, [scene, near, far, color])

  return null
}
