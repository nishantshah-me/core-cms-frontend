'use client';

import lodash from 'lodash';
import { useMemo, useState, useEffect } from 'react';

import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';

// ----------------------------------------------------------------------

/** A search box that reports its value after the typing pauses, so each keystroke is not a request. */
export function SearchField({ placeholder = 'Search', onSearch, delay = 400, sx, ...other }) {
  const [text, setText] = useState('');

  const notify = useMemo(
    () => lodash.debounce((value) => onSearch(value.trim()), delay),
    [onSearch, delay]
  );
  useEffect(() => () => notify.cancel(), [notify]);

  const change = (value) => {
    setText(value);
    notify(value);
  };

  return (
    <TextField
      fullWidth
      size="small"
      value={text}
      placeholder={placeholder}
      onChange={(event) => change(event.target.value)}
      sx={sx}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: text && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => {
                  notify.cancel();
                  setText('');
                  onSearch('');
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
        htmlInput: { 'aria-label': placeholder },
      }}
      {...other}
    />
  );
}
