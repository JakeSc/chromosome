import { useRef, useCallback } from 'react';
import * as THREE from 'three';

interface WaveSource {
  x: number;
  y: number;
  amplitude: number;
  frequency: number;
  startTime: number;
  decay: number;
}

export function useWaveSystem(gridSize: number = 64) {
  const waveSourcesRef = useRef<WaveSource[]>([]);
  const heightFieldRef = useRef<Float32Array>(new Float32Array(gridSize * gridSize));
  const previousHeightRef = useRef<Float32Array>(new Float32Array(gridSize * gridSize));
  const velocityFieldRef = useRef<Float32Array>(new Float32Array(gridSize * gridSize));

  // Wave physics constants
  const waveSpeed = 0.3;
  const damping = 0.995;
  const dt = 0.016; // ~60fps

  const addWaveSource = useCallback((x: number, y: number, amplitude: number = 1.0) => {
    // Convert normalized coordinates (-1 to 1) to grid coordinates
    const gridX = Math.floor((x + 1) * 0.5 * (gridSize - 1));
    const gridY = Math.floor((y + 1) * 0.5 * (gridSize - 1));
    
    // Clamp to grid bounds
    const clampedX = Math.max(0, Math.min(gridSize - 1, gridX));
    const clampedY = Math.max(0, Math.min(gridSize - 1, gridY));

    const newSource: WaveSource = {
      x: clampedX,
      y: clampedY,
      amplitude,
      frequency: 2.0,
      startTime: performance.now() / 1000,
      decay: 0.95,
    };

    waveSourcesRef.current.push(newSource);

    // Limit concurrent wave sources
    if (waveSourcesRef.current.length > 10) {
      waveSourcesRef.current.shift();
    }
  }, [gridSize]);

  const updateWaves = useCallback((time: number) => {
    const heightField = heightFieldRef.current;
    const previousHeight = previousHeightRef.current;
    const velocityField = velocityFieldRef.current;
    
    // Copy current height to previous
    for (let i = 0; i < heightField.length; i++) {
      previousHeight[i] = heightField[i];
    }

    // Reset height field
    heightField.fill(0);

    // Add ambient waves (gentle Perlin-like motion)
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const index = y * gridSize + x;
        const nx = x / gridSize;
        const ny = y / gridSize;
        
        // Simple ambient wave pattern
        const ambient = Math.sin(nx * 4 + time * 0.5) * Math.cos(ny * 3 + time * 0.3) * 0.02;
        heightField[index] += ambient;
      }
    }

    // Process wave sources (expanding circular ripples)
    waveSourcesRef.current = waveSourcesRef.current.filter(source => {
      const elapsed = time - source.startTime;
      if (elapsed > 8.0) return false; // Remove old sources

      const currentAmplitude = source.amplitude * Math.pow(source.decay, elapsed);
      if (currentAmplitude < 0.001) return false;

      // Create expanding circular wave
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const dx = x - source.x;
          const dy = y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const wavePosition = distance - elapsed * waveSpeed * 10;
          
          if (Math.abs(wavePosition) < 3.0) {
            const index = y * gridSize + x;
            const wave = currentAmplitude * Math.sin(wavePosition * source.frequency) * 
                        Math.exp(-distance * 0.08) * // Distance decay
                        Math.exp(-Math.abs(wavePosition) * 0.3) * // Wave packet
                        Math.exp(-elapsed * 0.5); // Time decay
            heightField[index] += wave * 0.5; // Reduce overall amplitude
          }
        }
      }
      
      return true;
    });

    // Apply wave equation for realistic physics
    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        const index = y * gridSize + x;
        
        // Laplacian (curvature) calculation
        const laplacian = (
          previousHeight[(y-1) * gridSize + x] + // up
          previousHeight[(y+1) * gridSize + x] + // down
          previousHeight[y * gridSize + (x-1)] + // left
          previousHeight[y * gridSize + (x+1)] - // right
          4 * previousHeight[index]
        );
        
        // Wave equation: acceleration = waveSpeed² * curvature
        const acceleration = waveSpeed * waveSpeed * laplacian;
        velocityField[index] = (velocityField[index] + acceleration * dt) * damping;
        heightField[index] += velocityField[index] * dt;
      }
    }

    return heightField;
  }, [gridSize]);

  return {
    addWaveSource,
    updateWaves,
    heightField: heightFieldRef.current,
  };
}