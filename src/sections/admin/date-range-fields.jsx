import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { dayString } from 'src/utils/admin-format';

// ----------------------------------------------------------------------

const PRESETS = [
  { key: '7', label: '7 days', back: 6 },
  { key: '30', label: '30 days', back: 29 },
  { key: '90', label: '90 days', back: 89 },
];

/**
 * From / to day pickers with presets. Both days are inclusive; an empty day means "no limit". The preset lights up
 * when the two days match it exactly (ending today).
 */
export function DateRangeFields({ start, end, onChange }) {
  const today = dayString(0);
  const active =
    PRESETS.find((preset) => start === dayString(preset.back) && end === today)?.key ??
    (start || end ? null : 'all');

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { sm: 'center' } }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={active}
        aria-label="Date range"
        onChange={(_, next) => {
          if (next === 'all') onChange({ start: '', end: '' });
          else if (next)
            onChange({ start: dayString(PRESETS.find((p) => p.key === next).back), end: today });
        }}
      >
        <ToggleButton value="all" sx={{ px: 1.5 }}>
          All time
        </ToggleButton>
        {PRESETS.map((preset) => (
          <ToggleButton key={preset.key} value={preset.key} sx={{ px: 1.5, whiteSpace: 'nowrap' }}>
            {preset.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <TextField
        size="small"
        type="date"
        label="From"
        value={start}
        onChange={(event) => onChange({ start: event.target.value, end })}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: end || today } }}
        sx={{ width: 160 }}
      />
      <TextField
        size="small"
        type="date"
        label="To"
        value={end}
        onChange={(event) => onChange({ start, end: event.target.value })}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { min: start || undefined, max: today },
        }}
        sx={{ width: 160 }}
      />
    </Stack>
  );
}
