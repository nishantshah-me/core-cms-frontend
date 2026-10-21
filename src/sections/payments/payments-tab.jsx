'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Typography from '@mui/material/Typography';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { HBarList, ChartCard } from 'src/components/chart';

import { fInt, fAgo, fMoney, fWhenTime, fPercent } from 'src/utils/admin-format';

import { listPayments } from 'src/auth/services/adminReportsService';

import { CopyText } from 'src/sections/admin/copy-text';
import { TableState } from 'src/sections/admin/table-state';
import { SearchField } from 'src/sections/admin/search-field';
import { StatusTabs } from 'src/sections/admin/status-tabs';
import { ReportError } from 'src/sections/admin/report-error';
import { usePagedList } from 'src/sections/admin/use-paged-list';
import { PaymentStatusLabel } from 'src/sections/admin/status-labels';
import { DateRangeFields } from 'src/sections/admin/date-range-fields';
import { toolbarSx, FilterSelect } from 'src/sections/admin/filter-select';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'captured', label: 'Paid', color: 'success' },
  { value: 'failed', label: 'Failed', color: 'error' },
  { value: 'refunded', label: 'Refunded', color: 'secondary' },
];

const COLUMN_COUNT = 7;

const cardHeaderSlots = { title: { variant: 'subtitle1' }, subheader: { variant: 'caption' } };

/** Money per currency for whatever the filters select. Amounts of different currencies are never added together. */
function SummaryCard({ summary, loading }) {
  const currencies = Object.keys(summary ?? {});

  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title="Summary by currency"
        subheader="For the filters below, ignoring the status tab"
        slotProps={cardHeaderSlots}
        sx={{ pb: 1 }}
      />
      <TableContainer sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 160ms' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Currency</TableCell>
              <TableCell align="right">Collected</TableCell>
              <TableCell align="right">Payments</TableCell>
              <TableCell align="right">Average</TableCell>
              <TableCell align="right">Failed</TableCell>
              <TableCell align="right">Refunded</TableCell>
              <TableCell align="right">Success rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currencies.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {loading ? 'Loading…' : 'No payments for these filters.'}
                </TableCell>
              </TableRow>
            )}
            {currencies.map((currency) => {
              const row = summary[currency];
              return (
                <TableRow key={currency} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{currency}</Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                  >
                    {fMoney(row.captured_minor, currency, { exact: true })}
                  </TableCell>
                  <TableCell align="right">{fInt(row.captured)}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.average_minor ? fMoney(row.average_minor, currency, { exact: true }) : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: row.failed ? 'error.main' : undefined }}>
                    {fInt(row.failed)}
                    {row.failed_minor > 0 && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ ml: 0.75, color: 'text.secondary' }}
                      >
                        {fMoney(row.failed_minor, currency, { compact: true })}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.refunded_minor
                      ? fMoney(row.refunded_minor, currency, { exact: true })
                      : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {row.success_rate === null ? (
                      '—'
                    ) : (
                      <Label
                        color={
                          row.success_rate >= 95
                            ? 'success'
                            : row.success_rate >= 80
                              ? 'warning'
                              : 'error'
                        }
                      >
                        {fPercent(row.success_rate)}
                      </Label>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

export function PaymentsTab({ initial }) {
  const list = usePagedList(listPayments, {
    initialFilters: {
      paymentStatus: initial.status ?? 'all',
      workspaceId: initial.workspaceId ?? '',
      search: '',
      currency: '',
      method: '',
      start: '',
      end: '',
    },
  });
  const { filters, setFilter, patchFilters, result, rows, total, loading, error, reload } = list;

  const waiting = loading && rows.length === 0;
  const currencies = result?.currencies ?? [];
  const methods = result?.methods ?? [];

  const methodItems = (result?.by_method ?? []).map((method) => ({
    key: method.method,
    label: method.method.replace(/_/g, ' '),
    value: method.count,
    caption: Object.entries(method.amount_minor)
      .map(([currency, amount]) => fMoney(amount, currency, { compact: true }))
      .join(' · '),
  }));

  const filtered = Boolean(
    filters.search ||
      filters.currency ||
      filters.method ||
      filters.start ||
      filters.end ||
      filters.workspaceId ||
      filters.paymentStatus !== 'all'
  );

  return (
    <>
      <ReportError error={error} onRetry={reload} />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          <SummaryCard summary={result?.summary} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            title="Paid by method"
            subheader="Number of successful payments"
            loading={loading}
          >
            <HBarList items={methodItems} empty="No paid payments" />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Why they fail" subheader="Reported by the bank" loading={loading}>
            <HBarList
              color="var(--chart-critical)"
              items={(result?.failure_reasons ?? []).map((reason) => ({
                key: reason.reason,
                label: reason.reason,
                value: reason.count,
              }))}
              empty="No failed payments"
            />
          </ChartCard>
        </Grid>
      </Grid>

      <Card>
        <StatusTabs
          value={filters.paymentStatus}
          onChange={(value) => setFilter('paymentStatus', value)}
          tabs={TABS}
          counts={result?.counts}
        />

        <Box sx={toolbarSx}>
          <SearchField
            placeholder="Search by workspace, payment id or description"
            onSearch={(value) => setFilter('search', value)}
          />
          <FilterSelect
            label="Currency"
            value={filters.currency}
            options={[
              { value: '', label: 'All currencies' },
              ...currencies.map((code) => ({ value: code, label: code })),
            ]}
            onChange={(value) => setFilter('currency', value)}
          />
          <FilterSelect
            label="Method"
            value={filters.method}
            options={[
              { value: '', label: 'Any method' },
              ...methods.map((method) => ({ value: method, label: method })),
            ]}
            onChange={(value) => setFilter('method', value)}
          />
        </Box>
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <DateRangeFields
            start={filters.start}
            end={filters.end}
            onChange={(range) => patchFilters(range)}
          />
        </Box>

        {filters.workspaceId && (
          <Typography variant="body2" sx={{ px: 2.5, pb: 2, color: 'text.secondary' }}>
            Showing one workspace&apos;s payments.{' '}
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => setFilter('workspaceId', '')}
            >
              Show everyone&apos;s
            </Link>
          </Typography>
        )}

        <TableContainer
          sx={{ opacity: loading && !waiting ? 0.55 : 1, transition: 'opacity 160ms' }}
        >
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Workspace</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableState
                colSpan={COLUMN_COUNT}
                loading={waiting}
                empty={!loading && rows.length === 0}
                title={filtered ? 'No payments match' : 'No payments yet'}
                hint={
                  filtered
                    ? 'Try a different search or widen the dates.'
                    : 'Payments appear when Razorpay reports a charge.'
                }
              />
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2">
                      {fWhenTime(row.paid_at ?? row.created_at)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {fAgo(row.paid_at ?? row.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Link
                      component={RouterLink}
                      href={paths.dashboard.workspaceDetails(row.workspace.id)}
                      color="inherit"
                      underline="hover"
                      variant="subtitle2"
                      noWrap
                    >
                      {row.workspace.name}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 190 }}>
                    <CopyText value={row.razorpay_payment_id} label="Payment id" />
                    {row.razorpay_invoice_id && (
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ display: 'block', color: 'text.secondary' }}
                      >
                        {row.invoice_url ? (
                          <Link
                            href={row.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                          >
                            invoice {row.razorpay_invoice_id}
                          </Link>
                        ) : (
                          `invoice ${row.razorpay_invoice_id}`
                        )}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusLabel status={row.status} />
                    {row.failure_reason && (
                      <Typography
                        variant="caption"
                        sx={{ mt: 0.5, display: 'block', maxWidth: 180, color: 'error.main' }}
                      >
                        {row.failure_reason}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {row.method?.replace(/_/g, ' ') ?? '—'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" noWrap title={row.description ?? ''}>
                      {row.description ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                  >
                    {fMoney(row.amount_minor, row.currency, { exact: true })}
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
    </>
  );
}
