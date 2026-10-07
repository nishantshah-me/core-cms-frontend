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

**NOTE:** When copying folders remember to also copy hidden files like .env. This is important because .env files often contain environment variables that are crucial for the application to run correctly.
