import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

// ----------------------------------------------------------------------

/** A labelled dropdown for a list's toolbar. `options` are `{ value, label }`; the empty value means "all". */
export function FilterSelect({ label, value, options, onChange, minWidth = 150 }) {
  return (
    <FormControl size="small" sx={{ minWidth: { md: minWidth }, flexShrink: 0 }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

/** The standard toolbar row above a table: wraps on small screens. */
export const toolbarSx = {
  p: 2.5,
  gap: 2,
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { md: 'center' },
};
