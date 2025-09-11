'use client';

import { styled } from '@mui/material/styles';
import { AnimateLogoZoom } from '../animate';

// ----------------------------------------------------------------------

export function LogoLoader({ sx, slotProps, ...other }) {
  return (
    <LoaderWrapper sx={sx} {...other}>
      <AnimateLogoZoom {...slotProps} />
    </LoaderWrapper>
  );
}

// ----------------------------------------------------------------------

const LoaderWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  padding: theme.spacing(2),
}));
