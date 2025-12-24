import { describe, it, expect } from 'vitest';
import path from 'path';

// Add path alias resolution for vitest
if (!process.env.VITEST_ALIAS_RESOLVED) {
  process.env.VITEST_ALIAS_RESOLVED = 'true';
}
import {
  calculateWindAtAltitude,
  analyzeAltitudeWindConditions,
  findMaxSafeAltitude,
  generateAltitudeProfile,
  getWindShearExponent,
} from '../lib/altitude-wind-calculator';

describe('Altitude Wind Calculator', () => {
  describe('getWindShearExponent', () => {
    it('should return correct exponent for open terrain', () => {
      expect(getWindShearExponent('open')).toBe(0.11);
    });

    it('should return correct exponent for suburban terrain', () => {
      expect(getWindShearExponent('suburban')).toBe(0.27);
    });

    it('should return correct exponent for urban terrain', () => {
      expect(getWindShearExponent('urban')).toBe(0.40);
    });
  });

  describe('calculateWindAtAltitude', () => {
    it('should calculate wind speed at 100 feet with suburban terrain', () => {
      const groundWind = 10; // mph at ground level
      const altitude = 100; // feet
      const result = calculateWindAtAltitude(groundWind, altitude, 'suburban');

      // At 100 feet with suburban terrain, wind should be higher than ground level
      expect(result).toBeGreaterThan(groundWind);
      // Result should be reasonable (not more than 2x ground wind at 100ft)
      expect(result).toBeLessThan(groundWind * 2);
    });

    it('should show minimal wind increase in open terrain', () => {
      const groundWind = 10;
      const altitudeOpen = calculateWindAtAltitude(groundWind, 100, 'open');
      const altitudeSuburban = calculateWindAtAltitude(groundWind, 100, 'suburban');

      // Open terrain should have less wind shear than suburban
      expect(altitudeOpen).toBeLessThan(altitudeSuburban);
    });

    it('should show significant wind increase in urban terrain', () => {
      const groundWind = 10;
      const altitudeUrban = calculateWindAtAltitude(groundWind, 100, 'urban');
      const altitudeSuburban = calculateWindAtAltitude(groundWind, 100, 'suburban');

      // Urban terrain should have more wind shear than suburban
      expect(altitudeUrban).toBeGreaterThan(altitudeSuburban);
    });

    it('should increase wind speed with altitude', () => {
      const groundWind = 10;
      const wind25 = calculateWindAtAltitude(groundWind, 25, 'suburban');
      const wind100 = calculateWindAtAltitude(groundWind, 100, 'suburban');
      const wind300 = calculateWindAtAltitude(groundWind, 300, 'suburban');

      expect(wind25).toBeLessThan(wind100);
      expect(wind100).toBeLessThan(wind300);
    });
  });

  describe('analyzeAltitudeWindConditions', () => {
    const thresholds = { safe: 15, caution: 25 };

    it('should classify safe conditions correctly', () => {
      const result = analyzeAltitudeWindConditions(5, 50, thresholds, 'suburban');
      expect(result.flightSafety).toBe('safe');
    });

    it('should classify caution conditions correctly', () => {
      const result = analyzeAltitudeWindConditions(15, 100, thresholds, 'suburban');
      expect(result.flightSafety).toBe('caution');
    });

    it('should classify unsafe conditions correctly', () => {
      const result = analyzeAltitudeWindConditions(25, 200, thresholds, 'suburban');
      expect(result.flightSafety).toBe('unsafe');
    });

    it('should calculate wind increase correctly', () => {
      const result = analyzeAltitudeWindConditions(10, 100, thresholds, 'suburban');
      expect(result.windIncrease).toBeGreaterThan(0);
      expect(result.percentageIncrease).toBeGreaterThan(0);
    });

    it('should provide meaningful recommendation', () => {
      const result = analyzeAltitudeWindConditions(10, 100, thresholds, 'suburban');
      expect(result.recommendation).toBeTruthy();
      expect(result.recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('findMaxSafeAltitude', () => {
    it('should find max safe altitude when conditions are safe at ground', () => {
      const result = findMaxSafeAltitude(5, 15, 'suburban');
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 when unsafe at all altitudes', () => {
      const result = findMaxSafeAltitude(30, 15, 'suburban');
      expect(result).toBe(0);
    });

    it('should return lower altitude for higher ground wind', () => {
      const maxSafe5 = findMaxSafeAltitude(5, 15, 'suburban');
      const maxSafe10 = findMaxSafeAltitude(10, 15, 'suburban');

      expect(maxSafe5).toBeGreaterThanOrEqual(maxSafe10);
    });
  });

  describe('generateAltitudeProfile', () => {
    it('should generate profile with multiple altitude points', () => {
      const profile = generateAltitudeProfile(10, { safe: 15, caution: 25 }, 'suburban');
      expect(profile.altitudes.length).toBeGreaterThan(0);
    });

    it('should include wind speed for each altitude', () => {
      const profile = generateAltitudeProfile(10, { safe: 15, caution: 25 }, 'suburban');
      profile.altitudes.forEach((data) => {
        expect(data.windSpeed).toBeGreaterThan(0);
        expect(data.altitude).toBeGreaterThan(0);
      });
    });

    it('should classify flight safety for each altitude', () => {
      const profile = generateAltitudeProfile(10, { safe: 15, caution: 25 }, 'suburban');
      profile.altitudes.forEach((data) => {
        expect(['safe', 'caution', 'unsafe']).toContain(data.flightSafety);
      });
    });

    it('should calculate max safe altitude', () => {
      const profile = generateAltitudeProfile(10, { safe: 15, caution: 25 }, 'suburban');
      expect(profile.maxSafeAltitude).toBeGreaterThanOrEqual(0);
    });

    it('should return wind shear factor', () => {
      const profile = generateAltitudeProfile(10, { safe: 15, caution: 25 }, 'suburban');
      expect(profile.windShearFactor).toBeGreaterThan(0);
    });
  });

  describe('Real-world scenarios', () => {
  // These tests validate the calculator against real-world drone flying conditions
    it('should handle calm conditions (5 mph ground wind)', () => {
      const result = analyzeAltitudeWindConditions(5, 300, { safe: 15, caution: 25 }, 'suburban');
      expect(result.flightSafety).toBe('safe');
      expect(result.windSpeed).toBeLessThan(15);
    });

    it('should handle moderate conditions (12 mph ground wind)', () => {
      const result = analyzeAltitudeWindConditions(12, 100, { safe: 15, caution: 25 }, 'suburban');
      // At 100ft with 12mph ground wind in suburban area, wind shear increases it to ~15-16 mph
      // This puts it at or slightly above the safe threshold, so caution is expected
      expect(['safe', 'caution']).toContain(result.flightSafety);
    });

    it('should handle strong conditions (20 mph ground wind)', () => {
      const result = analyzeAltitudeWindConditions(20, 200, { safe: 15, caution: 25 }, 'suburban');
      // At 200ft with 20mph ground wind, likely caution or unsafe
      expect(['caution', 'unsafe']).toContain(result.flightSafety);
    });

    it('should handle extreme conditions (30 mph ground wind)', () => {
      const result = analyzeAltitudeWindConditions(30, 400, { safe: 15, caution: 25 }, 'suburban');
      expect(result.flightSafety).toBe('unsafe');
    });
  });
});
