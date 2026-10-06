'use client';

import * as z from 'zod';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Form, Field } from 'src/components/hook-form';
import { LogoLoader } from 'src/components/loading-screen/LogoLoader';

import {
  getOwner,
  createOwner,
  updateOwner,
  getErrorMessage,
} from 'src/auth/services/adminOwnerService';

// ----------------------------------------------------------------------

// The name and email limits mirror the database columns (Employee.first_name / last_name / email).
const OwnerSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(15, 'At most 15 characters'),
  last_name: z.string().trim().max(15, 'At most 15 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(50, 'At most 50 characters')
    .refine((value) => z.email().safeParse(value).success, 'Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+?\d{7,15}$/.test(value.replace(/[\s\-()]/g, '')),
      'Enter a valid phone number (7-15 digits)'
    ),
});

const EMPTY_VALUES = { first_name: '', last_name: '', email: '', phone: '' };

// ----------------------------------------------------------------------

export default function OwnerFormPage() {
  return (
    <Suspense fallback={<LogoLoader sx={{ height: '80vh' }} />}>
      <OwnerFormView />
    </Suspense>
  );
}

function OwnerFormView() {
  const router = useRouter();
  const ownerId = useSearchParams().get('owner_id');
  const isEdit = Boolean(ownerId);

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [created, setCreated] = useState(null); // { owner, temporary_password }

  const methods = useForm({
    resolver: zodResolver(OwnerSchema),
    defaultValues: EMPTY_VALUES,
  });

  const {
    reset,
    setError,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!ownerId) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const owner = await getOwner(ownerId);
        if (cancelled) return;

        reset({
          first_name: owner.first_name ?? '',
          last_name: owner.last_name ?? '',
          email: owner.email ?? '',
          phone: owner.phone ?? '',
        });
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Failed to load this owner.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerId, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
    };

    try {
      if (isEdit) {
        await updateOwner(ownerId, payload);
        toast.success('Owner updated');
        router.push(paths.dashboard.ownerDetails(ownerId));
      } else {
        setCreated(await createOwner(payload));
      }
    } catch (err) {
      const message = getErrorMessage(err, `Could not ${isEdit ? 'update' : 'add'} this owner.`);

      // The only conflict the API reports is an email already in use; show it on the field.
      if (/email/i.test(message)) {
        setError('email', { type: 'server', message });
      } else {
        toast.error(message);
      }
    }
  });

  const backHref = isEdit ? paths.dashboard.ownerDetails(ownerId) : paths.dashboard.owners;

  if (loading) {
    return <LogoLoader sx={{ height: '80vh' }} />;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} color="inherit" href={paths.dashboard.root} underline="hover">
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          color="inherit"
          href={paths.dashboard.owners}
          underline="hover"
        >
          Owners
        </Link>
        <Typography color="text.primary">{isEdit ? 'Edit owner' : 'Add owner'}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 3 }}>
        {isEdit ? 'Edit owner' : 'Add owner'}
      </Typography>

      {loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : (
        <Card>
          <CardContent>
            {!isEdit && (
              <Alert severity="info" sx={{ mb: 3 }}>
                The owner is approved straight away. You will get a temporary password to pass on;
                they are asked to change it when they first sign in.
              </Alert>
            )}

            <Form methods={methods} onSubmit={onSubmit}>
              <Stack spacing={3}>
                <Box
                  sx={{
                    gap: 3,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  }}
                >
                  <Field.Text name="first_name" label="First name" required />
                  <Field.Text name="last_name" label="Last name" />
                </Box>

                <Field.Text name="email" label="Email" type="email" required />
                <Field.Text
                  name="phone"
                  label="Phone"
                  placeholder="+91 98765 43210"
                  helperText="Optional"
                />

                <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                  <Button
                    color="inherit"
                    variant="outlined"
                    disabled={isSubmitting}
                    onClick={() => router.push(backHref)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" loading={isSubmitting}>
                    {isEdit ? 'Save changes' : 'Add owner'}
                  </Button>
                </Stack>
              </Stack>
            </Form>
          </CardContent>
        </Card>
      )}

      <TemporaryPasswordDialog
        created={created}
        onDone={() => router.push(paths.dashboard.ownerDetails(created.owner.id))}
      />
    </Container>
  );
}

// ----------------------------------------------------------------------

/** The API returns the temporary password once, so this can't be dismissed by a stray click. */
function TemporaryPasswordDialog({ created, onDone }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(created.temporary_password);
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy. Select the password and copy it manually.');
    }
  };

  return (
    <Dialog open={Boolean(created)} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle>Owner added</DialogTitle>

      {created && (
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Share these sign-in details with {created.owner.name || created.owner.email}. The
            password is shown only once and cannot be retrieved later.
          </Typography>

          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Email
            </Typography>
            <Typography variant="body2">{created.owner.email}</Typography>
          </Stack>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Temporary password
          </Typography>
          <Box
            sx={{
              p: 1.5,
              mt: 0.5,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: 16,
              userSelect: 'all',
              wordBreak: 'break-all',
              bgcolor: 'background.neutral',
            }}
          >
            {created.temporary_password}
          </Box>
        </DialogContent>
      )}

      <DialogActions>
        <Button color="inherit" variant="outlined" onClick={handleCopy}>
          Copy password
        </Button>
        <Button variant="contained" onClick={onDone}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
