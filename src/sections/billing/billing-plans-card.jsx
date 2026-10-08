'use client';

import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
import { Edit as EditIcon } from '@mui/icons-material';

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
        sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap', rowGap: 0.5 }}
      >
        <Typography variant="h6">{plan.name}</Typography>
        {plan.key !== plan.name.toLowerCase() && <Label>{plan.key}</Label>}
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
  const [seats, setSeats] = useState(plan?.max_seats ? String(plan.max_seats) : '');
  const [active, setActive] = useState(plan?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  if (!plan) return null;

  const maxSeats = seats === '' ? null : Number(seats);
  const seatsInvalid = seats !== '' && !/^[1-9]\d{0,6}$/.test(seats);
  const nameInvalid = name.trim() === '';

  const handleSave = async () => {
    const changes = {};
    if (name.trim() !== plan.name) changes.name = name.trim();
    if (maxSeats !== plan.max_seats) changes.max_seats = maxSeats;
    if (active !== plan.is_active) changes.is_active = active;

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
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit {plan.name} plan</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label="Name"
            value={name}
            error={nameInvalid}
            onChange={(event) => setName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 60 } }}
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
