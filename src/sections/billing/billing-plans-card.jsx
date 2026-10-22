'use client';

import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

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
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Check as CheckIcon,
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

// ----------------------------------------------------------------------

/** Every plan with its seat limit and the per-seat price for each interval and currency. */
export function BillingPlansCard({ data, onChange }) {
  const [editing, setEditing] = useState(null);

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
        onClose={() => setEditing(null)}
        onChange={onChange}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function PlanSection({ plan, currencies, onChange, onEdit }) {
  const seats = plan.max_seats ? `Up to ${plan.max_seats} seats` : 'Unlimited seats';

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
        <IconButton onClick={onEdit} aria-label={`Edit ${plan.name} plan`}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Stack>

      {plan.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {plan.description}
        </Typography>
      )}

      {Array.isArray(plan.features) && plan.features.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.75 }}
          >
            Features ({plan.features.length}):
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {plan.features.map((feat, idx) => (
              <Chip
                key={idx}
                size="small"
                variant="outlined"
                icon={<CheckIcon fontSize="small" />}
                label={feat}
              />
            ))}
          </Stack>
        </Box>
      )}

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

function PlanDialog({ plan, onClose, onChange }) {
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [highlight, setHighlight] = useState(plan?.highlight ?? '');
  const [seats, setSeats] = useState(plan?.max_seats ? String(plan.max_seats) : '');
  const [active, setActive] = useState(plan?.is_active ?? true);
  const [features, setFeatures] = useState(plan?.features ? [...plan.features] : []);
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);

  if (!plan) return null;

  const maxSeats = seats === '' ? null : Number(seats);
  const seatsInvalid = seats !== '' && !/^[1-9]\d{0,6}$/.test(seats);
  const nameInvalid = name.trim() === '';

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setFeatures((prev) => [...prev, trimmed]);
    setNewFeature('');
  };

  const handleRemoveFeature = (index) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateFeature = (index, val) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? val : f)));
  };

  const handleMoveFeature = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= features.length) return;
    setFeatures((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
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

    const cleanedFeatures = features.map((f) => f.trim()).filter(Boolean);
    const originalFeatures = plan.features ?? [];
    const featuresChanged =
      cleanedFeatures.length !== originalFeatures.length ||
      cleanedFeatures.some((f, i) => f !== originalFeatures[i]);

    if (featuresChanged) {
      changes.features = cleanedFeatures;
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

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit {plan.name} plan</DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '70vh' }}>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
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
              plan.protected ? 'Shown to customers (always on for this plan)' : 'Shown to customers'
            }
            control={
              <Switch
                checked={active}
                disabled={plan.protected}
                onChange={(event) => setActive(event.target.checked)}
              />
            }
          />

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Plan Features ({features.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage feature bullet points displayed on pricing and upgrade screens.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter a new feature, e.g. Attendance tracking..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddFeature}
                disabled={!newFeature.trim()}
                startIcon={<AddIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Add
              </Button>
            </Stack>

            <Stack spacing={1}>
              {features.map((feat, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: (theme) => theme.palette.action.hover,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ minWidth: 20, color: 'text.secondary', fontWeight: 600 }}
                  >
                    {idx + 1}.
                  </Typography>
                  <TextField
                    size="small"
                    fullWidth
                    value={feat}
                    onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                  />
                  <IconButton
                    size="small"
                    disabled={idx === 0}
                    onClick={() => handleMoveFeature(idx, -1)}
                    aria-label="Move feature up"
                  >
                    <ArrowUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={idx === features.length - 1}
                    onClick={() => handleMoveFeature(idx, 1)}
                    aria-label="Move feature down"
                  >
                    <ArrowDownIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFeature(idx)}
                    aria-label="Delete feature"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              {features.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic', py: 1 }}
                >
                  No features added yet. Add feature bullet points using the input above.
                </Typography>
              )}
            </Stack>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Plan key: {plan.key}
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
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
