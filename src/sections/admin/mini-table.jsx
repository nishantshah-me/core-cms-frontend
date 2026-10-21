import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import CardHeader from '@mui/material/CardHeader';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';

import { RouterLink } from 'src/routes/components';

import { TableState } from './table-state';

// ----------------------------------------------------------------------

/**
 * A short table in a card, for the "latest N" lists on the overview. Rows are not links themselves: put the link
 * in the cell that names the thing (so it works with the keyboard and opens in a new tab).
 *
 * @param {Array<{ key: string, label: string, align?: string, width?: number, render: (row: object) => any }>} columns
 */
export function MiniTable({
  title,
  subheader,
  href,
  hrefLabel = 'View all',
  columns,
  rows,
  loading,
  empty,
  sx,
}) {
  const waiting = loading && rows.length === 0;

  return (
    <Card sx={[{ height: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <CardHeader
        title={title}
        subheader={subheader}
        slotProps={{ title: { variant: 'subtitle1' }, subheader: { variant: 'caption' } }}
        action={
          href && (
            <Link
              component={RouterLink}
              href={href}
              variant="body2"
              underline="hover"
              sx={{ mr: 1 }}
            >
              {hrefLabel}
            </Link>
          )
        }
        sx={{ pb: 1 }}
      />
      <TableContainer sx={{ opacity: loading && !waiting ? 0.5 : 1, transition: 'opacity 160ms' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align ?? 'left'}
                  sx={{ width: column.width, whiteSpace: 'nowrap' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableState
              colSpan={columns.length}
              loading={waiting}
              empty={!loading && rows.length === 0}
              title={empty ?? 'Nothing here yet'}
            />
            {rows.map((row, index) => (
              <TableRow key={row.id ?? row.key ?? index} hover>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align ?? 'left'}
                    sx={{ maxWidth: column.maxWidth ?? 240 }}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
