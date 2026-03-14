import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
  fresnel = pow(fresnel, 3.0);

  vec3 hazeColor = vec3(0.06, 0.07, 0.10);

  float baseOpacity = 0.05;
  float fresnelOpacity = fresnel * 0.08;
  float totalOpacity = baseOpacity + fresnelOpacity;

  totalOpacity = clamp(totalOpacity, 0.0, 0.12);

  gl_FragColor = vec4(hazeColor, totalOpacity);
}
`

export default function Atmosphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh>
      <sphereGeometry args={[85, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  )
}
