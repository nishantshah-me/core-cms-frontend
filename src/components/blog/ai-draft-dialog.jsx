'use client';

import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import {
  startAiDraft,
  getAiModels,
  getAiDraftJob,
  getAiProviders,
  describeApiError,
  getActiveAiDraftJob,
} from 'src/auth/services/blogService';

// ----------------------------------------------------------------------
// "Write with AI". One click asks the backend to write an article with an LLM and save it as a DRAFT. That takes
// 1-3 minutes and a request cannot wait that long, so the backend answers at once with a job and this component
// polls it. The article is never published here: the finished draft opens in the editor for a person to review.
//
// Which LLM: the providers set up on the server are offered (Gemini, Groq, OpenRouter, ... : see the backend's
// AI_* settings). "Auto" tries them in turn, so one being busy (Gemini's 503) doesn't stop the draft; or pick one and
// a model from its live list, or type any model name it accepts.
//
// The component stays mounted while the dialog is closed, so a job that is running keeps being followed (and the
// list is refreshed when it finishes), and a page reload picks a running job back up.
// ----------------------------------------------------------------------

const POLL_MS = 3000;
const MAX_POLL_FAILURES = 5;
const TOPIC_MAX = 300;
const AUTO = 'auto';

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function AiDraftDialog({ open, onClose, onFinished, onBusyChange }) {
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [config, setConfig] = useState({ status: 'idle', providers: [], auto: false });
  const [provider, setProvider] = useState(''); // AUTO or a provider id
  const [model, setModel] = useState('');
  const [modelList, setModelList] = useState({ status: 'idle', items: [] });
  const [job, setJob] = useState(null); // the job being written, if any
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const openRef = useRef(open);
  openRef.current = open;
  const handledRef = useRef(null);

  const working = Boolean(job) && (job.status === 'QUEUED' || job.status === 'RUNNING');
  const jobId = working ? job.id : null;
  const startedAt = working ? job.created_at : null;
  const labelFor = (id) => config.providers.find((p) => p.id === id)?.label || id;

  // A reload, another tab or a second click can leave a job running: follow it.
  useEffect(() => {
    const controller = new AbortController();
    getActiveAiDraftJob({ signal: controller.signal })
      .then((active) => {
        if (active) setJob(active);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    onBusyChange?.(working || starting);
  }, [working, starting, onBusyChange]);

  // Which providers are set up, each time the dialog opens (keys are added without a redeploy of this app).
  useEffect(() => {
    if (!open || working) return undefined;
    const controller = new AbortController();
    setConfig((previous) => ({ ...previous, status: 'loading' }));
    getAiProviders({ signal: controller.signal })
      .then((data) => {
        setConfig({ status: 'ready', providers: data.providers, auto: data.auto });
        setProvider((current) => {
          const stillValid =
            current === AUTO ? data.auto : data.providers.some((p) => p.id === current);
          if (stillValid) return current;
          return data.auto ? AUTO : data.providers[0]?.id || '';
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfig({ status: 'error', providers: [], auto: false });
      });
    return () => controller.abort();
  }, [open, working]);

  // The chosen provider's models, fetched live because free model lists change often. The server caches them.
  useEffect(() => {
    if (!open || !provider || provider === AUTO) {
      setModelList({ status: 'idle', items: [] });
      return undefined;
    }
    setModel(config.providers.find((p) => p.id === provider)?.default_model || '');
    const controller = new AbortController();
    setModelList({ status: 'loading', items: [] });
    getAiModels(provider, { signal: controller.signal })
      .then((data) => setModelList({ status: 'ready', items: data.models }))
      .catch(() => {
        if (!controller.signal.aborted) setModelList({ status: 'error', items: [] });
      });
    return () => controller.abort();
  }, [open, provider, config.providers]);

  // Poll while a job is running. A few failed polls in a row end the wait (the job itself carries on server-side).
  useEffect(() => {
    if (!jobId) return undefined;
    let cancelled = false;
    let failures = 0;
    const timer = setInterval(async () => {
      try {
        const next = await getAiDraftJob(jobId);
        if (cancelled) return;
        failures = 0;
        setJob(next);
      } catch {
        failures += 1;
        if (!cancelled && failures >= MAX_POLL_FAILURES) {
          setError(
            'Lost contact with the server. The draft may still finish: reload this page in a minute to check.'
          );
          setJob(null);
        }
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [jobId]);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return undefined;
    }
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  // The job ended. Each job is handled once.
  useEffect(() => {
    if (!job || handledRef.current === job.id) return;

    if (job.status === 'SUCCEEDED' && job.post) {
      handledRef.current = job.id;
      setJob(null);
      const by = job.used_model ? ` (written by ${job.used_model})` : '';
      if (openRef.current) {
        toast.success(`Draft ready${by}. Opening it for review…`);
        router.push(paths.dashboard.blogs.edit(job.post.id));
      } else {
        toast.success(`Draft ready${by}: “${job.post.title}”`);
        onFinished?.();
      }
    } else if (job.status === 'FAILED') {
      handledRef.current = job.id;
      setJob(null);
      setError(job.error || 'The draft could not be written. Please try again.');
      if (!openRef.current) toast.error(job.error || 'The AI draft could not be written.');
    }
  }, [job, router, onFinished]);

  const start = async () => {
    setError('');
    setStarting(true);
    try {
      const explicit = provider !== AUTO;
      setJob(
        await startAiDraft({
          topic: topic.trim(),
          provider: explicit ? provider : undefined,
          model: explicit ? model.trim() : undefined,
        })
      );
      setTopic('');
    } catch (err) {
      const info = describeApiError(err, 'Could not start the draft.');
      if (info.jobId) {
        // One is already being written: follow that instead of starting another.
        try {
          setJob(await getAiDraftJob(info.jobId));
        } catch {
          setError(info.message);
        }
      } else {
        setError(info.message);
      }
    } finally {
      setStarting(false);
    }
  };

  const noProviders = config.status === 'ready' && config.providers.length === 0;
  const modelHelp = {
    loading: 'Loading models…',
    error: 'Couldn’t load this provider’s model list. You can still type a model name.',
    ready:
      provider === 'openrouter'
        ? 'Free models only. Pick one, or type a model name.'
        : 'Pick one, or type a model name.',
    idle: '',
  }[modelList.status];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="ai-draft-title">
      <DialogTitle id="ai-draft-title">Write with AI</DialogTitle>

      <DialogContent>
        {working ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">
              Writing the article{job.topic ? ` about “${job.topic}”` : ''}
              {job.provider && job.provider !== AUTO
                ? ` with ${labelFor(job.provider)}${job.model ? ` (${job.model})` : ''}`
                : ', trying your AI providers in turn'}
              … <strong>{clock(elapsed)}</strong>
            </Typography>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary">
              This usually takes one to three minutes. You can close this window: the draft will
              show up in the list when it is done.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              The AI writes one article and saves it as a <strong>draft</strong>. Nothing goes live
              until you review and publish it.
            </Typography>

            {noProviders && (
              <Alert severity="warning">
                No AI provider is set up on the server yet. Add an API key to its settings (for
                example GROQ_API_KEY or GEMINI_API_KEY), then reopen this window.
              </Alert>
            )}

            {config.providers.length > 0 && (
              <TextField
                select
                label="AI provider"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                helperText={
                  provider === AUTO
                    ? 'Tries each provider in turn, so one being busy doesn’t stop the draft.'
                    : ' '
                }
                disabled={starting}
                fullWidth
              >
                {config.auto && <MenuItem value={AUTO}>Auto (try each in turn)</MenuItem>}
                {config.providers.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {provider && provider !== AUTO && (
              <Autocomplete
                freeSolo
                options={modelList.items.map((item) => item.id)}
                inputValue={model}
                onInputChange={(_, value) => setModel(value)}
                loading={modelList.status === 'loading'}
                disabled={starting}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Model"
                    helperText={modelHelp}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {modelList.status === 'loading' ? <CircularProgress size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            )}

            <TextField
              label="Topic (optional)"
              placeholder="e.g. How to handle probation period reviews"
              helperText="Leave empty and it picks a topic that isn’t covered yet."
              value={topic}
              onChange={(event) => setTopic(event.target.value.slice(0, TOPIC_MAX))}
              fullWidth
              multiline
              maxRows={3}
              disabled={starting}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>
          {working ? 'Close' : 'Cancel'}
        </Button>
        {!working && (
          <Button
            variant="contained"
            onClick={start}
            disabled={starting || noProviders || !provider || (provider !== AUTO && !model.trim())}
          >
            {starting ? 'Starting…' : 'Write draft'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
