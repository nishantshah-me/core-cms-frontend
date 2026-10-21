'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { DashboardContent } from 'src/layouts/dashboard';

import { fInt, fWhen } from 'src/utils/admin-format';

import { listCompanies } from 'src/auth/services/adminReportsService';

import { PageHeader } from 'src/sections/admin/page-header';
import { TableState } from 'src/sections/admin/table-state';
import { SearchField } from 'src/sections/admin/search-field';
import { ReportError } from 'src/sections/admin/report-error';
import { usePagedList } from 'src/sections/admin/use-paged-list';
import { toolbarSx, FilterSelect } from 'src/sections/admin/filter-select';

// ----------------------------------------------------------------------

const INDUSTRIES = [
  { value: '', label: 'All industries' },
  ...['IT Services', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Others'].map(
    (label) => ({ value: label, label })
  ),
];

const COLUMN_COUNT = 7;

/** Every company across every workspace: a flat directory for finding one when all you know is its name. */
export function CompaniesView() {
  const list = usePagedList(listCompanies, { initialFilters: { search: '', industry: '' } });
  const { filters, setFilter, rows, total, loading, error, reload } = list;

  const waiting = loading && rows.length === 0;
  const filtered = Boolean(filters.search || filters.industry);

  return (
    <DashboardContent maxWidth="xl">
      <PageHeader
        title="Companies"
        subtitle="Every company across all workspaces. A workspace (the billing unit) can hold several companies."
        trail={[{ label: 'Companies' }]}
      />

      <ReportError error={error} onRetry={reload} />

      <Card>
        <Box sx={toolbarSx}>
          <SearchField
            placeholder="Search by company, workspace or owner email"
            onSearch={(value) => setFilter('search', value)}
          />
          <FilterSelect
            label="Industry"
            value={filters.industry}
            options={INDUSTRIES}
            onChange={(value) => setFilter('industry', value)}
            minWidth={180}
          />
        </Box>

        <TableContainer
          sx={{ opacity: loading && !waiting ? 0.55 : 1, transition: 'opacity 160ms' }}
        >
          <Table sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Workspace</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Active people</TableCell>
                <TableCell>Contact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableState
                colSpan={COLUMN_COUNT}
                loading={waiting}
                empty={!loading && rows.length === 0}
                title={filtered ? 'No companies match' : 'No companies yet'}
                hint={filtered ? 'Try a different search or clear the filters.' : undefined}
              />
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Box sx={{ gap: 0.75, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" noWrap>
                        {row.name}
                      </Typography>
                      {row.is_default && <Label color="info">Default</Label>}
                    </Box>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ display: 'block', color: 'text.secondary' }}
                    >
                      {row.registered_name && row.registered_name !== row.name
                        ? row.registered_name
                        : `Founded ${fWhen(row.founding_date)}`}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Link
                      component={RouterLink}
                      href={paths.dashboard.workspaceDetails(row.workspace.id)}
                      color="inherit"
                      underline="hover"
                      variant="body2"
                      noWrap
                    >
                      {row.workspace.name}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" noWrap>
                      {row.owner?.name ?? '—'}
                    </Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ display: 'block', color: 'text.secondary' }}
                    >
                      {row.owner?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.industry_type ?? '—'}</TableCell>
                  <TableCell>
                    {row.employee_count_range ? `${row.employee_count_range}` : '—'}
                  </TableCell>
                  <TableCell align="right">{fInt(row.active_members)}</TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" noWrap>
                      {row.email ?? '—'}
                    </Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ display: 'block', color: 'text.secondary' }}
                    >
                      {row.phone ?? row.website ?? ''}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={list.page}
          rowsPerPage={list.rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, value) => list.setPage(value)}
          onRowsPerPageChange={(event) => list.setRowsPerPage(parseInt(event.target.value, 10))}
        />
      </Card>
    </DashboardContent>
  );
}
