'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
uniform float time;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  
  // Add very subtle vertex displacement for liquid glass effect
  vec3 newPosition = position;
  float displacement = sin(position.x * 4.0 + time * 0.5) * sin(position.y * 3.0 + time * 0.3) * sin(position.z * 5.0 + time * 0.4);
  newPosition += normal * displacement * 0.005;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform float time;
uniform samplerCube envMap;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 normal = normalize(vNormal);
  
  // Fresnel effect for glass-like transparency
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  
  // Refraction effect
  vec3 refracted = refract(-viewDir, normal, 0.9);
  vec3 reflected = reflect(-viewDir, normal);
  
  // Sample environment for reflections and refractions
  vec3 reflectionColor = vec3(0.8, 0.9, 1.0); // Simplified sky color
  vec3 refractionColor = vec3(0.9, 0.95, 1.0); // Slightly tinted
  
  // Add chromatic aberration for liquid glass effect
  float aberration = 0.02;
  vec3 refractedR = refract(-viewDir, normal, 0.9 - aberration);
  vec3 refractedG = refract(-viewDir, normal, 0.9);
  vec3 refractedB = refract(-viewDir, normal, 0.9 + aberration);
  
  // Simulate chromatic dispersion
  vec3 chromaticColor = vec3(
    dot(refractedR, vec3(1.0, 0.8, 0.9)),
    dot(refractedG, vec3(0.8, 1.0, 0.9)),
    dot(refractedB, vec3(0.8, 0.9, 1.0))
  ) * 0.5 + 0.5;
  
  // Subtle surface variation instead of harsh facets
  float surfaceNoise = sin(vWorldPosition.x * 8.0) * sin(vWorldPosition.y * 6.0) * sin(vWorldPosition.z * 10.0);
  surfaceNoise = surfaceNoise * 0.5 + 0.5; // Normalize to 0-1
  surfaceNoise = smoothstep(0.3, 0.8, surfaceNoise) * 0.3; // Subtle effect
  
  // Liquid glass base color with subtle shimmer
  vec3 baseColor = vec3(0.95, 0.98, 1.0);
  vec3 shimmer = vec3(
    sin(time * 2.0 + vWorldPosition.x * 10.0) * 0.1 + 0.9,
    sin(time * 2.3 + vWorldPosition.y * 12.0) * 0.1 + 0.9,
    sin(time * 1.8 + vWorldPosition.z * 8.0) * 0.1 + 0.9
  );
  
  // Combine effects
  vec3 finalColor = mix(
    chromaticColor * baseColor * shimmer,
    reflectionColor,
    fresnel * 0.6
  );
  
  // Add subtle surface highlights
  finalColor += vec3(1.0) * surfaceNoise * 0.2 * (1.0 - fresnel);
  
  // Adaptive transparency - more opaque at edges, transparent in center
  float alpha = mix(0.15, 0.8, fresnel);
  
  // Add subtle color shifts based on viewing angle
  vec3 colorShift = vec3(
    0.5 + 0.5 * sin(time + fresnel * 3.0),
    0.8 + 0.2 * cos(time * 0.8 + fresnel * 2.0),
    0.9 + 0.1 * sin(time * 1.2 + fresnel * 4.0)
  );
  
  finalColor *= colorShift;
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

function LiquidGlassSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  // Create smooth sphere geometry
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(2, 64, 32); // Smooth sphere
  }, []);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
  }, []);
  
  // Animation loop
  useFrame(({ clock, camera }) => {
    const time = clock.getElapsedTime();
    
    if (sphereRef.current) {
      // Floating animation
      sphereRef.current.position.y = Math.sin(time * 0.8) * 0.5;
      
      // Rotating animation
      sphereRef.current.rotation.x = time * 0.3;
      sphereRef.current.rotation.y = time * 0.5;
      sphereRef.current.rotation.z = time * 0.2;
    }
    
    // Update shader uniforms
    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.time.value = time;
    }
  });
  
  return (
    <mesh ref={sphereRef} geometry={geometry} material={material} />
  );
}

export default function LiquidGlassScene() {
  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-slate-800 to-slate-950">
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        {/* Ambient lighting for glass material */}
        <ambientLight intensity={0.4} />
        
        {/* Multiple lights for complex reflections */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.5}
          color="#ffffff"
        />
        <directionalLight
          position={[-3, 2, -4]}
          intensity={0.8}
          color="#e0f0ff"
        />
        <pointLight 
          position={[0, 3, 0]} 
          intensity={1.2} 
          color="#fff8e1" 
        />

        {/* Liquid Glass Sphere */}
        <LiquidGlassSphere />
      </Canvas>
    </div>
  );
}