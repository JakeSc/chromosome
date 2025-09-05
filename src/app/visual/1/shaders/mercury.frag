uniform vec3 cameraPosition;
uniform float time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  // Base mercury color
  vec3 baseColor = vec3(0.9, 0.9, 0.95);
  
  // Calculate view direction
  vec3 viewDir = normalize(cameraPosition - vPosition);
  
  // Simple Fresnel effect
  float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);
  
  // Reflection simulation (simplified)
  vec3 reflectDir = reflect(-viewDir, vNormal);
  vec3 skyColor = vec3(0.5, 0.7, 1.0); // Simple sky color
  
  // Combine base color with reflection
  vec3 finalColor = mix(baseColor, skyColor, fresnel * 0.6);
  
  // Add metallic sheen
  float metallic = 0.9;
  finalColor = mix(finalColor, vec3(1.0), metallic * fresnel * 0.3);
  
  // Transparency based on viewing angle
  float alpha = 0.85 + fresnel * 0.15;
  
  gl_FragColor = vec4(finalColor, alpha);
}