'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type Droplet = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  bornAt: number;
  base?: boolean; // base core droplet
};

const MAX_SPHERES = 1; // only base sphere now

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform mat4 uInvProjection;
uniform mat4 uInvView;

uniform int uCount;
// Each sphere: xyz = center, w = radius
#define MAX_SPHERES ${MAX_SPHERES}
uniform vec4 uSpheres[MAX_SPHERES];

uniform vec3 uEnvTop;
uniform vec3 uEnvMid;
uniform vec3 uEnvBot;
uniform float uExposure;
uniform vec3 uRippleDir; // direction of traveling ripple
uniform float uRippleAmp; // amplitude
uniform float uRippleFreq; // spatial frequency
uniform float uRippleSpeed; // temporal speed

// Smooth min (polynomial)
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5*(b - a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0 - h);
}

float map(in vec3 p, out float matID) {
  matID = 1.0; // only one material (metal)
  float d = 1e9;
  float k = 0.45; // smoothing amount

  // Union of spheres via smooth min
  for (int i = 0; i < MAX_SPHERES; i++) {
    if (i >= uCount) break;
    vec3 c = uSpheres[i].xyz;
    float r = uSpheres[i].w;
    float sd = length(p - c) - r;

    // Continuous subtle directional ripple on base sphere
    if (i == 0) {
      vec3 pc = p - c;
      float lenpc = length(pc) + 1e-6;
      vec3 n = pc / lenpc;
      vec3 dir = normalize(uRippleDir);
      // Project normal along direction to get phase; higher contrast near facing side
      float proj = dot(n, dir);
      float phase = uRippleSpeed * uTime + uRippleFreq * proj;
      float falloff = smoothstep(-1.0, -0.2, proj) * 0.25 + smoothstep(-0.2, 1.0, proj); // biased to one side
      float disp = uRippleAmp * falloff * sin(phase);
      sd -= disp;
    }
    d = (i == 0) ? sd : smin(d, sd, k);
  }

  return d;
}

vec3 calcNormal(in vec3 p) {
  // Tetrahedron normal approximation
  const float h = 0.00075;
  const vec2 k = vec2(1.0, -1.0);
  float m;
  vec3 n = k.xyy * map(p + k.xyy*h, m) +
           k.yyx * map(p + k.yyx*h, m) +
           k.yxy * map(p + k.yxy*h, m) +
           k.xxx * map(p + k.xxx*h, m);
  return normalize(n);
}

// Simple hash for dithering
float hash(vec2 p) {
  p = fract(p*vec2(123.34, 345.45));
  p += dot(p, p+34.345);
  return fract(p.x*p.y);
}

// Raymarcher
bool raymarch(in vec3 ro, in vec3 rd, out vec3 pos, out vec3 nor, out float t) {
  float m;
  t = 0.0;
  float maxDist = 50.0;
  float eps = 0.0006; // slightly tighter to reduce banding at hit
  float dither = (hash(vUv * uResolution) - 0.5) * 0.0015;

  for (int i = 0; i < 180; i++) {
    vec3 p = ro + rd * t;
    float dist = map(p, m);
    if (dist < eps) {
      // Refine hit to reduce contour banding
      float tRef = t;
      for (int j = 0; j < 6; j++) {
        vec3 pr = ro + rd * tRef;
        float dr = map(pr, m);
        tRef += dr * 0.8; // under-relaxation for stability
      }
      pos = ro + rd * tRef;
      nor = calcNormal(pos);
      return true;
    }
    t += max(dist + dither, 0.0005);
    if (t > maxDist) break;
  }
  return false;
}

// Procedural environment for mirror-like reflections (bright horizon + soft sky + area panels)
vec3 envColor(vec3 dir) {
  dir = normalize(dir);
  float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 top = uEnvTop; // sky tint
  vec3 mid = uEnvMid; // mid tone
  vec3 bot = uEnvBot; // ground tint

  // Base vertical gradient
  vec3 col = mix(bot, mid, smoothstep(0.0, 0.5, h));
  col = mix(col, top, smoothstep(0.5, 1.0, h));

  // Bright horizon line to sell chrome reflections (reduced to avoid ring artifacts)
  float horizon = exp(-20.0 * abs(dir.y));
  col += vec3(0.9, 0.95, 1.0) * horizon * 0.55;

  // Large soft studio panels (non-repeating)
  vec3 p1 = normalize(vec3(0.25, 0.88, 0.25));
  vec3 p2 = normalize(vec3(-0.55, 0.72, -0.2));
  vec3 p3 = normalize(vec3(0.1, 0.6, -0.85));
  float w1 = smoothstep(0.96, 0.995, dot(dir, p1));
  float w2 = smoothstep(0.965, 0.995, dot(dir, p2));
  float w3 = smoothstep(0.97, 0.996, dot(dir, p3));
  col += (w1 * vec3(1.0) * 0.55) + (w2 * vec3(0.95) * 0.40) + (w3 * vec3(0.9) * 0.30);

  return clamp(col, 0.0, 1.0);
}

void main(){
  // NDC coords
  vec2 p = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
  // Robust ray reconstruction
  vec4 rayClip = vec4(p, -1.0, 1.0);
  vec4 rayEye = uInvProjection * rayClip;
  rayEye = vec4(rayEye.xy, -1.0, 0.0);
  vec3 rd = normalize((uInvView * rayEye).xyz);
  vec3 ro = (uInvView * vec4(0.0, 0.0, 0.0, 1.0)).xyz; // camera position

  vec3 pos, nor; float t;
  vec3 col;
  if (raymarch(ro, rd, pos, nor, t)) {
    // Metallic shading with Fresnel and reflections
    vec3 V = normalize(ro - pos);
    vec3 R = reflect(-V, nor);
    float ndv = clamp(dot(nor, V), 0.0, 1.0);

    // Schlick Fresnel
    vec3 F0 = vec3(0.997); // ultra reflective
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);

    vec3 env = envColor(R);

    // Base tint (very subtle, mostly reflection)
    vec3 base = vec3(0.99);

    // Highlights (two fake lights)
    vec3 L1 = normalize(vec3(0.6, 0.8, 0.4));
    vec3 L2 = normalize(vec3(-0.3, 0.7, -0.6));
    float spec1 = pow(max(dot(reflect(-L1, nor), V), 0.0), 320.0);
    float spec2 = pow(max(dot(reflect(-L2, nor), V), 0.0), 280.0);
    float ao = 0.8 + 0.2*clamp(dot(nor, vec3(0.0,1.0,0.0)), 0.0, 1.0);

    // Mirror-weighted color
    col = mix(base*0.005, env, 0.9995) * ao + (spec1 * 0.7 + spec2 * 0.45) * vec3(1.0);

    // Fresnel edge sheen and clearcoat-like boost
    col = mix(col, env, F * 0.6);

    // Exposure + simple filmic tone mapping
    col = 1.0 - exp(-col * uExposure);
  } else {
    // Background/sky
    col = envColor(rd);
    gl_FragColor = vec4(col, 0.0); // transparent background to show page gradient
    return;
  }

  // Vignette
  float d = length(vUv - 0.5);
  col *= 1.0 - smoothstep(0.6, 1.0, d);

  // Subtle final-color dithering to fight banding on smooth gradients
  float n = hash(gl_FragCoord.xy);
  col += (n - 0.5) * 0.003;

  gl_FragColor = vec4(col, 1.0);
}
`;

function FullscreenRaymarch({ droplets }: { droplets: React.MutableRefObject<Droplet[]> }) {
  const planeRef = useRef<THREE.Mesh>(null);
  const { camera, size, gl } = useThree();

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uInvProjection: { value: new THREE.Matrix4() },
      uInvView: { value: new THREE.Matrix4() },
      uCount: { value: 0 },
      uSpheres: { value: Array.from({ length: MAX_SPHERES }, () => new THREE.Vector4(0, 0, 0, 0)) },
      // Brighter studio-like environment
      uEnvTop: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
      uEnvMid: { value: new THREE.Vector3(0.88, 0.95, 1.0) },
      uEnvBot: { value: new THREE.Vector3(0.22, 0.28, 0.4) },
      uExposure: { value: 2.05 },
      uRippleDir: { value: new THREE.Vector3(0.3, 0.8, 0.0) },
      uRippleAmp: { value: 0.02 },
      uRippleFreq: { value: 12.0 },
      uRippleSpeed: { value: 3.0 },
    },
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Update camera inverse matrices
    material.uniforms.uInvProjection.value.copy((camera as THREE.PerspectiveCamera).projectionMatrixInverse);
    material.uniforms.uInvView.value.copy(camera.matrixWorld);

    // Update resolution
    // Account for device pixel ratio to avoid quadrant scaling issues
    const dpr = gl.getPixelRatio();
    material.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr);

    // Update time
    material.uniforms.uTime.value = t;

    // Pack droplets into uniforms
    const arr = droplets.current;
    const count = Math.min(arr.length, MAX_SPHERES);
    material.uniforms.uCount.value = count;
    const spheres = material.uniforms.uSpheres.value as THREE.Vector4[];
    for (let i = 0; i < MAX_SPHERES; i++) {
      if (i < count) {
        const d = arr[i];
        spheres[i] = new THREE.Vector4(d.position.x, d.position.y, d.position.z, d.radius);
      } else {
        spheres[i] = new THREE.Vector4(0, 100.0, 0, 0); // push far away
      }
    }
    material.uniforms.uSpheres.value = spheres;

    // Nothing else to pack
  });

  return <mesh ref={planeRef} geometry={geometry} material={material} />;
}

// No Physics component anymore — just a single sphere

function CameraRig() {
  const { camera, gl } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const spherical = useRef({ r: 4, phi: Math.PI / 2, theta: 0 });
  const targetAngles = useRef({ phi: Math.PI / 2, theta: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: MouseEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => (dragging.current = false);
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      const sensitivity = 0.0022;
      targetAngles.current.theta += -dx * sensitivity;
      targetAngles.current.phi += dy * sensitivity;
      // Clamp angles to a tight window
      const minPhi = Math.PI / 2 - 0.09;
      const maxPhi = Math.PI / 2 + 0.07;
      const minTheta = -0.14;
      const maxTheta = 0.14;
      targetAngles.current.phi = Math.min(maxPhi, Math.max(minPhi, targetAngles.current.phi));
      targetAngles.current.theta = Math.min(maxTheta, Math.max(minTheta, targetAngles.current.theta));
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
    };
  }, [gl]);

  useFrame((_s, dt) => {
    // Critically-damped smoothing toward target
    const s = spherical.current;
    s.theta += (targetAngles.current.theta - s.theta) * Math.min(1, dt * 8);
    s.phi += (targetAngles.current.phi - s.phi) * Math.min(1, dt * 8);
    const r = s.r;
    const sinPhi = Math.sin(s.phi);
    camera.position.set(
      r * Math.sin(s.phi) * Math.sin(s.theta),
      r * Math.cos(s.phi),
      r * Math.sin(s.phi) * Math.cos(s.theta)
    );
    camera.lookAt(target.current);
    camera.updateProjectionMatrix();
  });

  return null;
}

export default function T1000Blob() {
  const droplets = useRef<Droplet[]>([]);
  const magnet = useRef(new THREE.Vector3(0, 0, 0));

  // Seed default droplets on mount
  useEffect(() => {
    const now = performance.now();
    droplets.current = [
      { position: new THREE.Vector3(0, 0, 0), velocity: new THREE.Vector3(0, 0, 0), radius: 0.95, bornAt: now, base: true },
    ];
  }, []);

  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 4], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <CameraRig />
        <FullscreenRaymarch droplets={droplets} />
      </Canvas>
    </div>
  );
}
