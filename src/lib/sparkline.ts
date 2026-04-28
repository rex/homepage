export interface SparklineData {
  values: number[];
  width?: number;
  height?: number;
  paddingX?: number;
  paddingY?: number;
}

export interface SparklineRender {
  width: number;
  height: number;
  d: string;
  end: { x: number; y: number };
  trend: 'up' | 'down' | 'stable';
  pathLength: number;
}

export function renderSparkline({
  values,
  width = 220,
  height = 30,
  paddingX = 1,
  paddingY = 3,
}: SparklineData): SparklineRender {
  if (!values.length) {
    return { width, height, d: '', end: { x: 0, y: 0 }, trend: 'stable', pathLength: 0 };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - paddingX * 2;
  const innerH = height - paddingY * 2;

  const points = values.map((v, i) => {
    const x = paddingX + (i / (values.length - 1 || 1)) * innerW;
    const y = paddingY + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

  const end = points[points.length - 1];

  // Trend: compare first 5 average to last 5 average
  const first5 = values.slice(0, Math.min(5, values.length));
  const last5 = values.slice(-Math.min(5, values.length));
  const firstAvg = first5.reduce((a, b) => a + b, 0) / first5.length;
  const lastAvg = last5.reduce((a, b) => a + b, 0) / last5.length;
  const delta = lastAvg - firstAvg;
  const threshold = 0.05;
  const trend = delta > threshold ? 'up' : delta < -threshold ? 'down' : 'stable';

  // Approximate path length for stroke-dashoffset animation.
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return { width, height, d, end, trend, pathLength: Math.ceil(length) };
}

export function trendLabel(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return 'activity trending up over 24 months';
  if (trend === 'down') return 'activity trending down over 24 months';
  return 'activity stable over 24 months';
}
