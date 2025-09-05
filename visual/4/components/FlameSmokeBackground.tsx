'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'

function FullscreenFlame() {
  const mesh = useRef<THREE.Mesh>(null)
  const { size, gl } = useThree()

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uIntensity: { value: 1.0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uIntensity;

        // Hash/Noise helpers
        float hash(vec2 p){
          // Scalar hash in [-1,1]
          float h = fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          return h * 2.0 - 1.0;
        }
        float noise(in vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f*f*(3.0-2.0*f);
          float a = hash(i+vec2(0.0,0.0));
          float b = hash(i+vec2(1.0,0.0));
          float c = hash(i+vec2(0.0,1.0));
          float d = hash(i+vec2(1.0,1.0));
          return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
        }
        float fbm(vec2 p){
          float v=0.0; float a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
          for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=0.5; }
          return v;
        }

        // Directional flow noise for wispy movement
        vec3 palette(float t){
          // Lighter, purple/red forward palette
          vec3 magenta = vec3(0.95, 0.20, 0.80);
          vec3 purple  = vec3(0.78, 0.65, 1.00);
          vec3 orange  = vec3(1.00, 0.55, 0.30);
          vec3 col = mix(magenta, purple, smoothstep(0.0, 0.6, t));
          col = mix(col, orange,  smoothstep(0.35, 1.0, t));
          return col;
        }

        void main(){
          vec2 uv = vUv;
          // center and aspect
          vec2 p = (gl_FragCoord.xy/uResolution.xy);
          p -= 0.5;
          p.x *= uResolution.x/uResolution.y;

          // Flow direction (left->right)
          vec2 dir = normalize(vec2(1.0, 0.25));

          // Domain-warped fbm to create elongated wisps (previous look)
          // Slow down overall motion
          float t = uTime * 0.08;
          vec2 q = vec2( fbm(p*2.0 + dir*t*1.2), fbm(p*2.0 - dir*t*1.2));
          vec2 r = p*3.0 + 2.0*q + dir*t*3.5;
          float f = fbm(r);
          // Sharpen into wisps by measuring local change
          float df = fbm(r + vec2(0.12, -0.08));
          float wisp = smoothstep(0.35, 0.8, f*1.2 - df*0.5);

          // Color mapping and glow similar to earlier pass
          vec3 col = palette(f);
          float glow = smoothstep(0.72, 1.0, f) + smoothstep(0.6,1.0,wisp);
          // Keep colors light and vibrant
          col = col * (0.9 + 0.6*wisp) + glow*0.18;
          col = pow(col, vec3(0.9));

          // Soft vignette
          float d = length(p)*0.9;
          col *= smoothstep(1.1, 0.2, d);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const dpr = gl.getPixelRatio()
    ;(material.uniforms.uTime.value as number) = t
    ;(material.uniforms.uResolution.value as THREE.Vector2).set(size.width * dpr, size.height * dpr)
  })

  return <mesh ref={mesh} geometry={geometry} material={material} />
}

export default function FlameSmokeBackground() {
  return (
    <div className="absolute inset-0 -z-30">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 1], fov: 50, near: 0.1, far: 10 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <FullscreenFlame />
      </Canvas>
    </div>
  )
}
