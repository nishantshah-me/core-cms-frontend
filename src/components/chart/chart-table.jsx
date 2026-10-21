import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';

// ----------------------------------------------------------------------

/**
 * The table twin of a chart: the same numbers as text, for exact reading, screen readers and copy-paste.
 * @param {Array<{ key: string, label: string, align?: 'left'|'right', format?: (value: any, row: object) => any }>} columns
 */
export function ChartTable({ columns, rows, maxHeight = 320 }) {
  return (
    <TableContainer
      sx={{
        maxHeight,
        borderRadius: 1,
        border: (theme) => `solid 1px ${theme.vars.palette.divider}`,
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align ?? 'left'}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.key ?? index} hover>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align ?? 'left'}
                  sx={{
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: column.align === 'right' ? 'tabular-nums' : undefined,
                  }}
                >
                  {column.format ? column.format(row[column.key], row) : (row[column.key] ?? '—')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
