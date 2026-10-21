import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------

/** The row a table shows instead of data: a spinner on the first load, or an explanation when nothing matches. */
export function TableState({ colSpan, loading, empty, title = 'Nothing to show', hint }) {
  if (!loading && !empty) return null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: loading ? 6 : 8 }}>
        {loading ? (
          <CircularProgress size={28} />
        ) : (
          <>
            <Typography variant="h6" sx={{ color: 'text.secondary' }} gutterBottom>
              {title}
            </Typography>
            {hint && (
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                {hint}
              </Typography>
            )}
          </>
        )}
      </TableCell>
    </TableRow>
  );
}
