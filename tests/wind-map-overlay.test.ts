import { describe, it, expect, beforeEach } from 'vitest';
import {
  windDirectionToVelocity,
  createParticle,
  updateParticle,
  generateParticles,
  updateParticles,
  getWindSpeedColor,
  getWindSpeedCategory,
  calculateGridCells,
  interpolateWindData,
  Particle,
} from '../lib/wind-particle-system';

describe('Wind Map Overlay - Particle System', () => {
  describe('windDirectionToVelocity', () => {
    it('should convert North (0°) direction to correct velocity', () => {
      const { vx, vy } = windDirectionToVelocity(0, 10);
      expect(vx).toBeCloseTo(0, 5);
      expect(vy).toBeCloseTo(-10, 5);
    });

    it('should convert East (90°) direction to correct velocity', () => {
      const { vx, vy } = windDirectionToVelocity(90, 10);
      expect(vx).toBeCloseTo(10, 5);
      expect(vy).toBeCloseTo(0, 5);
    });

    it('should convert South (180°) direction to correct velocity', () => {
      const { vx, vy } = windDirectionToVelocity(180, 10);
      expect(vx).toBeCloseTo(0, 5);
      expect(vy).toBeCloseTo(10, 5);
    });

    it('should convert West (270°) direction to correct velocity', () => {
      const { vx, vy } = windDirectionToVelocity(270, 10);
      expect(vx).toBeCloseTo(-10, 5);
      expect(vy).toBeCloseTo(0, 5);
    });

    it('should handle 45° (NE) direction correctly', () => {
      const { vx, vy } = windDirectionToVelocity(45, 10);
      expect(vx).toBeCloseTo(7.071, 2);
      expect(vy).toBeCloseTo(-7.071, 2);
    });

    it('should scale velocity with wind speed', () => {
      const slow = windDirectionToVelocity(0, 5);
      const fast = windDirectionToVelocity(0, 10);
      expect(Math.abs(fast.vy)).toBeCloseTo(Math.abs(slow.vy) * 2, 5);
    });

    it('should handle zero wind speed', () => {
      const { vx, vy } = windDirectionToVelocity(45, 0);
      expect(vx).toBeCloseTo(0, 5);
      expect(vy).toBeCloseTo(0, 5);
    });
  });

  describe('createParticle', () => {
    it('should create particle with correct properties', () => {
      const particle = createParticle('test-1', 100, 200, 5, 10, 2000);
      expect(particle.id).toBe('test-1');
      expect(particle.x).toBe(100);
      expect(particle.y).toBe(200);
      expect(particle.vx).toBe(5);
      expect(particle.vy).toBe(10);
      expect(particle.age).toBe(0);
      expect(particle.maxAge).toBe(2000);
      expect(particle.opacity).toBe(1);
      expect(particle.size).toBe(2);
    });

    it('should use default lifetime of 2000ms', () => {
      const particle = createParticle('test-2', 0, 0, 0, 0);
      expect(particle.maxAge).toBe(2000);
    });

    it('should accept custom lifetime', () => {
      const particle = createParticle('test-3', 0, 0, 0, 0, 5000);
      expect(particle.maxAge).toBe(5000);
    });
  });

  describe('updateParticle', () => {
    let particle: Particle;

    beforeEach(() => {
      particle = createParticle('test', 100, 100, 10, 20, 1000);
    });

    it('should update particle position based on velocity', () => {
      const updated = updateParticle(particle, 100); // 100ms
      expect(updated.x).toBeCloseTo(101, 1); // 100 + 10 * 0.1
      expect(updated.y).toBeCloseTo(102, 1); // 100 + 20 * 0.1
    });

    it('should increment particle age', () => {
      const updated = updateParticle(particle, 100);
      expect(updated.age).toBe(100);
    });

    it('should increase particle size over lifetime', () => {
      const updated = updateParticle(particle, 100);
      expect(updated.size).toBeGreaterThan(particle.size);
    });

    it('should maintain full opacity before fade start (70% of lifetime)', () => {
      const updated = updateParticle(particle, 600); // 60% of 1000ms
      expect(updated.opacity).toBe(1);
    });

    it('should fade opacity after 70% of lifetime', () => {
      const updated = updateParticle(particle, 800); // 80% of 1000ms
      expect(updated.opacity).toBeLessThan(1);
      expect(updated.opacity).toBeGreaterThan(0);
    });

    it('should reach zero opacity at end of lifetime', () => {
      const updated = updateParticle(particle, 1000);
      expect(updated.opacity).toBeCloseTo(0, 5);
    });

    it('should not mutate original particle', () => {
      const originalX = particle.x;
      const originalY = particle.y;
      updateParticle(particle, 100);
      expect(particle.x).toBe(originalX);
      expect(particle.y).toBe(originalY);
    });
  });

  describe('generateParticles', () => {
    it('should generate correct number of particles', () => {
      const particles = generateParticles(50, 100, 100, 50, 5, 10);
      expect(particles).toHaveLength(50);
    });

    it('should create particles within specified radius', () => {
      const centerX = 100;
      const centerY = 100;
      const radius = 50;
      const particles = generateParticles(100, centerX, centerY, radius, 5, 10);

      particles.forEach((p) => {
        const distance = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
        expect(distance).toBeLessThanOrEqual(radius);
      });
    });

    it('should assign velocity to particles', () => {
      const particles = generateParticles(10, 100, 100, 50, 5, 10);
      particles.forEach((p) => {
        expect(p.vx).toBeDefined();
        expect(p.vy).toBeDefined();
        expect(typeof p.vx).toBe('number');
        expect(typeof p.vy).toBe('number');
      });
    });

    it('should add velocity variation to particles', () => {
      const particles = generateParticles(50, 100, 100, 50, 5, 10);
      const velocities = particles.map((p) => p.vx);
      const uniqueVelocities = new Set(velocities);
      // Should have variation in velocities (not all identical)
      expect(uniqueVelocities.size).toBeGreaterThan(1);
    });

    it('should set correct lifetime for particles', () => {
      const particles = generateParticles(10, 100, 100, 50, 5, 10, 3000);
      particles.forEach((p) => {
        expect(p.maxAge).toBe(3000);
      });
    });

    it('should generate unique particle IDs', () => {
      const particles = generateParticles(10, 100, 100, 50, 5, 10);
      const ids = particles.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('updateParticles', () => {
    it('should update all particles', () => {
      const particles = generateParticles(5, 100, 100, 50, 5, 10);
      const updated = updateParticles(particles, 100);
      expect(updated).toHaveLength(5);
    });

    it('should remove dead particles (age >= maxAge)', () => {
      const particles = [
        createParticle('p1', 100, 100, 5, 10, 100),
        createParticle('p2', 100, 100, 5, 10, 100),
      ];
      // Update with 150ms (exceeds 100ms maxAge)
      const updated = updateParticles(particles, 150);
      expect(updated).toHaveLength(0);
    });

    it('should keep particles with age < maxAge', () => {
      const particles = [
        createParticle('p1', 100, 100, 5, 10, 1000),
        createParticle('p2', 100, 100, 5, 10, 1000),
      ];
      const updated = updateParticles(particles, 500); // 50% of lifetime
      expect(updated).toHaveLength(2);
    });

    it('should handle empty particle array', () => {
      const updated = updateParticles([], 100);
      expect(updated).toHaveLength(0);
    });
  });

  describe('getWindSpeedColor', () => {
    it('should return green for safe wind speeds', () => {
      const color = getWindSpeedColor(10, 15, 25);
      expect(color).toContain('34, 197, 94'); // Green
    });

    it('should return yellow for caution wind speeds', () => {
      const color = getWindSpeedColor(20, 15, 25);
      expect(color).toContain('245, 158, 11'); // Yellow
    });

    it('should return red for unsafe wind speeds', () => {
      const color = getWindSpeedColor(30, 15, 25);
      expect(color).toContain('239, 68, 68'); // Red
    });

    it('should use default thresholds', () => {
      const safeColor = getWindSpeedColor(10);
      const cautionColor = getWindSpeedColor(20);
      const unsafeColor = getWindSpeedColor(30);

      expect(safeColor).toContain('34, 197, 94');
      expect(cautionColor).toContain('245, 158, 11');
      expect(unsafeColor).toContain('239, 68, 68');
    });

    it('should handle boundary values correctly', () => {
      const atSafeThreshold = getWindSpeedColor(15, 15, 25);
      const justAboveCautionThreshold = getWindSpeedColor(25, 15, 25);
      const wellAboveCautionThreshold = getWindSpeedColor(26, 15, 25);

      expect(atSafeThreshold).toContain('34, 197, 94'); // Safe (at threshold)
      expect(justAboveCautionThreshold).toContain('245, 158, 11'); // Caution (at threshold)
      expect(wellAboveCautionThreshold).toContain('239, 68, 68'); // Unsafe (above caution)
    });
  });

  describe('getWindSpeedCategory', () => {
    it('should categorize low wind as safe', () => {
      expect(getWindSpeedCategory(10)).toBe('safe');
      expect(getWindSpeedCategory(15)).toBe('safe');
    });

    it('should categorize medium wind as caution', () => {
      expect(getWindSpeedCategory(16)).toBe('caution');
      expect(getWindSpeedCategory(20)).toBe('caution');
      expect(getWindSpeedCategory(25)).toBe('caution');
    });

    it('should categorize high wind as unsafe', () => {
      expect(getWindSpeedCategory(26)).toBe('unsafe');
      expect(getWindSpeedCategory(35)).toBe('unsafe');
    });

    it('should handle zero wind speed', () => {
      expect(getWindSpeedCategory(0)).toBe('safe');
    });

    it('should handle extreme wind speeds', () => {
      expect(getWindSpeedCategory(100)).toBe('unsafe');
    });
  });

  describe('calculateGridCells', () => {
    it('should calculate grid cells for map area', () => {
      const cells = calculateGridCells(400, 400, 100);
      expect(cells).toHaveLength(16); // 4x4 grid
    });

    it('should handle non-square maps', () => {
      const cells = calculateGridCells(500, 300, 100);
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should create cells with correct dimensions', () => {
      const cells = calculateGridCells(400, 400, 100);
      cells.forEach((cell) => {
        expect(cell.width).toBeLessThanOrEqual(100);
        expect(cell.height).toBeLessThanOrEqual(100);
      });
    });

    it('should use default cell size of 100', () => {
      const cells1 = calculateGridCells(400, 400);
      const cells2 = calculateGridCells(400, 400, 100);
      expect(cells1).toHaveLength(cells2.length);
    });

    it('should handle maps smaller than cell size', () => {
      const cells = calculateGridCells(50, 50, 100);
      expect(cells).toHaveLength(1);
      expect(cells[0].width).toBe(50);
      expect(cells[0].height).toBe(50);
    });

    it('should cover entire map area', () => {
      const mapWidth = 500;
      const mapHeight = 300;
      const cells = calculateGridCells(mapWidth, mapHeight, 100);

      let totalArea = 0;
      cells.forEach((cell) => {
        totalArea += cell.width * cell.height;
      });

      expect(totalArea).toBe(mapWidth * mapHeight);
    });
  });

  describe('interpolateWindData', () => {
    it('should return wind data for grid point', () => {
      const gridData = new Map();
      gridData.set('1,1', { vx: 5, vy: 10 });

      const result = interpolateWindData(150, 150, gridData);
      expect(result.vx).toBe(5);
      expect(result.vy).toBe(10);
    });

    it('should return zero velocity for missing grid point', () => {
      const gridData = new Map();
      const result = interpolateWindData(150, 150, gridData);
      expect(result.vx).toBe(0);
      expect(result.vy).toBe(0);
    });

    it('should calculate correct grid coordinates', () => {
      const gridData = new Map();
      gridData.set('2,3', { vx: 7, vy: 14 });

      // Position (250, 350) should map to grid (2, 3) with 100px cells
      const result = interpolateWindData(250, 350, gridData);
      expect(result.vx).toBe(7);
      expect(result.vy).toBe(14);
    });

    it('should handle empty grid data', () => {
      const gridData = new Map();
      const result = interpolateWindData(100, 100, gridData);
      expect(result).toEqual({ vx: 0, vy: 0 });
    });

    it('should handle multiple grid points', () => {
      const gridData = new Map();
      gridData.set('0,0', { vx: 1, vy: 2 });
      gridData.set('1,0', { vx: 3, vy: 4 });
      gridData.set('0,1', { vx: 5, vy: 6 });

      const result1 = interpolateWindData(50, 50, gridData);
      const result2 = interpolateWindData(150, 50, gridData);
      const result3 = interpolateWindData(50, 150, gridData);

      expect(result1).toEqual({ vx: 1, vy: 2 });
      expect(result2).toEqual({ vx: 3, vy: 4 });
      expect(result3).toEqual({ vx: 5, vy: 6 });
    });
  });

  describe('Integration Tests', () => {
    it('should create and update particle system over time', () => {
      const particles = generateParticles(10, 100, 100, 50, 5, 10, 1000);
      expect(particles).toHaveLength(10);

      // Update particles in 100ms increments
      let updated = particles;
      for (let i = 0; i < 10; i++) {
        updated = updateParticles(updated, 100);
        expect(updated.length).toBeLessThanOrEqual(10);
      }

      // After 1000ms, all particles should be dead
      updated = updateParticles(updated, 100);
      expect(updated).toHaveLength(0);
    });

    it('should handle wind direction change in particle system', () => {
      const northParticles = generateParticles(5, 100, 100, 50, 0, -10, 1000);
      const eastParticles = generateParticles(5, 100, 100, 50, 10, 0, 1000);

      // North particles should move upward (negative y)
      const northUpdated = updateParticles(northParticles, 100);
      northUpdated.forEach((p) => {
        expect(p.y).toBeLessThan(100 + 50); // Should move up
      });

      // East particles should move right (positive x)
      const eastUpdated = updateParticles(eastParticles, 100);
      eastUpdated.forEach((p) => {
        expect(p.x).toBeGreaterThan(100 - 50); // Should move right
      });
    });

    it('should correctly visualize wind conditions with colors and categories', () => {
      const windSpeeds = [5, 15, 20, 25, 30];
      const results = windSpeeds.map((speed) => ({
        speed,
        color: getWindSpeedColor(speed),
        category: getWindSpeedCategory(speed),
      }));

      expect(results[0].category).toBe('safe');
      expect(results[1].category).toBe('safe');
      expect(results[2].category).toBe('caution');
      expect(results[3].category).toBe('caution');
      expect(results[4].category).toBe('unsafe');
    });
  });
});
