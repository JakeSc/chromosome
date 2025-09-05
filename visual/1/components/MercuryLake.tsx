'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
uniform float time;
uniform vec2 mouse;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  
  // Convert UV to world coordinates
  vec2 worldPos = (uv - 0.5) * 30.0;
  
  // Create gentle ambient waves
  float wave1 = sin(worldPos.x * 0.5 + time * 0.8) * 0.05;
  float wave2 = sin(worldPos.y * 0.3 + time * 0.6) * 0.03;
  float wave3 = sin((worldPos.x + worldPos.y) * 0.2 + time * 0.4) * 0.02;
  
  // Add ripple from mouse position
  vec2 mouseWorld = mouse * 15.0;
  float distToMouse = length(worldPos - mouseWorld);
  float ripple = sin(distToMouse * 2.0 - time * 3.0) * exp(-distToMouse * 0.1) * 0.08;
  
  // Combine all waves
  float height = wave1 + wave2 + wave3 + ripple;
  
  // Apply displacement
  vec3 newPosition = position;
  newPosition.z += height;
  
  // Calculate smooth normals
  float eps = 0.1;
  float heightL = sin((worldPos.x - eps) * 0.5 + time * 0.8) * 0.05 + 
                  sin(worldPos.y * 0.3 + time * 0.6) * 0.03;
  float heightR = sin((worldPos.x + eps) * 0.5 + time * 0.8) * 0.05 + 
                  sin(worldPos.y * 0.3 + time * 0.6) * 0.03;
  float heightD = sin(worldPos.x * 0.5 + time * 0.8) * 0.05 + 
                  sin((worldPos.y - eps) * 0.3 + time * 0.6) * 0.03;
  float heightU = sin(worldPos.x * 0.5 + time * 0.8) * 0.05 + 
                  sin((worldPos.y + eps) * 0.3 + time * 0.6) * 0.03;
  
  vec3 normal = normalize(vec3(heightL - heightR, heightD - heightU, eps * 2.0));
  vNormal = normalMatrix * normal;
  vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform float time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 reflectDir = reflect(-viewDir, vNormal);
  
  // Strong Fresnel for mercury-like reflectivity
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
  
  // Mercury base color - very reflective silver
  vec3 mercuryColor = vec3(0.9, 0.92, 0.95);
  
  // Environment reflection simulation
  vec3 envColor = vec3(0.15, 0.25, 0.4);
  vec3 skyReflection = mix(envColor, vec3(0.7, 0.8, 1.0), reflectDir.y * 0.5 + 0.5);
  
  // High reflectivity - mercury reflects almost everything
  vec3 finalColor = mix(mercuryColor * 0.2, skyReflection, 0.9);
  
  // Add metallic highlights
  float highlight = pow(max(dot(reflectDir, normalize(vec3(0.5, 1.0, 0.5))), 0.0), 64.0);
  finalColor += vec3(1.0) * highlight * 0.6;
  
  // Mercury is highly opaque
  float alpha = mix(0.95, 0.8, fresnel);
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

function MercuryLakeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mousePos = useRef(new THREE.Vector2(0, 0));
  
  // Create geometry and material
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(30, 30, 200, 200);
  }, []);
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mouse: { value: mousePos.current },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);
  
  // Animation loop
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Update shader uniforms
    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.time.value = time;
      material.uniforms.mouse.value = mousePos.current;
    }
    
    // Keep plane horizontal
    if (meshRef.current) {
      meshRef.current.rotation.x = -Math.PI / 2;
    }
  });
  
  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
}

export default function MercuryLake() {
  return (
    <div className="fixed inset-0 w-full h-full bg-slate-900">
      <Canvas
        camera={{
          position: [0, 8, 15],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        style={{ background: 'linear-gradient(to bottom, #1e293b, #0f172a)' }}
      >
        {/* Lighting setup for mercury reflections */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 15, 10]}
          intensity={2.0}
          castShadow
        />
        <pointLight position={[-5, 10, 8]} intensity={1.5} color="#ffffff" />
        <pointLight position={[8, 12, -3]} intensity={1.0} color="#e0e6ff" />

        {/* Mercury lake surface */}
        <MercuryLakeMesh />
      </Canvas>
    </div>
  );
}