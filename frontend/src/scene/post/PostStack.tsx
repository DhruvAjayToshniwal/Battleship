import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

interface PostStackProps {
  enableBloom?: boolean;
  enableVignette?: boolean;
}

export default function PostStack({
  enableBloom = true,
  enableVignette = true,
}: PostStackProps) {
  return (
    <EffectComposer>
      {enableBloom && (
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      )}
      {enableVignette && (
        <Vignette
          offset={0.3}
          darkness={0.6}
        />
      )}
    </EffectComposer>
  );
}
