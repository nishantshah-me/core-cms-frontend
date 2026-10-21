import { styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

// The categorical order is the colour-blind-safety mechanism, so it never changes (and is never cycled past eight).
// Both columns were checked with the dataviz validator against this app's real card surfaces (#FFFFFF / #1C252E):
// worst adjacent colour-blind ΔE 9.1 light / 8.4 dark, normal-vision ΔE >= 19. Three light slots (aqua, yellow,
// magenta) sit under 3:1 on white, which is why every chart also has a legend, a tooltip and a table view.
export const SERIES_LIGHT = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#6250d6', // violet
  '#e34948', // red
];

export const SERIES_DARK = [
  '#3987e5',
  '#d95926',
  '#199e70',
  '#c98500',
  '#d55181',
  '#008300',
  '#9085e9',
  '#e66767',
];

const toVars = (colors) =>
  Object.fromEntries(colors.map((color, index) => [`--chart-${index + 1}`, color]));

/**
 * Wraps every chart: defines the series colours (light and dark), the ink and the recessive grid as CSS variables,
 * so the SVG below can say `fill="var(--chart-1)"` and follow the theme.
 */
export const ChartRoot = styled('div')(({ theme }) => ({
  ...toVars(SERIES_LIGHT),
  // Reserved for state (never for series identity): always paired with a label or an icon.
  '--chart-good': '#0ca30c',
  '--chart-warning': '#fab219',
  '--chart-serious': '#ec835a',
  '--chart-critical': '#d03b3b',
  '--chart-neutral': theme.vars.palette.grey[500],
  '--chart-grid': theme.vars.palette.divider,
  '--chart-axis': theme.vars.palette.grey[400],
  '--chart-muted': theme.vars.palette.text.secondary,
  '--chart-ink': theme.vars.palette.text.primary,
  '--chart-surface': theme.vars.palette.background.paper,
  position: 'relative',
  width: '100%',
  minWidth: 0,
  ...theme.applyStyles('dark', {
    ...toVars(SERIES_DARK),
    '--chart-axis': theme.vars.palette.grey[700],
  }),
  '& svg': { display: 'block', overflow: 'visible' },
  '& .chart-tick': {
    fill: 'var(--chart-muted)',
    fontSize: 11,
    fontFamily: theme.typography.fontFamily,
  },
}));
