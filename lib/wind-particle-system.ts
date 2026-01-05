/**
 * Wind Particle System
 * Generates animated wind particles for visualization on maps
 * Uses particle physics to simulate wind flow patterns
 */

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  age: number;
  maxAge: number;
  opacity: number;
  size: number;
}

export interface WindField {
  latitude: number;
  longitude: number;
  windSpeed: number; // in mph
  windDirection: number; // in degrees (0-360)
  particles: Particle[];
}

/**
 * Convert wind direction (degrees) to velocity components
 * 0° = North, 90° = East, 180° = South, 270° = West
 */
export function windDirectionToVelocity(
  direction: number,
  speed: number
): { vx: number; vy: number } {
  const radians = (direction * Math.PI) / 180;
  return {
    vx: Math.sin(radians) * speed,
    vy: -Math.cos(radians) * speed, // negative because y increases downward in canvas
  };
}

/**
 * Create a new wind particle
 */
export function createParticle(
  id: string,
  x: number,
  y: number,
  vx: number,
  vy: number,
  lifetime: number = 2000 // milliseconds
): Particle {
  return {
    id,
    x,
    y,
    vx,
    vy,
    age: 0,
    maxAge: lifetime,
    opacity: 1,
    size: 2,
  };
}

/**
 * Update particle position and properties
 */
export function updateParticle(particle: Particle, deltaTime: number): Particle {
  const updated = { ...particle };
  
  // Update position
  updated.x += updated.vx * (deltaTime / 1000);
  updated.y += updated.vy * (deltaTime / 1000);
  
  // Update age
  updated.age += deltaTime;
  
  // Calculate opacity fade (starts fading at 70% of lifetime)
  const fadeStart = updated.maxAge * 0.7;
  if (updated.age > fadeStart) {
    const fadeProgress = (updated.age - fadeStart) / (updated.maxAge - fadeStart);
    updated.opacity = Math.max(0, 1 - fadeProgress);
  }
  
  // Slightly increase size as particle ages
  updated.size = 2 + (updated.age / updated.maxAge) * 1.5;
  
  return updated;
}

/**
 * Generate initial particles for wind field
 */
export function generateParticles(
  count: number,
  centerX: number,
  centerY: number,
  radius: number,
  vx: number,
  vy: number,
  lifetime: number = 2000
): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    // Random position within radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    // Add slight variation to velocity
    const velocityVariation = 0.2;
    const randomVx = vx + (Math.random() - 0.5) * vx * velocityVariation;
    const randomVy = vy + (Math.random() - 0.5) * vy * velocityVariation;
    
    particles.push(
      createParticle(
        `particle-${i}-${Date.now()}`,
        x,
        y,
        randomVx,
        randomVy,
        lifetime
      )
    );
  }
  
  return particles;
}

/**
 * Update all particles and remove dead ones
 */
export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map((p) => updateParticle(p, deltaTime))
    .filter((p) => p.age < p.maxAge);
}

/**
 * Get color based on wind speed (for heatmap visualization)
 * Green (safe) -> Yellow (caution) -> Red (unsafe)
 */
export function getWindSpeedColor(windSpeed: number, safeThreshold: number = 15, cautionThreshold: number = 25): string {
  if (windSpeed <= safeThreshold) {
    // Green: safe
    return `rgba(34, 197, 94, 0.6)`;
  } else if (windSpeed <= cautionThreshold) {
    // Yellow: caution
    return `rgba(245, 158, 11, 0.6)`;
  } else {
    // Red: unsafe
    return `rgba(239, 68, 68, 0.6)`;
  }
}

/**
 * Get wind speed category for visualization
 */
export function getWindSpeedCategory(windSpeed: number): 'safe' | 'caution' | 'unsafe' {
  if (windSpeed <= 15) return 'safe';
  if (windSpeed <= 25) return 'caution';
  return 'unsafe';
}

/**
 * Calculate grid cells for wind visualization
 * Divides map area into grid for particle generation
 */
export function calculateGridCells(
  mapWidth: number,
  mapHeight: number,
  cellSize: number = 100
): Array<{ x: number; y: number; width: number; height: number }> {
  const cells: Array<{ x: number; y: number; width: number; height: number }> = [];
  
  for (let x = 0; x < mapWidth; x += cellSize) {
    for (let y = 0; y < mapHeight; y += cellSize) {
      cells.push({
        x,
        y,
        width: Math.min(cellSize, mapWidth - x),
        height: Math.min(cellSize, mapHeight - y),
      });
    }
  }
  
  return cells;
}

/**
 * Interpolate wind data between grid points (simple bilinear interpolation)
 */
export function interpolateWindData(
  x: number,
  y: number,
  gridData: Map<string, { vx: number; vy: number }>
): { vx: number; vy: number } {
  // For simplicity, return average of nearby grid points
  // In production, use proper bilinear interpolation
  const gridSize = 100;
  const gridX = Math.floor(x / gridSize);
  const gridY = Math.floor(y / gridSize);
  
  const key = `${gridX},${gridY}`;
  return gridData.get(key) || { vx: 0, vy: 0 };
}
