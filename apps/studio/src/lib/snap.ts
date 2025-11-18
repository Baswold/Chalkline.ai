/**
 * Shape-Snap Technology
 * Converts rough hand-drawn shapes into clean geometric shapes
 */

import type { DrawingPoint, Shape } from '../types';

interface Point {
  x: number;
  y: number;
}

/**
 * Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle between three points
 */
function angle(p1: Point, p2: Point, p3: Point): number {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p3.x - p2.x;
  const dy2 = p3.y - p2.y;

  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);

  let diff = Math.abs(angle2 - angle1);
  if (diff > Math.PI) {
    diff = 2 * Math.PI - diff;
  }

  return diff;
}

/**
 * Check if points form a straight line
 */
function isLine(points: DrawingPoint[]): boolean {
  if (points.length < 2) return false;

  // Calculate average angle deviation
  let totalDeviation = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const ang = angle(points[i - 1], points[i], points[i + 1]);
    totalDeviation += Math.abs(ang);
  }

  const avgDeviation = totalDeviation / (points.length - 2);
  return avgDeviation < 0.15; // Threshold for straightness
}

/**
 * Check if points form a circle
 */
function isCircle(points: DrawingPoint[]): boolean {
  if (points.length < 10) return false;

  // Calculate centroid
  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  };

  // Calculate average radius
  const radii = points.map(p => distance(p, centroid));
  const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;

  // Check how consistent the radii are
  const variance = radii.reduce((sum, r) => sum + Math.pow(r - avgRadius, 2), 0) / radii.length;
  const stdDev = Math.sqrt(variance);

  // If std deviation is small relative to radius, it's circular
  return (stdDev / avgRadius) < 0.15;
}

/**
 * Check if points form a rectangle
 */
function isRectangle(points: DrawingPoint[]): boolean {
  if (points.length < 8) return false;

  // Find bounding box
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  // Count how many points are near the edges
  const threshold = 10;
  let edgePoints = 0;

  for (const p of points) {
    if (Math.abs(p.x - minX) < threshold || Math.abs(p.x - maxX) < threshold ||
        Math.abs(p.y - minY) < threshold || Math.abs(p.y - maxY) < threshold) {
      edgePoints++;
    }
  }

  // If most points are on edges, it's likely a rectangle
  return edgePoints / points.length > 0.7;
}

/**
 * Main shape recognition function
 */
export function snapToShape(points: DrawingPoint[]): Shape {
  const id = `shape-${Date.now()}`;

  if (points.length < 2) {
    return {
      id,
      type: 'line',
      points,
      style: {
        stroke: '#000000',
        strokeWidth: 2,
        fill: 'none'
      },
      snapped: false
    };
  }

  // Check if it's a closed shape (start and end points are close)
  const isClosed = distance(points[0], points[points.length - 1]) < 20;

  if (!isClosed && isLine(points)) {
    // It's a straight line
    const start = points[0];
    const end = points[points.length - 1];

    return {
      id,
      type: 'line',
      points: [start, end],
      style: {
        stroke: '#000000',
        strokeWidth: 2,
        fill: 'none'
      },
      snapped: true
    };
  }

  if (isClosed && isCircle(points)) {
    // It's a circle
    const centroid = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length
    };

    const radii = points.map(p => distance(p, centroid));
    const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;

    // Create circle points
    const circlePoints: DrawingPoint[] = [];
    for (let i = 0; i <= 360; i += 10) {
      const rad = (i * Math.PI) / 180;
      circlePoints.push({
        x: centroid.x + avgRadius * Math.cos(rad),
        y: centroid.y + avgRadius * Math.sin(rad)
      });
    }

    return {
      id,
      type: 'circle',
      points: circlePoints,
      style: {
        stroke: '#000000',
        strokeWidth: 2,
        fill: 'none'
      },
      snapped: true
    };
  }

  if (isClosed && isRectangle(points)) {
    // It's a rectangle
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const rectPoints: DrawingPoint[] = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
      { x: minX, y: minY }
    ];

    return {
      id,
      type: 'rectangle',
      points: rectPoints,
      style: {
        stroke: '#000000',
        strokeWidth: 2,
        fill: 'none'
      },
      snapped: true
    };
  }

  // Default: return original points as polygon
  return {
    id,
    type: 'polygon',
    points,
    style: {
      stroke: '#000000',
      strokeWidth: 2,
      fill: 'none'
    },
    snapped: false
  };
}

/**
 * Convert shape to SVG path
 */
export function shapeToSVG(shape: Shape): string {
  if (shape.type === 'line' && shape.points.length >= 2) {
    const [start, end] = shape.points;
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  if (shape.type === 'circle') {
    // Approximate circle with path
    const points = shape.points;
    if (points.length === 0) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    path += ' Z';
    return path;
  }

  if (shape.type === 'rectangle' && shape.points.length >= 4) {
    const [p1, p2, p3, p4] = shape.points;
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
  }

  // Polygon or other shapes
  if (shape.points.length === 0) return '';

  let path = `M ${shape.points[0].x} ${shape.points[0].y}`;
  for (let i = 1; i < shape.points.length; i++) {
    path += ` L ${shape.points[i].x} ${shape.points[i].y}`;
  }

  return path;
}

/**
 * Export shapes to SVG file
 */
export function exportToSVG(shapes: Shape[], width: number, height: number): string {
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += '\n  <rect width="100%" height="100%" fill="white"/>';

  for (const shape of shapes) {
    const path = shapeToSVG(shape);
    svg += `\n  <path d="${path}" stroke="${shape.style.stroke || '#000'}" `;
    svg += `stroke-width="${shape.style.strokeWidth || 2}" `;
    svg += `fill="${shape.style.fill || 'none'}" `;
    if (shape.style.opacity) {
      svg += `opacity="${shape.style.opacity}" `;
    }
    svg += '/>  ';
  }

  svg += '\n</svg>';
  return svg;
}

export default {
  snapToShape,
  shapeToSVG,
  exportToSVG
};
