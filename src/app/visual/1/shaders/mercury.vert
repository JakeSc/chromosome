uniform sampler2D heightMap;
uniform float gridSize;
uniform float time;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  
  // Sample height from wave system
  vec4 heightData = texture2D(heightMap, uv);
  float height = heightData.r;
  
  // Displace vertex position
  vec3 newPosition = position;
  newPosition.z += height * 0.5; // Scale height displacement
  
  // Calculate surface normal by sampling neighboring heights
  vec2 texelSize = vec2(1.0 / gridSize);
  float heightL = texture2D(heightMap, uv - vec2(texelSize.x, 0.0)).r;
  float heightR = texture2D(heightMap, uv + vec2(texelSize.x, 0.0)).r;
  float heightD = texture2D(heightMap, uv - vec2(0.0, texelSize.y)).r;
  float heightU = texture2D(heightMap, uv + vec2(0.0, texelSize.y)).r;
  
  // Calculate gradient
  vec3 normal;
  normal.x = (heightL - heightR) * gridSize * 0.1;
  normal.y = (heightD - heightU) * gridSize * 0.1;
  normal.z = 1.0;
  normal = normalize(normal);
  
  vNormal = normalMatrix * normal;
  vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}