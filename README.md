## 1.Prerequisites

- Node.js >=20 (Recommended)

---

## 2.Installation

#### Using Yarn (Recommended)

```sh
yarn install
yarn dev
```

#### Using Npm

```sh
npm i
npm run dev
```

---

## 3.Mock Server

By default we provide demo data from : `https://api-dev-minimal...`

To set up your local server:

**Guide:** [https://docs.minimals.cc/mock-server](https://docs.minimals.cc/mock-server).

**Resource:** [Download](https://www.dropbox.com/scl/fo/bopqsyaatc8fbquswxwww/AKgu6V6ZGmxtu22MuzsL5L4?rlkey=8s55vnilwz2d8nsrcmdo2a6ci&dl=0).

---

## 4.Blog admin (`/dashboard/blogs`)

Writes the posts that appear on the public website's journal (`mis-react`, `/blog`). The data lives in the Officeous backend (`/api/v1/admin/blogs`), not Supabase.

- **Sign-in**: none of its own. The pages sit behind the dashboard's normal login, and their API calls (`/api/v1/admin/blogs`) use that same admin session, so anyone who can sign in to the dashboard can manage the blog. The backend still enforces its own permission check on every call.
- **Environment** (optional): `NEXT_PUBLIC_MARKETING_SITE_URL` (default `https://www.officeous.com`) is where posts are published; it's used for the SEO preview and "View live" links. Requests reach the backend through the same `/api-proxy` rewrite as the rest of the console, so `API_URL` is the only backend setting.
- **Code**: pages in `src/app/dashboard/blogs/`, UI in `src/components/blog/`, API calls in `src/auth/services/blogService.js` (routes in `src/api/endpoints.js`).
- **How it all fits together** (posts, pictures, the two proxies, every setting, what can go wrong): [`docs/blog-how-it-works.md`](docs/blog-how-it-works.md).

---

## 5.Platform reports (`/dashboard`, `/dashboard/analytics`, workspaces, subscriptions, payments, audit log, system, team)

The operator's view of the SaaS: customers, revenue, product usage and platform health, all read from the backend's `/admin/...` report endpoints with the same admin session as the rest of the console.

| Page | Route | What it answers |
| --- | --- | --- |
| Overview | `/dashboard` | KPI tiles with change against the previous period (MRR, collected, paying, trial to paid, churn, workspaces, owners, seats, active workspaces, logins), what needs attention, growth, revenue, funnel, activity and the latest signups, payments and admin actions |
| Analytics | `/dashboard/analytics` | Growth and revenue, engagement (DAU/WAU/MAU, sign-in heatmap, devices, countries), module adoption, cohort retention and the signup funnel |
| Workspaces | `/dashboard/workspaces`, `.../workspace-detail?workspace_id=` | Directory with plan, seats, MRR and last activity; per workspace: subscription, owner and support actions, seats, sign-ins, companies, module usage, payments, checkouts, admin history, **extend trial** |
| Companies | `/dashboard/companies` | Every company across all workspaces |
| Subscriptions | `/dashboard/subscriptions` | MRR per currency, past-due / ending trials / cancelling / over-seat filters, renewal dates |
| Payments | `/dashboard/payments` | Collected, failed and refunded money per currency, methods, failure reasons, and the Razorpay event log (failed / stuck events) |
| Audit log | `/dashboard/audit-logs` | Every admin action and failed sign-in, filterable, with details and origin |
| System health | `/dashboard/system` | Database, scheduler, billing and configuration checks, table sizes (secrets only as set / not set) |
| Admin team | `/dashboard/team` | Console admins, their 2FA state, and open sessions that can be ended |

- **Needs the backend reports.** These pages call endpoints added in `hrms-backend-python` (`app/api/admin/analytics_endpoints.py`, `workspace_endpoints.py`, `revenue_endpoints.py`, `platform_endpoints.py`); deploy the backend first or every page shows a "could not load" error. No new environment variables and no migrations.
- **Numbers, defined.** A *seat* is a distinct active person in a live company of a live workspace. *MRR* is contracted (seats bought x the plan's current list price, yearly / 12) and is **per currency, never summed across currencies**. *Active* means a successful sign-in in the login log. *Churned* is a paying workspace now on Free. The backend's `CLAUDE.md` ("Admin console reports") has the full list.
- **Charts** are a small dependency-free SVG kit in `src/components/chart/` (area / bar / donut / funnel / heatmap / sparkline / meter), themed for light and dark, with a tooltip on hover, touch and arrow keys, and a chart / table switch on every card so each value is also readable as text. Series colours come from a fixed, colour-blind-checked palette (`chart-root.jsx`); colour follows the entity (e.g. "Paying" is always green), never its rank.
- **Code**: pages in `src/app/dashboard/<route>/`, screens in `src/sections/<area>/`, shared pieces in `src/sections/admin/` (KPI tile, report / paged-list hooks, filters, status labels), API calls in `src/auth/services/adminReportsService.js` (routes in `src/api/endpoints.js`), number / date formatting in `src/utils/admin-format.js`.
- **Adding a metric**: add it to the backend service and response model, then add a `StatTile` (see `src/sections/overview/overview-kpis.jsx`) or a chart card (`src/sections/admin/report-cards.jsx`). Lists use `usePagedList` and the backend's `{ total, data, counts }` shape.
- **Support actions** (workspace page and owner profile): extend a trial, reset an owner's password (one-time temporary password, shown once), sign an owner out everywhere, reset their 2FA. All are confirmed in a dialog and written to the audit log.

---

**NOTE:** When copying folders remember to also copy hidden files like .env. This is important because .env files often contain environment variables that are crucial for the application to run correctly.
