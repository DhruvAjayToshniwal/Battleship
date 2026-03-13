import * as THREE from 'three'

function createBoardGlowMaterial(color: THREE.Color, intensity: number = 0.4): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uIntensity: { value: intensity },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
        fresnel = pow(fresnel, 3.0);

        float edgeGlow = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x)
                       * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
        float rim = 1.0 - edgeGlow;

        float pulse = 0.85 + 0.15 * sin(uTime * 2.0);
        float glow = (fresnel * 0.6 + rim * 0.4) * uIntensity * pulse;

        gl_FragColor = vec4(uColor * glow, glow * 0.8);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

export { createBoardGlowMaterial }
