import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// ----------------------------------------------------------------------

export const RANGE_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 365, label: '1 year' },
];

/** The date range every number and chart below it follows. One control, above the content it scopes. */
export function RangeFilter({ value, onChange, options = RANGE_OPTIONS, label = 'Date range' }) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      aria-label={label}
      onChange={(_, next) => next !== null && onChange(next)}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          sx={{ px: 1.5, whiteSpace: 'nowrap' }}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
