/* eslint-disable perfectionist/sort-imports */

import { paths } from 'src/routes/paths';
// import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  // owners: icon('ic-data-grid'),
};

// ----------------------------------------------------------------------

const _workspaces_Officeous = [
  /** * Overview */
  {
    subheader: 'Overview',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      {
        title: 'Blogs',
        path: paths.dashboard.three,
        icon: ICONS.blog,
        // info: <Label>v{CONFIG.appVersion}</Label>,
      },
      { title: 'Jobs', path: paths.dashboard.two, icon: ICONS.ecommerce },
      { title: 'Anayltics', path: paths.dashboard.three, icon: ICONS.analytics },
      { title: 'Owners', path: paths.dashboard.owners, icon: ICONS.user },
      // { title: 'Company', path: paths.dashboard.company, icon: ICONS.course },
      // { title: 'Onboarding', path: paths.dashboard.onboarding, icon: ICONS.course },
    ],
  },
  /** * Management */
  // {
  //   subheader: 'Management',
  //   items: [
  //     {
  //       title: 'Group',
  //       path: paths.dashboard.group.root,
  //       icon: ICONS.user,
  //       children: [
  //         { title: 'Four', path: paths.dashboard.group.root },
  //         { title: 'Five', path: paths.dashboard.group.five },
  //         { title: 'Six', path: paths.dashboard.group.six },
  //       ],
  //     },
  //   ],
  // },
  /** * Misc */
  {
    subheader: 'Misc',
    items: [
      {
        title: 'External link',
        path: 'https://www.officeous.com/',
        icon: ICONS.external,
        info: <Iconify width={18} icon="eva:external-link-fill" />,
      },
    ],
  },
];

const _workspaces_Hexafold = [
  /** * Overview */
  {
    subheader: 'Overview',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      {
        title: 'Blogs',
        path: paths.dashboard.three,
        icon: ICONS.blog,
        // info: <Label>v{CONFIG.appVersion}</Label>,
      },
      { title: 'Jobs', path: paths.dashboard.two, icon: ICONS.ecommerce },
      { title: 'Anayltics', path: paths.dashboard.three, icon: ICONS.analytics },
    ],
  },
  // Misc
  {
    subheader: 'Misc',
    items: [
      {
        title: 'External link',
        path: 'https://www.google.com/',
        icon: ICONS.external,
        info: <Iconify width={18} icon="eva:external-link-fill" />,
      },
    ],
  },
];

const _workspaces_Zeevaara = [
  {
    subheader: 'Misc',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      {
        title: 'Permission',
        path: paths.dashboard.three,
        icon: ICONS.lock,
        allowedRoles: ['admin', 'manager'],
        caption: 'Only admin can see this item.',
      },
      {
        title: 'External link',
        path: 'https://www.google.com/',
        icon: ICONS.external,
        info: <Iconify width={18} icon="eva:external-link-fill" />,
      },
    ],
  },
];

const _workspaces_Nivipi = [
  /** * Overview */
  {
    subheader: 'Overview',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      {
        title: 'Blogs',
        path: paths.dashboard.three,
        icon: ICONS.blog,
        // info: <Label>v{CONFIG.appVersion}</Label>,
      },
      { title: 'Jobs', path: paths.dashboard.two, icon: ICONS.ecommerce },
      { title: 'Anayltics', path: paths.dashboard.three, icon: ICONS.analytics },
    ],
  },
  /** * Management */
  {
    subheader: 'Management',
    items: [
      {
        title: 'Group',
        path: paths.dashboard.group.root,
        icon: ICONS.user,
        children: [
          { title: 'Four', path: paths.dashboard.group.root },
          { title: 'Five', path: paths.dashboard.group.five },
          { title: 'Six', path: paths.dashboard.group.six },
        ],
      },
    ],
  },
  /** * Misc */
  {
    subheader: 'Misc',
    items: [
      {
        title: 'External link',
        path: 'https://www.officeous.com/',
        icon: ICONS.external,
        info: <Iconify width={18} icon="eva:external-link-fill" />,
      },
    ],
  },
];
const _workspaces_InvoiceMaker = [
  /** * Overview */
  {
    subheader: 'Overview',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      {
        title: 'Blogs',
        path: paths.dashboard.three,
        icon: ICONS.blog,
        // info: <Label>v{CONFIG.appVersion}</Label>,
      },
      { title: 'Jobs', path: paths.dashboard.two, icon: ICONS.ecommerce },
      { title: 'Anayltics', path: paths.dashboard.three, icon: ICONS.analytics },
    ],
  },
  /** * Management */
  {
    subheader: 'Management',
    items: [
      {
        title: 'Group',
        path: paths.dashboard.group.root,
        icon: ICONS.user,
        children: [
          { title: 'Four', path: paths.dashboard.group.root },
          { title: 'Five', path: paths.dashboard.group.five },
          { title: 'Six', path: paths.dashboard.group.six },
        ],
      },
    ],
  },
  /** * Misc */
  {
    subheader: 'Misc',
    items: [
      {
        title: 'External link',
        path: 'https://www.officeous.com/',
        icon: ICONS.external,
        info: <Iconify width={18} icon="eva:external-link-fill" />,
      },
    ],
  },
];
const _workspaces_Blueray = [
  /** * Overview */
  {
    subheader: 'Overview',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      {
        title: 'Blogs',
        path: paths.dashboard.three,
        icon: ICONS.blog,
        // info: <Label>v{CONFIG.appVersion}</Label>,
      },
      { title: 'Jobs', path: paths.dashboard.two, icon: ICONS.ecommerce },
      { title: 'Anayltics', path: paths.dashboard.three, icon: ICONS.analytics },
    ],
  },
  /** * Management */
  {
    subheader: 'Management',
    items: [
      {
        title: 'Group',
        path: paths.dashboard.group.root,
        icon: ICONS.user,
        children: [
          { title: 'Four', path: paths.dashboard.group.root },
          { title: 'Five', path: paths.dashboard.group.five },
          { title: 'Six', path: paths.dashboard.group.six },
        ],
      },
    ],
  },
  /** * Misc */
  {
    subheader: 'Misc',
    items: [
      {
        title: 'External link',
        path: 'https://www.officeous.com/',
        icon: ICONS.external,
        info: <Iconify width={18} icon="eva:external-link-fill" />,
      },
    ],
  },
];

// Create a mapping object for easier access
const workspaceNavData = {
  'team-1': _workspaces_Officeous,
  'team-2': _workspaces_Hexafold,
  'team-3': _workspaces_Zeevaara,
  'team-4': _workspaces_Nivipi,
  'team-5': _workspaces_InvoiceMaker,
  'team-6': _workspaces_Blueray,
};

export const getNavData = (selectedWorkspaceId) => {
  // Use the parameter if provided, otherwise get from localStorage
  const workspaceId =
    selectedWorkspaceId ||
    (typeof window !== 'undefined' ? localStorage.getItem('selectedWorkspaceId') : null);

  return workspaceNavData[workspaceId] || _workspaces_Officeous; // Fallback to Officeous
};

// Export a default navData for initial render
export const navData = getNavData();
