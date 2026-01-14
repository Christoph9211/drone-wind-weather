import { useEffect, useRef } from 'react';
import { View, Platform } from 'react-native';
import { Particle } from '@/lib/wind-particle-system';

interface WindMapCanvasWebProps {
  particles: Particle[];
  windSpeed: number;
  windDirection: number;
  windCategory: 'safe' | 'caution' | 'unsafe';
  safeThreshold?: number;
  cautionThreshold?: number;
}

// Professional color palette
const COLORS = {
  background: {
    start: '#0f172a',
    end: '#1e293b',
  },
  grid: {
    major: 'rgba(148, 163, 184, 0.15)',
    minor: 'rgba(148, 163, 184, 0.06)',
  },
  safe: {
    primary: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    particle: 'rgba(52, 211, 153, 0.8)',
  },
  caution: {
    primary: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    particle: 'rgba(251, 191, 36, 0.8)',
  },
  unsafe: {
    primary: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    particle: 'rgba(248, 113, 113, 0.8)',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
  },
  compass: {
    bg: 'rgba(30, 41, 59, 0.95)',
    border: 'rgba(148, 163, 184, 0.3)',
    ring: 'rgba(148, 163, 184, 0.2)',
  },
};

export function WindMapCanvasWeb({
  particles,
  windSpeed,
  windDirection,
  windCategory,
  safeThreshold = 15,
  cautionThreshold = 25,
}: WindMapCanvasWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const render = () => {
      // Draw background gradient
      drawBackground(ctx, width, height);

      // Draw professional grid
      drawProfessionalGrid(ctx, width, height);

      // Draw wind flow field
      drawWindFlowField(ctx, width, height, windDirection, windCategory);

      // Draw particles with trails
      drawProfessionalParticles(ctx, particles, windCategory, width, height);

      // Draw center location marker with pulse
      drawProfessionalLocationMarker(ctx, width / 2, height / 2, windCategory);

      // Draw professional compass
      drawProfessionalCompass(ctx, width - 70, 70, windDirection, windSpeed, windCategory);

      // Draw wind speed scale bar
      drawWindSpeedScale(ctx, 20, height - 120, safeThreshold, cautionThreshold);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles, windDirection, windSpeed, windCategory, safeThreshold, cautionThreshold]);

  // Only render on web platform
  if (Platform.OS !== 'web') {
    return (
      <View className="flex-1 items-center justify-center bg-[#0f172a]">
        <View />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: '#0f172a',
        }}
      />
    </View>
  );
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height)
  );
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(0.5, '#0f172a');
  gradient.addColorStop(1, '#020617');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawProfessionalGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const majorGridSize = 80;
  const minorGridSize = 20;

  // Draw minor grid lines
  ctx.strokeStyle = COLORS.grid.minor;
  ctx.lineWidth = 0.5;

  for (let x = 0; x < width; x += minorGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += minorGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw major grid lines
  ctx.strokeStyle = COLORS.grid.major;
  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += majorGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += majorGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw center crosshair
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 4]);
  
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, height);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
  
  ctx.setLineDash([]);
}

function drawWindFlowField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  direction: number,
  windCategory: 'safe' | 'caution' | 'unsafe'
) {
  const colors = COLORS[windCategory];
  const angle = (direction * Math.PI) / 180;
  const spacing = 60;
  
  ctx.strokeStyle = `${colors.glow}`;
  ctx.lineWidth = 1;

  for (let x = spacing / 2; x < width; x += spacing) {
    for (let y = spacing / 2; y < height; y += spacing) {
      // Calculate distance from center for fade effect
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt(width * width + height * height) / 2;
      const opacity = Math.max(0, 1 - dist / maxDist) * 0.3;

      if (opacity > 0.05) {
        drawFlowArrow(ctx, x, y, angle, 15, opacity, colors.primary);
      }
    }
  }
}

function drawFlowArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  opacity: number,
  color: string
) {
  const endX = x + Math.sin(angle) * length;
  const endY = y - Math.cos(angle) * length;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Small arrowhead
  const headSize = 4;
  const angle1 = angle + (Math.PI * 5) / 6;
  const angle2 = angle - (Math.PI * 5) / 6;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX + Math.sin(angle1) * headSize,
    endY - Math.cos(angle1) * headSize
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX + Math.sin(angle2) * headSize,
    endY - Math.cos(angle2) * headSize
  );
  ctx.stroke();

  ctx.restore();
}

function drawProfessionalParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  windCategory: 'safe' | 'caution' | 'unsafe',
  width: number,
  height: number
) {
  const colors = COLORS[windCategory];
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(width * width + height * height) / 2;

  particles.forEach((particle) => {
    // Calculate distance from center for intensity
    const dx = particle.x - centerX;
    const dy = particle.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const distFactor = Math.max(0.2, 1 - dist / maxDist);

    // Draw particle glow
    const glowRadius = particle.size * 4;
    const glow = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, glowRadius
    );
    glow.addColorStop(0, colors.glow);
    glow.addColorStop(1, 'transparent');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw particle core
    ctx.fillStyle = colors.particle;
    ctx.globalAlpha = particle.opacity * distFactor;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw particle trail
    if (particle.vx !== 0 || particle.vy !== 0) {
      const trailLength = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy) * 8;
      const trailGradient = ctx.createLinearGradient(
        particle.x, particle.y,
        particle.x - particle.vx * 8, particle.y - particle.vy * 8
      );
      trailGradient.addColorStop(0, colors.particle);
      trailGradient.addColorStop(1, 'transparent');

      ctx.strokeStyle = trailGradient;
      ctx.lineWidth = particle.size;
      ctx.lineCap = 'round';
      ctx.globalAlpha = particle.opacity * 0.5 * distFactor;
      
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x - particle.vx * 8, particle.y - particle.vy * 8);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });
}

function drawProfessionalLocationMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  windCategory: 'safe' | 'caution' | 'unsafe'
) {
  const colors = COLORS[windCategory];

  // Outer pulse ring
  ctx.strokeStyle = colors.glow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 35, 0, Math.PI * 2);
  ctx.stroke();

  // Middle ring
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.stroke();

  // Inner glow
  const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, 20);
  innerGlow.addColorStop(0, colors.glow);
  innerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();

  // Center dot
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Inner highlight
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawProfessionalCompass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: number,
  speed: number,
  windCategory: 'safe' | 'caution' | 'unsafe'
) {
  const radius = 50;
  const colors = COLORS[windCategory];

  // Compass background with shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = COLORS.compass.bg;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Compass border
  ctx.strokeStyle = COLORS.compass.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = COLORS.compass.ring;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius - 12, 0, Math.PI * 2);
  ctx.stroke();

  // Tick marks
  for (let i = 0; i < 360; i += 15) {
    const angle = (i * Math.PI) / 180;
    const isMajor = i % 90 === 0;
    const isMinor = i % 45 === 0;
    const innerR = isMajor ? radius - 18 : isMinor ? radius - 14 : radius - 10;
    const outerR = radius - 6;

    ctx.strokeStyle = isMajor ? COLORS.text.secondary : COLORS.text.muted;
    ctx.lineWidth = isMajor ? 2 : 1;

    ctx.beginPath();
    ctx.moveTo(x + Math.sin(angle) * innerR, y - Math.cos(angle) * innerR);
    ctx.lineTo(x + Math.sin(angle) * outerR, y - Math.cos(angle) * outerR);
    ctx.stroke();
  }

  // Cardinal directions
  ctx.fillStyle = COLORS.text.primary;
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ];

  cardinals.forEach(({ label, angle }) => {
    const rad = (angle * Math.PI) / 180;
    const labelR = radius - 26;
    ctx.fillText(label, x + Math.sin(rad) * labelR, y - Math.cos(rad) * labelR);
  });

  // Wind direction arrow
  const windAngle = (direction * Math.PI) / 180;
  const arrowLength = radius - 20;

  // Arrow glow
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 10;

  // Arrow body
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(windAngle) * arrowLength, y - Math.cos(windAngle) * arrowLength);
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Arrow head
  const headX = x + Math.sin(windAngle) * arrowLength;
  const headY = y - Math.cos(windAngle) * arrowLength;
  const headSize = 10;

  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.moveTo(headX, headY);
  ctx.lineTo(
    headX + Math.sin(windAngle + (Math.PI * 5) / 6) * headSize,
    headY - Math.cos(windAngle + (Math.PI * 5) / 6) * headSize
  );
  ctx.lineTo(
    headX + Math.sin(windAngle - (Math.PI * 5) / 6) * headSize,
    headY - Math.cos(windAngle - (Math.PI * 5) / 6) * headSize
  );
  ctx.closePath();
  ctx.fill();

  // Center dot
  ctx.fillStyle = COLORS.text.secondary;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Wind speed label below compass
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(speed)}`, x, y + radius + 18);

  ctx.fillStyle = COLORS.text.secondary;
  ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('mph', x, y + radius + 32);
}

function drawWindSpeedScale(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  safeThreshold: number,
  cautionThreshold: number
) {
  const width = 24;
  const height = 100;
  const padding = 12;

  // Background panel
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  
  const panelWidth = width + padding * 2 + 30;
  const panelHeight = height + padding * 2 + 20;
  
  roundRect(ctx, x, y, panelWidth, panelHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = COLORS.text.secondary;
  ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WIND', x + padding, y + 14);

  // Scale bar
  const barX = x + padding;
  const barY = y + padding + 16;
  const barHeight = height - 10;

  // Create gradient for scale
  const gradient = ctx.createLinearGradient(barX, barY + barHeight, barX, barY);
  gradient.addColorStop(0, COLORS.safe.primary);
  gradient.addColorStop(0.4, COLORS.caution.primary);
  gradient.addColorStop(1, COLORS.unsafe.primary);

  ctx.fillStyle = gradient;
  roundRect(ctx, barX, barY, width, barHeight, 4);
  ctx.fill();

  // Scale labels
  ctx.fillStyle = COLORS.text.primary;
  ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';

  const labelX = barX + width + 6;
  
  ctx.fillText(`${cautionThreshold}+`, labelX, barY + 8);
  ctx.fillText(`${safeThreshold}`, labelX, barY + barHeight / 2);
  ctx.fillText('0', labelX, barY + barHeight - 2);

  // Status indicators
  const indicatorX = labelX + 20;
  ctx.font = '8px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = COLORS.text.muted;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
