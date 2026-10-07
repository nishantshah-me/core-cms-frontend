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

- **Sign-in**: the blog pages ask for a **platform admin** account (password + authenticator code), separate from this dashboard's Supabase login. Create one with `python -m app.scripts.create_platform_admin create ...` in the backend repo; the first sign-in enrols the authenticator. The session lives in `sessionStorage` (this tab only).
- **Environment** (optional; defaults shown):

  | Variable | Default | Purpose |
  | --- | --- | --- |
  | `NEXT_PUBLIC_API_BASE_URL` | `https://api-dev.hexafoldtech.com` | Backend that serves `/admin/auth` and `/api/v1/admin/blogs` |
  | `NEXT_PUBLIC_MARKETING_SITE_URL` | `https://www.officeous.com` | Where posts are published; used for the SEO preview and "View live" links |

- **Code**: pages in `src/app/dashboard/blogs/`, UI in `src/components/blog/`, API calls in `src/auth/services/{platformAdminService,blogService}.js`.

---

**NOTE:** When copying folders remember to also copy hidden files like .env. This is important because .env files often contain environment variables that are crucial for the application to run correctly.
