import * as THREE from 'three'

function createRadarMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#00ff88') },
      uSweepSpeed: { value: 1.5 },
      uRingCount: { value: 4 },
      uOpacity: { value: 0.6 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uSweepSpeed;
      uniform float uRingCount;
      uniform float uOpacity;
      varying vec2 vUv;

      #define PI 3.14159265

      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float angle = atan(center.y, center.x);

        float sweepAngle = mod(uTime * uSweepSpeed, 2.0 * PI) - PI;
        float angleDiff = mod(angle - sweepAngle + PI, 2.0 * PI) - PI;
        float sweep = smoothstep(0.8, 0.0, abs(angleDiff)) * smoothstep(0.5, 0.0, dist);

        float rings = 0.0;
        for (float i = 1.0; i <= 4.0; i++) {
          if (i > uRingCount) break;
          float r = i / (uRingCount + 1.0);
          rings += smoothstep(0.008, 0.0, abs(dist - r * 0.5)) * 0.4;
        }

        float crossH = smoothstep(0.003, 0.0, abs(center.y)) * smoothstep(0.5, 0.4, dist) * 0.3;
        float crossV = smoothstep(0.003, 0.0, abs(center.x)) * smoothstep(0.5, 0.4, dist) * 0.3;

        float centerDot = smoothstep(0.02, 0.01, dist) * (0.8 + 0.2 * sin(uTime * 3.0));

        float alpha = (sweep + rings + crossH + crossV + centerDot) * uOpacity;
        alpha *= smoothstep(0.5, 0.45, dist);

        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

export { createRadarMaterial }
