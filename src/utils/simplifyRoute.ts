import type { LngLat } from '@/types/place';

/**
 * Simplifica o traçado da rota (Ramer–Douglas–Peucker) para mandar ao backend só o
 * necessário: ~50 m de tolerância bastam para achar quem está a até 5 km do caminho.
 * Garante no máximo `maxPoints` pontos (o backend aceita até 5.000).
 */
export function simplifyRoute(points: LngLat[], maxPoints = 1000): LngLat[] {
  if (points.length <= 2) return points;
  let tolerance = 0.0005; // graus (~50 m)
  let result = rdp(points, tolerance);
  while (result.length > maxPoints) {
    tolerance *= 2;
    result = rdp(points, tolerance);
  }
  return result;
}

function rdp(points: LngLat[], epsilon: number): LngLat[] {
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let maxDist = 0;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const d = perpendicular(points[i], points[start], points[end]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (index !== -1 && maxDist > epsilon) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function perpendicular([x, y]: LngLat, [x1, y1]: LngLat, [x2, y2]: LngLat) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}
