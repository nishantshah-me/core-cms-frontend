import dayjs from 'dayjs';

// ----------------------------------------------------------------------

/** x-axis entries for a series of buckets: a short label for the axis and a longer title for the tooltip. */
export function bucketCategories(points, bucket) {
  return points.map((point) => {
    const date = dayjs(point.date);

    return {
      key: point.date,
      label: bucket === 'month' ? date.format("MMM 'YY") : date.format('D MMM'),
      title:
        bucket === 'week'
          ? `Week of ${date.format('D MMM YYYY')}`
          : bucket === 'month'
            ? date.format('MMMM YYYY')
            : date.format('ddd, D MMM YYYY'),
    };
  });
}

export const pluck = (points, key) => points.map((point) => point[key] ?? 0);

export const pluckRevenue = (points, currency) =>
  points.map((point) => point.revenue?.[currency] ?? 0);

/** Running total starting from `base`. */
export function cumulative(values, base = 0) {
  let total = base;
  return values.map((value) => {
    total += value;
    return total;
  });
}

export const sum = (values) => values.reduce((total, value) => total + (value || 0), 0);

/**
 * Shrinks a series to at most `points` values so a sparkline reads as a trend instead of noise. Counts per period
 * add up (`sum`); running totals keep the value at the end of each chunk (`last`).
 */
export function downsample(values, points = 12, mode = 'sum') {
  if (values.length <= points) return values;

  const size = values.length / points;
  return Array.from({ length: points }, (_, index) => {
    const chunk = values.slice(Math.round(index * size), Math.round((index + 1) * size));
    return mode === 'last' ? chunk[chunk.length - 1] : sum(chunk);
  });
}
