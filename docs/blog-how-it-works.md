# How the blog works (in plain words)

Written for anyone who has to run, set up or fix the blog without reading the code.
Covers the three apps involved, how a post and its pictures travel, the two "proxy" things
that cause the most confusion, every setting and where it lives, and what breaks if one is
wrong.

---

## 1. The big picture

Three separate apps work together. Each has one job.

| App | Where the code lives | What it is | Its job |
| --- | --- | --- | --- |
| **CMS dashboard** | `core-cms-frontend` (on Vercel) | The admin site you sign in to | Where you **write, upload and publish** |
| **Backend (API)** | `hrms-backend-python` (on Heroku) | The server | **Stores** posts and pictures and decides **what the public may see** |
| **Public website** | `mis-react` (www.officeous.com) | What visitors see | **Shows** published posts |

And two places where things are kept:

- **Database (Postgres)**: the words: title, text, dates, SEO fields, and the *address* of each picture.
- **Storage bucket (Cloudflare R2)**: the picture files themselves.

```
 YOU (admin)                                             VISITOR
     |                                                      |
     v                                                      v
 CMS dashboard ─────────►   BACKEND (API)   ◄─────────  Public website
 (Vercel)                   (Heroku)                    (www.officeous.com)
                              |       |
                              v       v
                          Database   R2 bucket
                          (words)    (picture files)
```

**Key rule:** the CMS and the public website **never talk to each other**. They both only
talk to the backend. So they must both point at the **same** backend, or what you publish
will not show up (see section 7).

---

## 2. The life of a post

1. **Write.** Dashboard → Blogs → New post. Title, summary, the article (in Markdown),
   cover picture, SEO fields (see section 3 for what these do).
2. **Save draft.** Stored in the database. **Nobody outside can see it.** If someone types
   its address, the backend answers "not found". Same for *archived* and *deleted* posts.
3. **Publish.** The post gets the status "Published" and a publish date.
   - Date = now → visible straight away.
   - Date in the future → "Scheduled". It becomes visible when that time arrives.
     Nothing runs on a timer: the backend just compares the date with the clock every time
     someone asks.
4. **A visitor opens `/blog`.** The website asks the backend: "give me the published
   posts". The backend replies with only the ones that are published **and** whose date
   has passed.
5. **Edit / unpublish / delete.** Changes are saved immediately, but the backend lets
   browsers and servers reuse its answers for about **1 minute** (and a little longer in
   the background). So a change can take **a few minutes** to show everywhere. That is
   normal, not a bug.

Things worth knowing:

- **The article text is made safe by the backend.** If someone writes `<script>` in an
  article, it is shown as plain text and never runs. Links like `javascript:` are dropped.
- **Web addresses (slugs)** are made from the title (`My Post` → `my-post`). Changing the
  title later does **not** change the address, so old links keep working. If two posts
  want the same address, the second gets `-2`.
- **Deleting a post** hides it at once but keeps it in the database (a safety net).

## 3. What the SEO fields are for

SEO = how the post looks to Google and when pasted into chat/social apps.

| Field | What it does | If left empty |
| --- | --- | --- |
| Meta title | The blue headline in Google; also the browser tab title | Uses the post title |
| Meta description | The grey text under it in Google | Uses the summary (shortened) |
| Canonical URL | Tells Google "this is the official address" (only for articles first published elsewhere) | Uses the post's own address on the website |
| Social image | The picture shown when the link is shared | Uses the cover picture, then the logo |
| Focus keywords / tags | Extra info for search and for browsing | Nothing |
| JSON-LD | A hidden block describing the article to Google ("this is a blog post by X, published on Y") | Built automatically |

The website's address that these use comes from the backend setting
`BLOG_PUBLIC_SITE_URL` (default `https://www.officeous.com`).

---

## 4. The life of a picture (the part that is confusing)

### 4.1 What happens when you upload

1. In the editor you choose a picture.
2. Your browser sends it to the backend (through the CMS "proxy", see section 5).
3. The backend **checks and cleans** it:
   - It must really be a JPEG, PNG or WebP (it looks inside the file; the name `.png`
     is not trusted). No SVG, no animated pictures. Max **5 MB**.
   - Hidden camera info is **removed** (that can include where the photo was taken).
   - It is shrunk to at most **1920 px wide** and saved as **WebP** (much smaller). In
     our test, a 1.4 MB PNG became about 10 KB.
4. It is saved in the R2 bucket under a **random name**:
   `cms-blog/3f9a…(32 random characters).webp`.
   - Random = nobody can guess it.
   - Never reused = it can never change, so browsers may keep it for a year.
5. The backend hands back a **link** to the picture. **That link is saved inside the post
   in the database.**
6. Later, a visitor's browser loads the picture using that saved link.

### 4.2 The big question: what should that link be?

Think of R2 as a **locked warehouse**. The address you see in Cloudflare
(`https://….r2.cloudflarestorage.com/…`, called the "S3 API") is the **staff entrance**: it
only opens if you show a secret key.

We tested it. A visitor with no key gets:
`400 InvalidArgument: Authorization`.

So if the saved link pointed at the staff entrance, the upload would *look* successful, but
**every visitor would see a broken picture**. That was the original bug.

Some other storage services let you mark one file "public". R2 does **not**. So we have to
give visitors a **public door**. There are two doors.

#### Door A: "the backend hands it over" (we call it *API mode*)

The saved link points at **our backend**:

`https://api.officeous.com/api/v1/blogs/media/3f9a….webp`

When a browser asks for it, the backend walks to the warehouse with its own key, fetches the
picture and passes it on. This go-between is the **image proxy**.

- ✅ Works with **no Cloudflare setup**, and works with any storage.
- ✅ Safe: only files named exactly like our blog pictures can be fetched this way.
- ⚠️ Every picture view uses the backend's time and bandwidth. It is softened because
  browsers keep a copy for a year, and when they re-check, the backend can answer "no
  change" without going to R2. But each visitor's *first* view still hits the backend.
- Needs the setting **`BLOG_API_PUBLIC_URL`** (see 4.4).

#### Door B: "a public window" (we call it *custom domain mode*, or CDN mode)

In Cloudflare you attach a domain such as `media.officeous.com` to the bucket. Cloudflare
then serves the files **directly**, from a server near each visitor. The backend is not
involved at all.

The saved link is:

`https://media.officeous.com/cms-blog/3f9a….webp`

- ✅ Fastest, and puts **zero load** on the backend. The normal choice for production.
- ⚠️ One-time setup in Cloudflare, per bucket.
- 🚨 **Security warning: read 4.3 before using this door.**
- Needs the setting **`BLOG_MEDIA_PUBLIC_BASE_URL`**.

#### Which door is used?

One backend setting decides:

| `BLOG_MEDIA_PUBLIC_BASE_URL` | Result |
| --- | --- |
| **is set** | Door B. Links start with that domain. |
| **empty** | Door A. Links start with the backend's own address. |

Today: **production uses Door B** (`https://media.officeous.com`); development uses Door A
or its own domain.

Both doors can exist at the same time: pictures uploaded earlier through Door A keep working
after you switch to Door B, because their saved links still point at the backend.

### 4.3 🚨 Security: a custom domain exposes the WHOLE bucket

A custom domain on R2 serves **everything in the bucket**, not just the blog folder.

`officeous-prod` also holds private things:

| Folder in the bucket | What is in it |
| --- | --- |
| `documents/<employee_id>/…` | **Employee documents** |
| `tasks/…`, `asset-requests/…` | Task and asset-request attachments |
| `accounts/…` | Company logos |
| `documents/asset/…` | Asset pictures |
| **`cms-blog/…`** | **The only part that should be public** |

If `media.officeous.com` is connected and nothing restricts it, **anyone who knows or learns
a file's path can download it**. We checked: requests for `documents/…` and `accounts/…`
on `media.officeous.com` go straight through to the bucket (they answer "404" only because
the test file did not exist). Employee ids are not secret enough to rely on, since they
appear in app addresses and responses.

**The fix: only allow the blog folder through, in Cloudflare.**

1. Cloudflare dashboard → the **`officeous.com`** zone → **Security → WAF → Custom rules →
   Create rule**.
2. Name: `media: only /cms-blog/`
3. Click **Edit expression** and paste:
   ```
   (http.host eq "media.officeous.com" and not starts_with(http.request.uri.path, "/cms-blog/"))
   ```
4. Action: **Block**. Save and deploy.
5. Check it worked (should now be **403**, not 404):
   ```bash
   curl -I https://media.officeous.com/documents/anything.pdf
   ```
   and the blog folder must still reach the bucket (still **404** for a made-up name, **200**
   for a real picture):
   ```bash
   curl -I https://media.officeous.com/cms-blog/does-not-exist.webp
   ```

Other ways to be safe:

- **Use Door A only** (leave `BLOG_MEDIA_PUBLIC_BASE_URL` empty and remove the custom domain
  from the bucket). Nothing outside `cms-blog/<id>.webp` can be reached that way.
- **Use a separate bucket just for public pictures** and connect the domain to that one.
  This is the cleanest, but needs a small code change so the blog uploads to its own
  bucket. Ask if you want it.

Also: **do not turn on the "Public Development URL"** (`r2.dev`) for this bucket. It
exposes the whole bucket the same way, and Cloudflare marks it as not for production.

### 4.4 Why `BLOG_API_PUBLIC_URL` exists (Door A only)

The saved link must be a **full address**, e.g. `https://api.officeous.com/…`. So the
backend has to know its own public address. A server does **not** reliably know that: it
sits behind Heroku's router, and uploads arrive through the CMS proxy.

If you leave the setting empty, the backend **guesses** from the upload request (the host
name and whether it was http or https). Usually right, but it can be wrong. Our backend can
be reached on several names (for example `api-dev.hexafoldtech.com` and
`api-dev.officeous.com`), and the guess depends on which one the CMS was told to use.

Because the link is **saved forever** (4.5), a wrong guess means every picture from then on
carries the wrong address. So in production, **set it**, so the answer is always the one you
chose.

Not needed at all in Door B mode.

### 4.5 The link is saved at upload time

Whatever the settings were **at the moment of upload** is what gets saved in the post.
Changing a setting later does **not** fix pictures already uploaded. For those, you rewrite
the saved links in the database (section 8) or upload the picture again.

How to tell which link a post has: right-click the picture → "Copy image address".

| The link starts with | Meaning |
| --- | --- |
| `https://media.officeous.com/cms-blog/` | Door B (public window) ✅ |
| `https://api.officeous.com/api/v1/blogs/media/` | Door A (backend hands it over) ✅ |
| `https://….r2.cloudflarestorage.com/…` | The old broken kind ❌ re-upload or fix with SQL |
| `http://localhost…` | Uploaded from a developer machine ❌ |

---

## 5. The other "proxy": `/api-proxy` in the CMS

There are **two different go-betweens**. They are easy to mix up.

|  | **`/api-proxy` in the CMS** | **Image proxy (Door A)** |
| --- | --- | --- |
| Who is talking | Your browser ↔ CMS ↔ backend | A visitor's browser ↔ backend ↔ R2 |
| Used for | Everything in the dashboard (sign-in, posts, uploads) | Showing pictures to visitors |
| Where it lives | CMS config (`next.config.mjs`) | Backend route `GET /api/v1/blogs/media/…` |
| Setting that controls it | `API_URL` (on the CMS) | `BLOG_API_PUBLIC_URL` (on the backend) |

### How `/api-proxy` works

Your browser **only ever calls the CMS's own address**:

`https://core-cms-frontend-one.vercel.app/api-proxy/api/v1/admin/blogs/upload-image`

The CMS server quietly forwards it to the real backend (`API_URL`) and sends the answer
back:

`<API_URL>/api/v1/admin/blogs/upload-image`

### Why we use it

1. **No cross-site blocking.** Browsers refuse to talk to a *different* website unless that
   site explicitly allows it (called CORS). With the proxy, the browser believes it is only
   talking to itself, so nothing has to be allowed.
2. **The backend's real address stays on the server.** It is not shipped inside the page's
   code that anyone can read.
3. **One place to change.** Point `API_URL` at another backend and everything follows.

The **public website does not use this proxy**. It calls the backend directly, using its
own setting `REACT_APP_API_BASE_URL`.

### What can go wrong with it

- **`API_URL` is read when the CMS is built**, not while it runs. If you change it on
  Vercel you must **redeploy**, or nothing changes.
- **If `API_URL` is missing**, the CMS falls back to the **dev** backend. A production CMS
  could then save posts into the dev database and you would wonder where they went.
- **Wrong environment**: a CMS pointing at the dev backend saves to the dev database and dev
  bucket.
- **Size/time limits of the host.** Uploads are capped at 5 MB. We tested up to ~1.4 MB
  locally. If only very large pictures fail on Vercel and small ones work, the host's
  request-size limit is the first thing to check.

---

## 6. Where each setting lives (cheat sheet)

Set each in **only the place shown**.

### Backend (Heroku "config vars", one set per environment)

| Setting | Meaning | When you need it |
| --- | --- | --- |
| `BLOG_PUBLIC_SITE_URL` | The public website's address (`https://www.officeous.com`). Used for canonical links, the sitemap and Google data. | Default is fine for production. Set it on dev if dev has its own website. |
| `BLOG_MEDIA_PUBLIC_BASE_URL` | Door B: the public picture domain (`https://media.officeous.com`). No trailing slash, **no bucket name** in it. | Production (after doing 4.3). |
| `BLOG_API_PUBLIC_URL` | Door A: the backend's own address (`https://api.officeous.com`). | Any environment **without** `BLOG_MEDIA_PUBLIC_BASE_URL`. |
| `AWS_*` (keys, bucket name, endpoint) | How the backend reaches R2. | Already set. |

```bash
heroku config:set BLOG_MEDIA_PUBLIC_BASE_URL=https://media.officeous.com -a hexa-hrms-prod
heroku config:set BLOG_API_PUBLIC_URL=https://api-dev.officeous.com -a hexa-backend-dev
```

### CMS dashboard (Vercel environment variables)

| Setting | Meaning |
| --- | --- |
| `API_URL` | Which backend the `/api-proxy` forwards to. **Redeploy after changing.** |
| `NEXT_PUBLIC_MARKETING_SITE_URL` | The public website, used only for the "View live" links and the Google preview in the editor. |

### Public website (`mis-react`)

| Setting | Meaning |
| --- | --- |
| `REACT_APP_API_BASE_URL` | Which backend to read posts from. |

### The pairing rule

For each environment these three must point at the **same backend**:

```
CMS  API_URL   =   Website  REACT_APP_API_BASE_URL   =   the backend you mean
```

And the picture setting (`BLOG_MEDIA_PUBLIC_BASE_URL` or `BLOG_API_PUBLIC_URL`) must belong
to **that same backend's** bucket.

---

## 7. What can go wrong (symptom → why → fix)

| What you see | Why | Fix |
| --- | --- | --- |
| Picture is broken everywhere; the saved link contains `r2.cloudflarestorage.com` | The link points at R2's private staff entrance | Use Door A or B (section 4). Fix old posts with the SQL in section 8. |
| Picture works in the admin but not on the website (or the reverse) | Link points at a host only one of them can reach, e.g. `localhost` or an old domain; or `http://` on an `https://` page, which browsers block | Set `BLOG_API_PUBLIC_URL` (Door A) or `BLOG_MEDIA_PUBLIC_BASE_URL` (Door B); re-upload or run the SQL |
| New pictures still get the *old* kind of link | Setting added but the backend was not restarted/deployed, or it was set on the wrong Heroku app | Check `heroku config -a <app>`; the app must restart after a change (Heroku does it automatically) |
| Picture link goes to `media…` but shows 404 | Domain not "Active" yet in Cloudflare; the link includes the bucket name; or the picture is in the *other* environment's bucket (dev picture, prod domain) | Wait for Active; the base URL must be the bare domain; use the right domain for each bucket |
| "I published but nothing shows on the website" | (1) Date is in the future (scheduled). (2) Website and CMS point at **different backends**. (3) It is just the ~1–5 minute cache. | Check the date and status; compare `API_URL` with `REACT_APP_API_BASE_URL`; wait a few minutes |
| Saved in CMS but it is in the dev database | A production CMS has `API_URL` missing and used the dev default | Set `API_URL` on Vercel and **redeploy** |
| Changed `API_URL` on Vercel and nothing changed | It is read at build time | Redeploy |
| Upload says "Unable to store the image" (502) | Backend could not write to R2 (wrong keys/bucket/endpoint) | Check the `AWS_*` settings and the Heroku logs |
| Upload says "Images must be 5 MB or smaller" (413) / "not a valid image" (400) | Too big, wrong type, animated or SVG | Use a JPEG, PNG or WebP under 5 MB |
| Many people view pictures and the backend gets slow | Door A sends every first view through the backend | Switch to Door B (and do 4.3) |
| Employee or company files could be downloaded from `media.officeous.com/…` | Custom domain exposes the whole bucket | **4.3 immediately** |
| Link previews (LinkedIn, Facebook, X, Slack, WhatsApp) don't show the post's own title or picture | The website builds each page in the browser, and those apps don't run that code. Google does run it, so Google is fine. | Needs pre-rendering for `/blog/*` (a separate piece of work) |
| Picture still shows after deleting the post | Pictures are never deleted automatically (also not when replaced) | Harmless; storage is cheap. A cleanup job can be added later. |
| Everything signs out / redirects to sign-in | The admin session ended. The blog uses the **same login as the rest of the dashboard**; there is no separate blog login. | Sign in again; you return to where you were |

---

## 8. Fixing pictures that were uploaded before a setting change

The saved link is in the database, so rewrite it. **Always run the `SELECT` first** to see
what will change. Connect with `heroku pg:psql -a hexa-hrms-prod`.

Find posts with the old private-R2 kind of link:

```sql
SELECT id, cover_image_url FROM cms_blog_posts
WHERE cover_image_url ~ '/cms-blog/[0-9a-f]{32}\.webp$'
  AND cover_image_url !~ '^https://media\.officeous\.com/';
```

Rewrite them to Door B (use your own domain):

```sql
UPDATE cms_blog_posts
SET cover_image_url = regexp_replace(cover_image_url,
      '^https://[^/]+/[^/]+/cms-blog/([0-9a-f]{32})\.webp$',
      'https://media.officeous.com/cms-blog/\1.webp')
WHERE cover_image_url ~ '^https://[^/]+/[^/]+/cms-blog/[0-9a-f]{32}\.webp$';
```

(Repeat for `og_image_url` if you use the social image field. Pictures placed *inside* the
article text need the Markdown edited and the post re-saved.)

---

## 9. Setting up a new environment (checklist)

1. **Backend**: deploy; run migrations (they create the blog tables and 3 starter
   categories). Optionally import the four original stories:
   `python -m app.scripts.seed_blog_posts`.
2. **Pictures**, choose one:
   - **Door A**: set `BLOG_API_PUBLIC_URL` on the backend. Done.
   - **Door B**: in Cloudflare R2 → bucket → *Custom Domains → Add*; wait for **Active**;
     **add the WAF rule from 4.3 and verify the 403**; then set
     `BLOG_MEDIA_PUBLIC_BASE_URL` on the backend.
3. **CMS**: set `API_URL` (and `NEXT_PUBLIC_MARKETING_SITE_URL`) on Vercel; **redeploy**.
4. **Website**: make sure `REACT_APP_API_BASE_URL` points at the same backend.
5. **Test**: sign in to the dashboard → upload a cover → publish → open the website's
   `/blog`. The picture should show; "Copy image address" should look like one of the good
   rows in the table in 4.5.

---

## 10. Quick checks you can run

Does a published post exist for the public?

```bash
curl -s https://api.officeous.com/api/v1/blogs | head -c 400
```

Is a picture reachable by a stranger (Door B)? Expect `200` and `content-type: image/webp`:

```bash
curl -I https://media.officeous.com/cms-blog/<the-name>.webp
```

Is a picture reachable through the backend (Door A)?

```bash
curl -I https://api.officeous.com/api/v1/blogs/media/<the-name>.webp
```

Is the bucket's private area still private (Door B)? Expect `403`:

```bash
curl -I https://media.officeous.com/documents/anything.pdf
```

---

## 11. Short glossary

- **API / backend**: the server that stores data and decides who can see what.
- **R2 / bucket**: Cloudflare's file storage. A *bucket* is one named container of files.
- **Proxy**: a go-between that receives a request and passes it on, then hands back the
  answer. We have two (section 5).
- **CORS**: the browser rule that blocks a page from calling a different website unless that
  website allows it.
- **CDN**: a network of servers around the world that keeps copies of files close to
  visitors. Cloudflare's custom domain works like this.
- **Slug**: the readable last part of a web address (`/blog/my-post`).
- **Canonical URL**: the "official" address of a page, so Google doesn't treat copies as
  duplicates.
- **JSON-LD**: a hidden description of a page written for search engines.
- **Cache**: reusing an earlier answer instead of asking again, to be faster.
- **Config var / environment variable**: a setting kept outside the code, per environment.
