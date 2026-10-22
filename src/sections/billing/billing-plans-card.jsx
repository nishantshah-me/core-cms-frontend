'use client';

import toast from 'react-hot-toast';
import { useState, useEffect, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from '@mui/icons-material';

import { Label } from 'src/components/label';

import {
  setBillingPrice,
  getErrorMessage,
  updateBillingPlan,
} from 'src/auth/services/adminBillingService';

import { INTERVALS, inputToMinor, minorToInput } from './billing-utils';

// ----------------------------------------------------------------------

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$' };

const DEFAULT_CATALOG = [
  {
    key: 'employee_directory',
    name: 'Employee Directory & Profiles',
    category: 'HR & People',
    description:
      'Employee directory, comprehensive personal profiles, contact details, and organization tree.',
  },
  {
    key: 'onboarding_lifecycle',
    name: 'Employee Onboarding & Offboarding',
    category: 'HR & People',
    description:
      'Digital onboarding checklists, resignation submissions, notice period tracking, and exit clearance.',
  },
  {
    key: 'document_management',
    name: 'Document Management',
    category: 'HR & People',
    description:
      'Employee documents, contracts, identification uploads, policy handbooks, and expiry tracking.',
  },
  {
    key: 'attendance_tracking',
    name: 'Attendance Tracking & Biometric',
    category: 'Time & Attendance',
    description:
      'Daily clock-in/out, biometric sync, geo-fencing, shift rosters, and work hours computation.',
  },
  {
    key: 'leave_management',
    name: 'Leave Management & Balances',
    category: 'Time & Attendance',
    description:
      'Leave application workflows, multi-type balance tracking, public holidays, and sandwich policies.',
  },
  {
    key: 'advanced_leave_approvals',
    name: 'Multi-Level Leave Approvals',
    category: 'Time & Attendance',
    description:
      'Hierarchical manager approvals, delegation rules, and automated escalation pathways.',
  },
  {
    key: 'time_tracker',
    name: 'Work & Project Time Tracker',
    category: 'Time & Attendance',
    description:
      'Live task timer, manual timesheet logging, billable vs non-billable tracking, and activity analysis.',
  },
  {
    key: 'projects_tasks',
    name: 'Projects & Task Management',
    category: 'Projects & Operations',
    description:
      'Project boards, task assignments, milestones, deadlines, status columns, and Kanban workflow.',
  },
  {
    key: 'task_templates',
    name: 'Task Templates & Automation',
    category: 'Projects & Operations',
    description:
      'Reusable sprint templates, recurring checklist setups, and auto-generated project deliverables.',
  },
  {
    key: 'payroll_structure',
    name: 'Salary Structures & Components',
    category: 'Payroll & Compensation',
    description:
      'Earnings, allowances, deductions, PF, ESI, TDS brackets, and customizable CTC templates.',
  },
  {
    key: 'payroll_processing',
    name: 'Payroll Processing & Payslips',
    category: 'Payroll & Compensation',
    description:
      'One-click monthly payroll runs, automated payslip PDF generation, and salary disbursements.',
  },
  {
    key: 'asset_management',
    name: 'Company Asset Inventory',
    category: 'Asset Management',
    description:
      'Hardware and software tracking, serial numbers, warranty logs, and employee assignments.',
  },
  {
    key: 'asset_maintenance',
    name: 'Asset Maintenance & Depreciation',
    category: 'Asset Management',
    description:
      'Repair logs, scheduled servicing schedules, vendor warranties, and asset depreciation accounting.',
  },
  {
    key: 'accounts_invoicing',
    name: 'Invoicing & Client Billing',
    category: 'Finance & Accounts',
    description:
      'Client invoice generation, tax line items (GST/VAT), payment receipts, and payment status.',
  },
  {
    key: 'accounts_ledger',
    name: 'Financial Ledger & Expenses',
    category: 'Finance & Accounts',
    description:
      'Chart of accounts, petty cash tracking, company expenditures, and financial summaries.',
  },
  {
    key: 'role_permissions',
    name: 'Custom Roles & Granular Permissions',
    category: 'Administration & Security',
    description:
      'Role-based access controls (RBAC), custom role creation, and view/edit/delete scopes.',
  },
  {
    key: 'device_security_audit',
    name: 'Device Security & Audit Logs',
    category: 'Administration & Security',
    description:
      'Trusted device binding, multi-factor authentication enforcement, and comprehensive audit trail.',
  },
];

// ----------------------------------------------------------------------

/** Every plan with its seat limit and the per-seat price for each interval and currency. */
export function BillingPlansCard({ data, onChange }) {
  const [editing, setEditing] = useState(null);

  const catalog = data?.feature_catalog?.length ? data.feature_catalog : DEFAULT_CATALOG;

  return (
    <Card>
      <CardHeader
        title="Plans and prices"
        subheader="Prices are per seat, in whole currency units. Customers already subscribed keep the price they signed up at."
      />

      <CardContent>
        <Stack spacing={3} divider={<Divider flexItem />}>
          {data.plans.map((plan) => (
            <PlanSection
              key={plan.key}
              plan={plan}
              catalog={catalog}
              currencies={data.supported_currencies}
              onChange={onChange}
              onEdit={() => setEditing(plan)}
            />
          ))}
        </Stack>
      </CardContent>

      <PlanDialog
        key={editing?.key ?? 'none'}
        plan={editing}
        catalog={catalog}
        onClose={() => setEditing(null)}
        onChange={onChange}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function PlanSection({ plan, catalog, currencies, onChange, onEdit }) {
  const seats = plan.max_seats ? `Up to ${plan.max_seats} seats` : 'Unlimited seats';
  const catalogList = catalog?.length ? catalog : DEFAULT_CATALOG;

  const catalogMap = useMemo(() => {
    const map = {};
    catalogList.forEach((f) => {
      map[f.key] = f;
    });
    return map;
  }, [catalogList]);

  const activeFeatures = Array.isArray(plan.features) ? plan.features : [];

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap', rowGap: 0.5 }}
      >
        <Typography variant="h6">{plan.name}</Typography>
        {plan.key !== plan.name.toLowerCase() && <Label>{plan.key}</Label>}
        {plan.highlight && <Label color="info">{plan.highlight}</Label>}
        {!plan.is_active && <Label color="warning">Hidden</Label>}
        <Typography variant="body2" color="text.secondary">
          {plan.is_free
            ? `${seats}, no charge`
            : `${seats} (paid plans are limited by seats bought)`}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon fontSize="small" />}
          onClick={onEdit}
          aria-label={`Edit ${plan.name} plan`}
        >
          Edit Plan & Features
        </Button>
      </Stack>

      {plan.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {plan.description}
        </Typography>
      )}

      {/* Feature Catalog Badges */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Features ({activeFeatures.length} / {catalogList.length} enabled):
          </Typography>
          {activeFeatures.length === catalogList.length && (
            <Label color="success" size="small">
              All Features Active
            </Label>
          )}
          {activeFeatures.length === 0 && (
            <Label color="default" size="small">
              None Enabled
            </Label>
          )}
        </Stack>

        {activeFeatures.length > 0 ? (
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {activeFeatures.map((featKey) => {
              const featInfo = catalogMap[featKey];
              const labelText = featInfo ? featInfo.name : featKey;
              return (
                <Tooltip
                  key={featKey}
                  title={featInfo?.description || featKey}
                  arrow
                  placement="top"
                >
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    icon={<CheckIcon fontSize="small" />}
                    label={labelText}
                  />
                </Tooltip>
              );
            })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No features enabled for this plan. Click Edit Plan & Features to toggle features.
          </Typography>
        )}
      </Box>

      {!plan.is_free && (
        <TableContainer>
          <Table size="small" sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell>Billing</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Price per seat</TableCell>
                <TableCell>Offered</TableCell>
                <TableCell>Razorpay</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {currencies.flatMap((currency) =>
                INTERVALS.map(({ value: interval, label }) => (
                  <PriceRow
                    key={`${currency}-${interval}`}
                    plan={plan}
                    interval={interval}
                    intervalLabel={label}
                    currency={currency}
                    price={plan.prices.find(
                      (item) => item.interval === interval && item.currency === currency
                    )}
                    onChange={onChange}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

function PriceRow({ plan, interval, intervalLabel, currency, price, onChange }) {
  const savedAmount = minorToInput(price?.unit_amount_minor);
  const savedActive = price?.is_active ?? true;

  const [amount, setAmount] = useState(savedAmount);
  const [active, setActive] = useState(savedActive);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAmount(savedAmount);
    setActive(savedActive);
  }, [savedAmount, savedActive]);

  const minor = inputToMinor(amount);
  const invalid = amount !== '' && minor === null;
  const dirty = amount !== savedAmount || active !== savedActive;

  const handleSave = async () => {
    setSaving(true);
    try {
      onChange(
        await setBillingPrice(plan.key, {
          interval,
          currency,
          unitAmountMinor: minor,
          isActive: active,
        })
      );
      toast.success(`${plan.name} ${intervalLabel.toLowerCase()} price in ${currency} saved`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  let status = <Label>Not set</Label>;
  if (price) {
    if (!price.is_active) status = <Label color="warning">Hidden</Label>;
    else if (price.synced) status = <Label color="success">In Razorpay</Label>;
    else status = <Label color="warning">Needs sync</Label>;
  }

  return (
    <TableRow>
      <TableCell>{intervalLabel}</TableCell>
      <TableCell>{currency}</TableCell>
      <TableCell sx={{ width: 200 }}>
        <TextField
          size="small"
          value={amount}
          error={invalid}
          placeholder="0.00"
          onChange={(event) => setAmount(event.target.value.trim())}
          helperText={invalid ? 'Up to 2 decimals' : ' '}
          slotProps={{
            htmlInput: {
              inputMode: 'decimal',
              'aria-label': `${plan.name} ${intervalLabel} ${currency} price`,
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {CURRENCY_SYMBOLS[currency] ?? currency}
                </InputAdornment>
              ),
            },
          }}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={price ? active : false}
          disabled={!price}
          onChange={(event) => setActive(event.target.checked)}
          slotProps={{
            input: { 'aria-label': `Offer ${plan.name} ${intervalLabel} in ${currency}` },
          }}
        />
      </TableCell>
      <TableCell>{status}</TableCell>
      <TableCell align="right">
        <Button
          size="small"
          variant={dirty ? 'contained' : 'text'}
          disabled={!dirty || minor === null || saving}
          onClick={handleSave}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
        >
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------

function PlanDialog({ plan, catalog, onClose, onChange }) {
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [highlight, setHighlight] = useState(plan?.highlight ?? '');
  const [seats, setSeats] = useState(plan?.max_seats ? String(plan.max_seats) : '');
  const [active, setActive] = useState(plan?.is_active ?? true);

  const catalogList = catalog?.length ? catalog : DEFAULT_CATALOG;

  // Track enabled feature keys using Set
  const [enabledKeys, setEnabledKeys] = useState(() => {
    if (Array.isArray(plan?.features)) {
      return new Set(plan.features);
    }
    return new Set();
  });

  const [saving, setSaving] = useState(false);

  if (!plan) return null;

  const maxSeats = seats === '' ? null : Number(seats);
  const seatsInvalid = seats !== '' && !/^[1-9]\d{0,6}$/.test(seats);
  const nameInvalid = name.trim() === '';

  // Group catalog by category
  const categories = useMemo(() => {
    const map = {};
    catalogList.forEach((feat) => {
      const cat = feat.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(feat);
    });
    return Object.entries(map).map(([category, items]) => ({
      category,
      items,
      enabledCount: items.filter((f) => enabledKeys.has(f.key)).length,
    }));
  }, [catalogList, enabledKeys]);

  const toggleFeature = (key) => {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const setCategoryState = (items, targetState) => {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        if (targetState) next.add(item.key);
        else next.delete(item.key);
      });
      return next;
    });
  };

  const handleEnableAll = () => {
    setEnabledKeys(new Set(catalogList.map((f) => f.key)));
  };

  const handleDisableAll = () => {
    setEnabledKeys(new Set());
  };

  const handleSave = async () => {
    const changes = {};
    if (name.trim() !== plan.name) changes.name = name.trim();
    if (maxSeats !== plan.max_seats) changes.max_seats = maxSeats;
    if (active !== plan.is_active) changes.is_active = active;

    const trimmedDesc = description.trim();
    if (trimmedDesc !== (plan.description ?? '')) {
      changes.description = trimmedDesc || null;
    }

    const trimmedHighlight = highlight.trim();
    if (trimmedHighlight !== (plan.highlight ?? '')) {
      changes.highlight = trimmedHighlight || null;
    }

    // Preserve order defined in the catalog for selected keys
    const newFeaturesArray = catalogList.filter((f) => enabledKeys.has(f.key)).map((f) => f.key);

    // Keep any non-catalog keys that were already present
    const originalFeatures = plan.features ?? [];
    originalFeatures.forEach((feat) => {
      if (!catalogList.some((c) => c.key === feat) && enabledKeys.has(feat)) {
        newFeaturesArray.push(feat);
      }
    });

    const featuresChanged =
      newFeaturesArray.length !== originalFeatures.length ||
      newFeaturesArray.some((f, i) => f !== originalFeatures[i]);

    if (featuresChanged) {
      changes.features = newFeaturesArray;
    }

    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      onChange(await updateBillingPlan(plan.key, changes));
      toast.success(`${plan.name} plan updated`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const totalEnabled = enabledKeys.size;
  const totalCatalog = catalogList.length;

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit {plan.name} Plan & Features</DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '78vh' }}>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Plan Meta Information */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}
            >
              Basic Plan Details
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={name}
                error={nameInvalid}
                onChange={(event) => setName(event.target.value)}
                slotProps={{ htmlInput: { maxLength: 60 } }}
              />
              <TextField
                label="Description"
                multiline
                rows={2}
                value={description}
                placeholder="Brief explanation of who this plan is for..."
                onChange={(event) => setDescription(event.target.value)}
                helperText="Shown on public pricing and in-app checkout."
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
              <TextField
                label="Highlight / Badge (Optional)"
                value={highlight}
                placeholder="e.g. Room to grow, Most Popular, Advanced capabilities"
                onChange={(event) => setHighlight(event.target.value)}
                helperText="Highlighted ribbon or badge displayed on the pricing card."
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
              <TextField
                label="Seat limit"
                value={seats}
                error={seatsInvalid}
                placeholder="Unlimited"
                onChange={(event) => setSeats(event.target.value.trim())}
                helperText={
                  seatsInvalid
                    ? 'Enter a whole number, or leave blank for unlimited.'
                    : plan.is_free
                      ? 'Most seats a workspace on this plan can have. Blank = unlimited.'
                      : 'Paid plans are limited by the seats bought; blank = no plan-level limit.'
                }
                slotProps={{ htmlInput: { inputMode: 'numeric' } }}
              />
              <FormControlLabel
                label={
                  plan.protected
                    ? 'Shown to customers (always on for this plan)'
                    : 'Shown to customers'
                }
                control={
                  <Switch
                    checked={active}
                    disabled={plan.protected}
                    onChange={(event) => setActive(event.target.checked)}
                  />
                }
              />
            </Stack>
          </Box>

          <Divider />

          {/* Feature Catalog Switches */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}
            >
              <div>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Feature Catalog & Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toggle features ON or OFF for this plan. Disabled features will be locked in the
                  backend API and gated in the user interface.
                </Typography>
              </div>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  color={totalEnabled > 0 ? 'primary' : 'default'}
                  label={`${totalEnabled} / ${totalCatalog} Enabled`}
                  size="small"
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleEnableAll}
                  disabled={totalEnabled === totalCatalog}
                >
                  Enable All
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={handleDisableAll}
                  disabled={totalEnabled === 0}
                >
                  Disable All
                </Button>
              </Stack>
            </Stack>

            {/* Categories */}
            <Stack spacing={2.5} sx={{ mt: 2 }}>
              {categories.map(({ category, items, enabledCount }) => {
                const allCategoryEnabled = enabledCount === items.length;
                const noneCategoryEnabled = enabledCount === 0;

                return (
                  <Paper
                    key={category}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      borderColor: (theme) =>
                        enabledCount > 0
                          ? theme.palette.divider
                          : theme.palette.action.disabledBackground,
                    }}
                  >
                    {/* Category Header */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1.5 }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {category}
                        </Typography>
                        <Label
                          color={
                            allCategoryEnabled
                              ? 'success'
                              : enabledCount > 0
                                ? 'primary'
                                : 'default'
                          }
                          size="small"
                        >
                          {enabledCount} / {items.length} active
                        </Label>
                      </Stack>

                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setCategoryState(items, !allCategoryEnabled)}
                        sx={{ fontSize: '0.75rem', py: 0.25 }}
                      >
                        {allCategoryEnabled ? 'Turn Off Category' : 'Turn On Category'}
                      </Button>
                    </Stack>

                    {/* Features in this category */}
                    <Stack
                      spacing={1}
                      divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}
                    >
                      {items.map((feat) => {
                        const isEnabled = enabledKeys.has(feat.key);

                        return (
                          <Box
                            key={feat.key}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 0.75,
                              px: 1,
                              borderRadius: 1,
                              bgcolor: isEnabled
                                ? (theme) => theme.palette.action.hover
                                : 'transparent',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <Box sx={{ pr: 2, flexGrow: 1 }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                sx={{ mb: 0.25 }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: isEnabled ? 600 : 400,
                                    color: isEnabled ? 'text.primary' : 'text.secondary',
                                  }}
                                >
                                  {feat.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    color: 'text.disabled',
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  {feat.key}
                                </Typography>
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {feat.description}
                              </Typography>
                            </Box>

                            <FormControlLabel
                              control={
                                <Switch
                                  checked={isEnabled}
                                  onChange={() => toggleFeature(feat.key)}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography
                                  variant="caption"
                                  sx={{
                                    minWidth: 50,
                                    fontWeight: isEnabled ? 600 : 400,
                                    color: isEnabled ? 'primary.main' : 'text.disabled',
                                  }}
                                >
                                  {isEnabled ? 'ON' : 'OFF'}
                                </Typography>
                              }
                              labelPlacement="start"
                              sx={{ mr: 0 }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Plan identifier: <code>{plan.key}</code>
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || seatsInvalid || nameInvalid}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Save Plan & Feature Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
