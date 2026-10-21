'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import Skeleton from '@mui/material/Skeleton';

import { HBarList, ChartCard, UsageMeter } from 'src/components/chart';

import { fAgo, fInt, fPercent } from 'src/utils/admin-format';

// ----------------------------------------------------------------------

/** Which product modules customers actually use: share of companies, records created, and when it was last touched. */
export function AdoptionTab({ adoption }) {
  const { data, loading } = adoption;
  const modules = data?.modules ?? [];

  const ranked = modules.map((module) => ({
    key: module.key,
    label: module.label,
    value: module.adoption_pct ?? 0,
    caption: `${module.companies_active} of ${data.total_companies}`,
  }));

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <ChartCard
          title="Adoption by module"
          subheader={
            data
              ? `Share of the ${fInt(data.total_companies)} companies that used it in the last ${data.days} days`
              : ' '
          }
          loading={loading}
          table={{
            columns: [
              { key: 'label', label: 'Module' },
              {
                key: 'value',
                label: 'Companies using it',
                align: 'right',
                format: (v) => fPercent(v),
              },
              { key: 'caption', label: 'Companies', align: 'right' },
            ],
            rows: ranked,
          }}
        >
          {data ? (
            <HBarList items={ranked} format={(v) => fPercent(v)} max={100} />
          ) : (
            <Skeleton variant="rounded" height={320} />
          )}
        </ChartCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <Card sx={{ height: 1 }}>
          <CardHeader
            title="Module usage in detail"
            subheader="Companies and records, in the range and ever"
            slotProps={{ title: { variant: 'subtitle1' }, subheader: { variant: 'caption' } }}
            sx={{ pb: 1 }}
          />
          <TableContainer sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 160ms' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Module</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Companies active</TableCell>
                  <TableCell align="right">Workspaces</TableCell>
                  <TableCell align="right">Records (range)</TableCell>
                  <TableCell align="right">Records (all)</TableCell>
                  <TableCell align="right">Last activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.key} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{module.label}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        used by {fInt(module.companies_ever)} companies ever
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ width: 28, fontVariantNumeric: 'tabular-nums' }}
                        >
                          {fInt(module.companies_active)}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <UsageMeter
                            dense
                            value={module.companies_active}
                            limit={Math.max(data.total_companies, 1)}
                            label={module.label}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{fInt(module.workspaces_active)}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fInt(module.records_in_range)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fInt(module.records_total)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {fAgo(module.last_activity_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          A company counts as using a module when it created a record in the range. Attendance and
          leave records are matched to the companies the person is an active member of; tasks to
          their project&apos;s company.
        </Typography>
      </Grid>
    </Grid>
  );
}
