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
  company: icon('ic-company'),
  health: icon('ic-health'),
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
      { title: 'Overview', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Analytics', path: paths.dashboard.analytics, icon: ICONS.analytics },
    ],
  },
  /** * Customers */
  {
    subheader: 'Customers',
    items: [
      { title: 'Owners', path: paths.dashboard.owners, icon: ICONS.user },
      { title: 'Workspaces', path: paths.dashboard.workspaces, icon: ICONS.folder },
      { title: 'Companies', path: paths.dashboard.companies, icon: ICONS.company },
    ],
  },
  /** * Revenue */
  {
    subheader: 'Revenue',
    items: [
      { title: 'Subscriptions', path: paths.dashboard.subscriptions, icon: ICONS.order },
      { title: 'Payments', path: paths.dashboard.payments, icon: ICONS.invoice },
      { title: 'Billing setup', path: paths.dashboard.billing, icon: ICONS.banking },
    ],
  },
  /** * Content */
  {
    subheader: 'Content',
    items: [
      {
        title: 'Blogs',
        path: paths.dashboard.blogs.root,
        icon: ICONS.blog,
        // info: <Label>v{CONFIG.appVersion}</Label>,
      },
      {
        title: 'Jobs',
        icon: ICONS.job,
        children: [
          { title: 'Recruiter', path: '/dashboard/jobs/recruiters' },
          { title: 'Candidate List', path: '/dashboard/jobs/candidates' },
        ],
      },
    ],
  },
  /** * Platform */
  {
    subheader: 'Platform',
    items: [
      { title: 'Audit log', path: paths.dashboard.auditLogs, icon: ICONS.file },
      { title: 'System health', path: paths.dashboard.system, icon: ICONS.health },
      { title: 'Admin team', path: paths.dashboard.team, icon: ICONS.lock },
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
