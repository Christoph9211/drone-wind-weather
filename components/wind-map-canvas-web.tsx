import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Particle } from '@/lib/wind-particle-system';

interface WindMapCanvasWebProps {
  particles: Particle[];
  windSpeed: number;
  windDirection: number;
  windCategory: 'safe' | 'caution' | 'unsafe';
}

export function WindMapCanvasWeb({
  particles,
  windSpeed,
  windDirection,
  windCategory,
}: WindMapCanvasWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f5f5f5');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw particles
    drawParticles(ctx, particles, windCategory);

    // Draw wind direction indicator
    drawWindDirectionIndicator(ctx, width, height, windDirection, windSpeed, windCategory);

    // Draw center location marker
    drawLocationMarker(ctx, width / 2, height / 2);
  }, [particles, windDirection, windSpeed, windCategory]);

  return (
    <View className="flex-1 bg-background">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </View>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
  ctx.lineWidth = 1;

  const gridSize = 50;

  // Vertical lines
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  windCategory: 'safe' | 'caution' | 'unsafe'
) {
  particles.forEach((particle) => {
    // Determine color based on wind category
    let color: string;
    switch (windCategory) {
      case 'safe':
        color = `rgba(34, 197, 94, ${particle.opacity * 0.7})`;
        break;
      case 'caution':
        color = `rgba(245, 158, 11, ${particle.opacity * 0.7})`;
        break;
      case 'unsafe':
        color = `rgba(239, 68, 68, ${particle.opacity * 0.7})`;
        break;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawWindDirectionIndicator(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  direction: number,
  speed: number,
  windCategory: 'safe' | 'caution' | 'unsafe'
) {
  const indicatorX = width - 60;
  const indicatorY = 60;
  const radius = 40;

  // Draw compass circle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(indicatorX, indicatorY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw cardinal directions
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const directions = ['N', 'E', 'S', 'W'];
  const angles = [0, 90, 180, 270];

  directions.forEach((dir, i) => {
    const angle = (angles[i] * Math.PI) / 180;
    const x = indicatorX + Math.sin(angle) * (radius - 12);
    const y = indicatorY - Math.cos(angle) * (radius - 12);
    ctx.fillText(dir, x, y);
  });

  // Draw wind direction arrow
  const windAngle = (direction * Math.PI) / 180;
  const arrowLength = radius - 15;
  const arrowX = indicatorX + Math.sin(windAngle) * arrowLength;
  const arrowY = indicatorY - Math.cos(windAngle) * arrowLength;

  // Determine arrow color
  let arrowColor: string;
  switch (windCategory) {
    case 'safe':
      arrowColor = '#22c55e';
      break;
    case 'caution':
      arrowColor = '#f59e0b';
      break;
    case 'unsafe':
      arrowColor = '#ef4444';
      break;
  }

  ctx.strokeStyle = arrowColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(indicatorX, indicatorY);
  ctx.lineTo(arrowX, arrowY);
  ctx.stroke();

  // Draw arrowhead
  const arrowHeadSize = 8;
  const angle1 = windAngle + (Math.PI * 5) / 6;
  const angle2 = windAngle - (Math.PI * 5) / 6;

  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX + Math.sin(angle1) * arrowHeadSize,
    arrowY - Math.cos(angle1) * arrowHeadSize
  );
  ctx.lineTo(
    arrowX + Math.sin(angle2) * arrowHeadSize,
    arrowY - Math.cos(angle2) * arrowHeadSize
  );
  ctx.closePath();
  ctx.fillStyle = arrowColor;
  ctx.fill();

  // Draw wind speed label
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(speed)} mph`, indicatorX, indicatorY + radius + 20);
}

function drawLocationMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Draw outer circle
  ctx.fillStyle = 'rgba(10, 126, 164, 0.2)';
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();

  // Draw middle circle
  ctx.fillStyle = 'rgba(10, 126, 164, 0.4)';
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();

  // Draw center dot
  ctx.fillStyle = '#0a7ea4';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}
