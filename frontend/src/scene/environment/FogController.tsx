import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FogControllerProps {
  near?: number;
  far?: number;
  color?: string;
}

export default function FogController({
  near = 20,
  far = 60,
  color = '#0a0e1a',
}: FogControllerProps) {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.Fog(color, near, far);

    return () => {
      scene.fog = null;
    };
  }, [scene, near, far, color]);

  return null;
}
