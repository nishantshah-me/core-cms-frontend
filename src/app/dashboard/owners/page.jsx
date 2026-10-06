'use client';

import lodash from 'lodash';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import TablePagination from '@mui/material/TablePagination';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  CheckCircleOutline as ApproveIcon,
  HighlightOff as RejectIcon,
  Block as DeactivateIcon,
  LockOpen as ActivateIcon,
} from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { CustomPopover } from 'src/components/custom-popover';

import { listOwners, getErrorMessage } from 'src/auth/services/adminOwnerService';

import { fOwnerDate } from 'src/sections/owner/owner-utils';
import { OwnerStatusLabel } from 'src/sections/owner/owner-status-label';
import { OwnerActionDialog, useOwnerActions } from 'src/sections/owner/owner-actions';

// ----------------------------------------------------------------------

const MONTH_OPTIONS = [
  { value: '', label: 'All months' },
  ...[
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ].map((label, index) => ({ value: String(index + 1), label })),
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: '', label: 'All years' },
  ...Array.from({ length: 6 }, (_, index) => {
    const year = String(currentYear - index);
    return { value: year, label: year };
  }),
];

const ACCOUNT_OPTIONS = [
  { value: '', label: 'All accounts' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const STATUS_TABS = [
  { value: 'all', label: 'All', color: 'default' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
];

const EMPTY_COUNTS = { all: 0, pending: 0, approved: 0, rejected: 0 };
const COLUMN_COUNT = 7;

// ----------------------------------------------------------------------

export default function OwnersPage() {
  const router = useRouter();

  const [owners, setOwners] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [status, setStatus] = useState('all');
  const [searchInput, setSearchInput] = useState(''); // what is typed
  const [search, setSearch] = useState(''); // debounced; what the API gets
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [account, setAccount] = useState('');

  const [menu, setMenu] = useState({ anchorEl: null, owner: null });

  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;

    setLoading(true);
    setError('');
    try {
      const result = await listOwners({
        search,
        signupStatus: status,
        isActive: account ? account === 'active' : undefined,
        month,
        year,
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      });
      if (id !== requestId.current) return; // a newer request superseded this one

      setOwners(result.data ?? []);
      setTotal(result.total ?? 0);
      setCounts(result.counts ?? EMPTY_COUNTS);
    } catch (err) {
      if (id !== requestId.current) return;

      const message = getErrorMessage(err, 'Failed to load owners.');
      setError(message);
      toast.error(message);
      setOwners([]);
      setTotal(0);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [search, status, account, month, year, page, rowsPerPage]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useOwnerActions({ onDone: load });

  const debouncedSearch = useMemo(
    () =>
      lodash.debounce((value) => {
        setSearch(value);
        setPage(0);
      }, 500),
    []
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
    debouncedSearch(event.target.value);
  };

  const handleClearSearch = () => {
    debouncedSearch.cancel();
    setSearchInput('');
    setSearch('');
    setPage(0);
  };

  // Changing any filter returns to the first page.
  const handleFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(0);
  };

  const hasFilters = Boolean(search || month || year || account);

  const openMenu = (event, owner) => {
    event.stopPropagation();
    setMenu({ anchorEl: event.currentTarget, owner });
  };

  const closeMenu = () => setMenu((prev) => ({ ...prev, anchorEl: null }));

  const runFromMenu = (callback) => () => {
    const { owner } = menu;
    closeMenu();
    callback(owner);
  };

  const { owner: menuOwner } = menu;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} color="inherit" href={paths.dashboard.root} underline="hover">
          Dashboard
        </Link>
        <Typography color="text.primary">Owners</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Owners</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push(paths.dashboard.ownerNew)}
        >
          Add owner
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Card>
        <Tabs
          value={status}
          onChange={(_, value) => {
            setStatus(value);
            setPage(0);
          }}
          sx={{ px: 2.5, boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.vars.palette.divider}` }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label variant={tab.value === status ? 'filled' : 'soft'} color={tab.color}>
                  {counts[tab.value] ?? 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        <Box
          sx={{
            p: 2.5,
            gap: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { md: 'center' },
          }}
        >
          <TextField
            fullWidth
            placeholder="Search by name, email or phone"
            value={searchInput}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch} aria-label="Clear search">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <FilterSelect
            label="Signed up (month)"
            value={month}
            options={MONTH_OPTIONS}
            onChange={handleFilter(setMonth)}
          />
          <FilterSelect
            label="Signed up (year)"
            value={year}
            options={YEAR_OPTIONS}
            onChange={handleFilter(setYear)}
          />
          <FilterSelect
            label="Account"
            value={account}
            options={ACCOUNT_OPTIONS}
            onChange={handleFilter(setAccount)}
          />
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow>
                <TableCell>Owner</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Workspaces</TableCell>
                <TableCell align="right">Companies</TableCell>
                <TableCell>Signed up</TableCell>
                <TableCell width={64} />
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && owners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : owners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_COUNT} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary' }} gutterBottom>
                      {hasFilters || status !== 'all' ? 'No owners match' : 'No owners yet'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                      {hasFilters || status !== 'all'
                        ? 'Try a different search or clear the filters.'
                        : 'Owners appear here when they sign up, or when you add one.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                owners.map((owner) => (
                  <TableRow
                    key={owner.id}
                    hover
                    onClick={() => router.push(paths.dashboard.ownerDetails(owner.id))}
                    sx={{ cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2" noWrap>
                        {owner.name || '—'}
                      </Typography>
                      <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                        {owner.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{owner.phone || '—'}</TableCell>
                    <TableCell>
                      <OwnerStatusLabel owner={owner} />
                    </TableCell>
                    <TableCell align="right">{owner.workspace_count}</TableCell>
                    <TableCell align="right">{owner.company_count}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {fOwnerDate(owner.created_at)}
                    </TableCell>
                    <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                      <IconButton
                        onClick={(event) => openMenu(event, owner)}
                        aria-label={`Actions for ${owner.name || owner.email}`}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(_, value) => setPage(value)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      <CustomPopover
        open={Boolean(menu.anchorEl)}
        anchorEl={menu.anchorEl}
        onClose={closeMenu}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={runFromMenu((o) => router.push(paths.dashboard.ownerDetails(o.id)))}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            View
          </MenuItem>
          <MenuItem onClick={runFromMenu((o) => router.push(paths.dashboard.ownerEdit(o.id)))}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>

          {menuOwner?.signup_status !== 'approved' && (
            <MenuItem
              onClick={runFromMenu((o) => actions.open('approve', o))}
              sx={{ color: 'success.main' }}
            >
              <ApproveIcon fontSize="small" sx={{ mr: 1 }} />
              Approve
            </MenuItem>
          )}
          {menuOwner?.signup_status === 'pending' && (
            <MenuItem
              onClick={runFromMenu((o) => actions.open('reject', o))}
              sx={{ color: 'error.main' }}
            >
              <RejectIcon fontSize="small" sx={{ mr: 1 }} />
              Reject
            </MenuItem>
          )}

          {menuOwner?.is_active === false ? (
            <MenuItem onClick={runFromMenu((o) => actions.open('activate', o))}>
              <ActivateIcon fontSize="small" sx={{ mr: 1 }} />
              Reactivate
            </MenuItem>
          ) : (
            <MenuItem onClick={runFromMenu((o) => actions.open('deactivate', o))}>
              <DeactivateIcon fontSize="small" sx={{ mr: 1 }} />
              Deactivate
            </MenuItem>
          )}

          <MenuItem
            onClick={runFromMenu((o) => actions.open('delete', o))}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <OwnerActionDialog actions={actions} />
    </Container>
  );
}

// ----------------------------------------------------------------------

function FilterSelect({ label, value, options, onChange }) {
  return (
    <FormControl sx={{ minWidth: { md: 170 }, flexShrink: 0 }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={onChange}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
