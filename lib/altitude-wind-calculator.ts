/**
 * Wind Speed at Altitude Calculator
 * 
 * Uses the Power Law (Wind Shear) model to estimate wind speed at different altitudes.
 * This is a well-established meteorological model used by aviation and drone industries.
 * 
 * Formula: V(z) = V(z_ref) * (z / z_ref)^α
 * 
 * Where:
 * - V(z) = wind speed at altitude z
 * - V(z_ref) = wind speed at reference altitude (10m)
 * - z = desired altitude
 * - z_ref = reference altitude (10m)
 * - α = wind shear exponent (typically 0.2-0.3 for open terrain, 0.4+ for urban areas)
 */

export interface AltitudeWindData {
  altitude: number; // feet above ground level
  windSpeed: number;
  flightSafety: 'safe' | 'caution' | 'unsafe';
}

export interface AltitudeProfile {
  altitudes: AltitudeWindData[];
  maxSafeAltitude: number; // highest altitude where conditions are safe
  windShearFactor: number;
}

/**
 * Calculate wind shear exponent based on terrain type
 * Different terrain types have different wind shear characteristics
 */
export function getWindShearExponent(terrainType: 'open' | 'suburban' | 'urban'): number {
  switch (terrainType) {
    case 'open':
      // Open terrain (water, grassland): minimal friction
      return 0.11;
    case 'suburban':
      // Suburban terrain (mixed buildings, trees): moderate friction
      return 0.27;
    case 'urban':
      // Urban terrain (dense buildings): high friction
      return 0.40;
    default:
      return 0.2;
  }
}

/**
 * Calculate wind speed at a given altitude using the Power Law model
 * 
 * @param groundWindSpeed - Wind speed at ground level (10m reference height)
 * @param altitude - Desired altitude in feet above ground level
 * @param terrainType - Type of terrain affecting wind shear
 * @returns Wind speed at the specified altitude
 */
export function calculateWindAtAltitude(
  groundWindSpeed: number,
  altitude: number,
  terrainType: 'open' | 'suburban' | 'urban' = 'suburban'
): number {
  // Convert feet to meters (1 foot = 0.3048 meters)
  const altitudeMeters = altitude * 0.3048;
  
  // Reference altitude is 10 meters (standard meteorological height)
  const referenceAltitude = 10;
  
  // Get wind shear exponent based on terrain
  const alpha = getWindShearExponent(terrainType);
  
  // Apply power law formula
  const windAtAltitude = groundWindSpeed * Math.pow(altitudeMeters / referenceAltitude, alpha);
  
  return Math.round(windAtAltitude * 10) / 10; // Round to 1 decimal place
}

/**
 * Generate altitude wind profile for visualization
 * Creates data points at common drone flying altitudes
 */
export function generateAltitudeProfile(
  groundWindSpeed: number,
  thresholds: { safe: number; caution: number },
  terrainType: 'open' | 'suburban' | 'urban' = 'suburban'
): AltitudeProfile {
  // Common drone altitudes: 25, 50, 100, 150, 200, 300, 400 feet
  const altitudes = [25, 50, 100, 150, 200, 300, 400];
  
  let maxSafeAltitude = 0;
  
  const altitudeData = altitudes.map((altitude) => {
    const windSpeed = calculateWindAtAltitude(groundWindSpeed, altitude, terrainType);
    
    let flightSafety: 'safe' | 'caution' | 'unsafe';
    if (windSpeed <= thresholds.safe) {
      flightSafety = 'safe';
      maxSafeAltitude = altitude; // Update max safe altitude
    } else if (windSpeed <= thresholds.caution) {
      flightSafety = 'caution';
    } else {
      flightSafety = 'unsafe';
    }
    
    return {
      altitude,
      windSpeed,
      flightSafety,
    };
  });
  
  const windShearFactor = getWindShearExponent(terrainType);
  
  return {
    altitudes: altitudeData,
    maxSafeAltitude,
    windShearFactor,
  };
}

/**
 * Calculate wind speed at a specific altitude with detailed analysis
 */
export function analyzeAltitudeWindConditions(
  groundWindSpeed: number,
  altitude: number,
  thresholds: { safe: number; caution: number },
  terrainType: 'open' | 'suburban' | 'urban' = 'suburban'
): {
  windSpeed: number;
  windIncrease: number;
  percentageIncrease: number;
  flightSafety: 'safe' | 'caution' | 'unsafe';
  recommendation: string;
} {
  const windAtAltitude = calculateWindAtAltitude(groundWindSpeed, altitude, terrainType);
  const windIncrease = windAtAltitude - groundWindSpeed;
  const percentageIncrease = (windIncrease / groundWindSpeed) * 100;
  
  let flightSafety: 'safe' | 'caution' | 'unsafe';
  let recommendation: string;
  
  if (windAtAltitude <= thresholds.safe) {
    flightSafety = 'safe';
    recommendation = `Safe to fly at ${altitude}ft. Wind conditions are within safe limits.`;
  } else if (windAtAltitude <= thresholds.caution) {
    flightSafety = 'caution';
    recommendation = `Caution at ${altitude}ft. Wind speed is elevated. Experienced pilots only.`;
  } else {
    flightSafety = 'unsafe';
    recommendation = `Unsafe to fly at ${altitude}ft. Wind speed exceeds safe limits.`;
  }
  
  return {
    windSpeed: windAtAltitude,
    windIncrease,
    percentageIncrease,
    flightSafety,
    recommendation,
  };
}

/**
 * Find the maximum safe altitude for flying
 */
export function findMaxSafeAltitude(
  groundWindSpeed: number,
  safeThreshold: number,
  terrainType: 'open' | 'suburban' | 'urban' = 'suburban'
): number {
  const altitudes = [25, 50, 75, 100, 150, 200, 250, 300, 350, 400];
  
  for (let i = altitudes.length - 1; i >= 0; i--) {
    const windAtAltitude = calculateWindAtAltitude(groundWindSpeed, altitudes[i], terrainType);
    if (windAtAltitude <= safeThreshold) {
      return altitudes[i];
    }
  }
  
  // If even ground level is unsafe, return 0
  return 0;
}

/**
 * Get terrain type description
 */
export function getTerrainDescription(terrainType: 'open' | 'suburban' | 'urban'): string {
  switch (terrainType) {
    case 'open':
      return 'Open (water, grassland, desert)';
    case 'suburban':
      return 'Suburban (mixed buildings, trees)';
    case 'urban':
      return 'Urban (dense buildings, city center)';
    default:
      return 'Unknown';
  }
}
