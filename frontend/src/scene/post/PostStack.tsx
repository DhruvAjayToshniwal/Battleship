import { useState, useEffect } from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export default function PostStack() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEnabled(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!enabled) return null;

  try {
    return (
      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.5}
        />
      </EffectComposer>
    );
  } catch {
    return null;
  }
}
