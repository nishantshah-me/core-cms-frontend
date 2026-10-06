import Stack from '@mui/material/Stack';

import { Label } from 'src/components/label';

import { SIGNUP_STATUS_META } from './owner-utils';

// ----------------------------------------------------------------------

/** The owner's signup review status, plus an "Inactive" tag once an admin has deactivated them. */
export function OwnerStatusLabel({ owner }) {
  const meta = SIGNUP_STATUS_META[owner.signup_status] ?? {
    label: owner.signup_status,
    color: 'default',
  };

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
      <Label color={meta.color}>{meta.label}</Label>
      {owner.is_active === false && <Label color="default">Inactive</Label>}
    </Stack>
  );
}
