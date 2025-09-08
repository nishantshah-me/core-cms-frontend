/* eslint-disable perfectionist/sort-imports */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Button, { buttonClasses } from '@mui/material/Button';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function WorkspacesPopover({ data = [], sx, ...other }) {
  const mediaQuery = 'sm';

  const { open, anchorEl, onClose, onOpen } = usePopover();

  // Initialize workspace from localStorage if available
  const [workspace, setWorkspace] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      if (savedWorkspaceId) {
        return data.find((item) => item.id === savedWorkspaceId) || data[0];
      }
    }
    return data[0];
  });

  const handleChangeWorkspace = useCallback(
    (newValue) => {
      setWorkspace(newValue);

      // Save to localStorage
      localStorage.setItem('selectedWorkspaceId', newValue.id);

      // Emit custom event for other components to listen
      const event = new CustomEvent('workspaceChanged', {
        detail: { workspaceId: newValue.id, workspace: newValue },
      });
      window.dispatchEvent(event);

      console.log('Workspace changed to:', newValue);
      onClose();
    },
    [onClose]
  );

  // Listen for workspace changes from other sources (like page refresh or cross-tab changes)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selectedWorkspaceId' && e.newValue) {
        const newWorkspace = data.find((item) => item.id === e.newValue);
        if (newWorkspace && newWorkspace.id !== workspace?.id) {
          setWorkspace(newWorkspace);
        }
      }
    };

    const handleWorkspaceChange = (event) => {
      const newWorkspace = event.detail.workspace;
      if (newWorkspace && newWorkspace.id !== workspace?.id) {
        setWorkspace(newWorkspace);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('workspaceChanged', handleWorkspaceChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workspaceChanged', handleWorkspaceChange);
    };
  }, [data, workspace?.id]);

  // Sync workspace on mount if localStorage has a value
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      if (savedWorkspaceId && (!workspace || workspace.id !== savedWorkspaceId)) {
        const savedWorkspace = data.find((item) => item.id === savedWorkspaceId);
        if (savedWorkspace) {
          setWorkspace(savedWorkspace);
        }
      }
    }
  }, [data, workspace]);

  const buttonBg = {
    height: 1,
    zIndex: -1,
    opacity: 0,
    content: "''",
    borderRadius: 1,
    position: 'absolute',
    visibility: 'hidden',
    bgcolor: 'action.hover',
    width: 'calc(100% + 8px)',
    transition: (theme) =>
      theme.transitions.create(['opacity', 'visibility'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter,
      }),
    ...(open && {
      opacity: 1,
      visibility: 'visible',
    }),
  };

  const renderButton = () => (
    <ButtonBase
      disableRipple
      onClick={onOpen}
      sx={[
        {
          py: 0.5,
          gap: { xs: 0.5, [mediaQuery]: 1 },
          '&::before': buttonBg,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        component="img"
        alt={workspace?.name}
        src={workspace?.logo}
        sx={{ width: 24, height: 24, borderRadius: '50%' }}
      />

      <Box
        component="span"
        sx={{ typography: 'subtitle2', display: { xs: 'none', [mediaQuery]: 'inline-flex' } }}
      >
        {workspace?.name}
      </Box>

      {/* <Label
        color={workspace?.plan === 'Free' ? 'default' : 'info'}
        sx={{
          height: 22,
          cursor: 'inherit',
          display: { xs: 'none', [mediaQuery]: 'inline-flex' },
        }}
      >
        {workspace?.plan}
      </Label> */}

      <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
    </ButtonBase>
  );

  const renderMenuList = () => (
    <CustomPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      slotProps={{
        arrow: { placement: 'top-left' },
        paper: { sx: { mt: 0.5, ml: -1.55, width: 240 } },
      }}
    >
      <Scrollbar sx={{ maxHeight: 240 }}>
        <MenuList>
          {data.map((option) => (
            <MenuItem
              key={option.id}
              selected={option.id === workspace?.id}
              onClick={() => {
                handleChangeWorkspace(option);
              }}
              sx={{ height: 48 }}
            >
              <Avatar alt={option.name} src={option.logo} sx={{ width: 24, height: 24 }} />

              <Typography
                noWrap
                component="span"
                variant="body2"
                sx={{ flexGrow: 1, fontWeight: 'fontWeightMedium' }}
              >
                {option.name}
              </Typography>

              {/* <Label color={option.plan === 'Free' ? 'default' : 'info'}>{option.plan}</Label> */}
            </MenuItem>
          ))}
        </MenuList>
      </Scrollbar>

      <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />

      <Button
        fullWidth
        startIcon={<Iconify width={18} icon="mingcute:add-line" />}
        onClick={() => {
          onClose();
        }}
        sx={{
          gap: 2,
          justifyContent: 'flex-start',
          fontWeight: 'fontWeightMedium',
          [`& .${buttonClasses.startIcon}`]: {
            m: 0,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        Create workspace
      </Button>
    </CustomPopover>
  );

  return (
    <>
      {renderButton()}
      {renderMenuList()}
    </>
  );
}
