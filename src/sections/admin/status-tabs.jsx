import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

/**
 * Tabs with a count badge each (the same look as the Owners list). `counts` is the response's `counts` object; it
 * follows the search and filters but not the tab itself, so the badges stay meaningful while one tab is open.
 *
 * @param {Array<{ value: string, label: string, color?: string }>} tabs
 */
export function StatusTabs({ value, onChange, tabs, counts = {} }) {
  return (
    <Tabs
      value={value}
      onChange={(_, next) => onChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ px: 2.5, boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.vars.palette.divider}` }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          value={tab.value}
          label={tab.label}
          iconPosition="end"
          icon={
            <Label variant={tab.value === value ? 'filled' : 'soft'} color={tab.color ?? 'default'}>
              {counts[tab.value] ?? 0}
            </Label>
          }
        />
      ))}
    </Tabs>
  );
}
