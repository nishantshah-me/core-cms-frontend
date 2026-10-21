import { useState, useEffect } from 'react';

// ----------------------------------------------------------------------

/**
 * Tracks an element's content width so SVG charts can draw at 1:1 instead of scaling text.
 *
 * Returns a *callback* ref: charts often render nothing while their data loads and only mount the measured element
 * later, which an object ref plus a mount-time effect would miss (the chart would stay at the fallback width).
 */
export function useElementWidth(fallback = 600) {
  const [element, setElement] = useState(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return undefined;

    setWidth(Math.round(element.getBoundingClientRect().width));

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, width || fallback];
}
