import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

// ----------------------------------------------------------------------

/** A failed load, with a way to try again. Renders nothing without an error. */
export function ReportError({ error, onRetry, sx }) {
  if (!error) return null;

  return (
    <Alert
      severity="error"
      sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : [sx])]}
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      {error}
    </Alert>
  );
}
