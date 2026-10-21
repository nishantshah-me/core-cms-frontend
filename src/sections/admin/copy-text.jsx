'use client';

import toast from 'react-hot-toast';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { ContentCopy as CopyIcon } from '@mui/icons-material';

// ----------------------------------------------------------------------

/** An identifier (Razorpay id, workspace id) in monospace with a copy button. */
export function CopyText({ value, label }) {
  if (!value) return <span>—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      toast.success(`${label ?? 'Value'} copied`);
    } catch {
      toast.error('Could not copy to the clipboard');
    }
  };

  return (
    <Box sx={{ gap: 0.5, minWidth: 0, display: 'inline-flex', alignItems: 'center' }}>
      <Typography
        variant="body2"
        noWrap
        title={value}
        sx={{ fontFamily: 'monospace', fontSize: 12.5 }}
      >
        {value}
      </Typography>
      <Tooltip title="Copy">
        <IconButton
          size="small"
          onClick={copy}
          aria-label={`Copy ${label ?? value}`}
          sx={{ p: 0.5 }}
        >
          <CopyIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
