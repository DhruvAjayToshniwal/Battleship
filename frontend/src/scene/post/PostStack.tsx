import { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

interface PostStackProps {
  enableBloom?: boolean;
  enableVignette?: boolean;
}

export default function PostStack({
  enableBloom = true,
  enableVignette = true,
}: PostStackProps) {
  const { gl } = useThree();
  const [enabled, setEnabled] = useState(false);

  // ACES Filmic tone mapping — better highlight rolloff for dark scenes
  useEffect(() => {
    const prevToneMapping = gl.toneMapping;
    const prevExposure = gl.toneMappingExposure;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    return () => {
      gl.toneMapping = prevToneMapping;
      gl.toneMappingExposure = prevExposure;
    };
  }, [gl]);

  useEffect(() => {
    const timer = setTimeout(() => setEnabled(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!enabled) return null;
  if (!enableBloom && !enableVignette) return null;

  try {
    return (
      <EffectComposer multisampling={0}>
        {enableBloom && (
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.75}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
        )}
        {enableVignette && (
          <Vignette
            offset={0.25}
            darkness={0.8}
          />
        )}
      </EffectComposer>
    );
  } catch {
    return null;
  }
}
