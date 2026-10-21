// Shared maths for the SVG charts. Nothing here touches the DOM.

/** CSS variable of the n-th (1-based) categorical series colour; defined by <ChartRoot>. */
export const seriesColor = (index) => `var(--chart-${(((index % 8) + 8) % 8) + 1})`;

/** Colour that always means the same subscription / payment state, in every chart and label. */
export const STATE_COLORS = {
  active: 'var(--chart-good)',
  captured: 'var(--chart-good)',
  processed: 'var(--chart-good)',
  past_due: 'var(--chart-critical)',
  failed: 'var(--chart-critical)',
  stuck: 'var(--chart-serious)',
  trialing: 'var(--chart-1)',
  pending: 'var(--chart-warning)',
  refunded: 'var(--chart-7)',
  free: 'var(--chart-neutral)',
  grandfathered: 'var(--chart-7)',
};

/** A step size from 1, 2, 2.5, 5 x 10^n that gives about `count` intervals over `max`. */
function niceStep(max, count) {
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice = [1, 2, 2.5, 5, 10].find((candidate) => fraction <= candidate);
  return nice * power;
}

/**
 * Round tick values from 0 up past `max` (whole numbers only when `integers`).
 * @returns {{ ticks: number[], max: number }}
 */
export function niceTicks(max, count = 4, integers = false) {
  if (!Number.isFinite(max) || max <= 0) return { ticks: [0, 1], max: 1 };

  // Counts of things (signups, logins) never sit on 0.25: keep their ticks whole.
  const step = integers ? Math.max(1, Math.ceil(niceStep(max, count))) : niceStep(max, count);
  const top = step * Math.ceil(max / step);
  const ticks = [];
  for (let value = 0; value <= top + step / 1e6; value += step)
    ticks.push(Number(value.toFixed(10)));

  return { ticks, max: top };
}

/** Indexes of the x labels to print so they never collide: roughly one per `minGap` pixels. */
export function labelIndexes(count, width, minGap = 64) {
  if (count <= 0) return [];
  const slots = Math.max(1, Math.floor(width / minGap));
  const step = Math.max(1, Math.ceil(count / slots));
  const indexes = [];
  for (let i = 0; i < count; i += step) indexes.push(i);
  return indexes;
}

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/** `M x y L x y ...` through the points. */
export function linePath(points) {
  return points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
}

/** The area between a line and a baseline (or a second line, for stacks). */
export function areaPath(top, bottom) {
  const down = top.map(
    ([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  );
  const back = [...bottom].reverse().map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`);
  return `${down.join(' ')} ${back.join(' ')} Z`;
}

/** A column with a rounded data end (top) and a square baseline end. */
export function columnPath(x, y, width, height, radius, roundTop = true) {
  if (height <= 0 || width <= 0) return '';
  const r = roundTop ? Math.min(radius, width / 2, height) : 0;
  return [
    `M${x} ${y + height}`,
    `L${x} ${y + r}`,
    r ? `Q${x} ${y} ${x + r} ${y}` : `L${x} ${y}`,
    `L${x + width - r} ${y}`,
    r ? `Q${x + width} ${y} ${x + width} ${y + r}` : `L${x + width} ${y}`,
    `L${x + width} ${y + height}`,
    'Z',
  ].join(' ');
}

/** Donut slice between two angles (radians, 0 = 12 o'clock, clockwise). */
export function arcPath(cx, cy, outer, inner, start, end) {
  const point = (radius, angle) => [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
  const large = end - start > Math.PI ? 1 : 0;
  const [x1, y1] = point(outer, start);
  const [x2, y2] = point(outer, end);
  const [x3, y3] = point(inner, end);
  const [x4, y4] = point(inner, start);

  return [
    `M${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A${outer} ${outer} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A${inner} ${inner} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z',
  ].join(' ');
}
