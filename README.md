# Mid Valley Storage

The website for Mid Valley Storage, which has two self-storage locations in Visalia, CA (Noble and Santa Fe). It
replaces the WordPress site at midvalleystorage.com.

It is built with Next.js 16 (App Router, Cache Components), React 19, TypeScript and plain CSS, and hosted on
Vercel. The owner edits the content in a password-protected admin panel at `/admin`. Content, version history,
admin logins, uploaded photos and contact messages all live in a private Vercel Blob store, so there is no
database. Payments and move-ins stay on Storedge; the site only links to it.

- **[DEPLOY.md](DEPLOY.md):** Vercel setup, environment variables, the seed script, admin logins, email, security.
- **[GO-LIVE.md](GO-LIVE.md):** the client's launch checklist, and everything that still depends on the old site.
- **[ADMIN-GUIDE.md](ADMIN-GUIDE.md):** how the owner uses the admin panel.
- **[`.env.example`](.env.example):** every setting, with a one-line comment for each.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server at http://localhost:3000 (admin at `/admin`). |
| `npm run build` / `npm start` | Production build (with type check) and serve it. |
| `npm run lint` | ESLint. |
| `npm run seed` | Loads the repository's default content into the store. It only adds missing fields, so the owner's edits are kept. `-- --force` replaces the content, after saving the old content to history. See DEPLOY.md §3. |
| `npm run admin:reset -- <email> [<name>]` | Creates an owner login or resets a password, and prints a new password once. See DEPLOY.md §4. |
| `npx tsc --noEmit` | Type check only. |

Local setup: `npm install`, `cp .env.example .env.local`, then fill in `SESSION_SECRET`, `ADMIN_EMAIL` and
`ADMIN_PASSWORD`, and run `npm run dev`. Without Blob settings, everything is stored in the git-ignored `.data/`
folder.

## Folder map

| Path | What |
| --- | --- |
| `app/` | Pages: `/`, `about-us`, `facilityfeatures`, `contact`, `employee`, plus `not-found`, `sitemap.ts` and `robots.ts`. |
| `app/admin/` | Admin panel: `login/`, `(panel)/` screens (sections, history, messages, users, account), `preview/` (live preview), `actions.ts` (every Server Action), `admin.css`. |
| `app/api/contact/` | Contact form: saves the message and emails it through Resend. |
| `app/api/admin/upload/` | Photo uploads from the admin panel. |
| `app/media/[...path]/` | Serves uploaded photos from the private store. |
| `components/` | Public site components (`home/`, `employee/`, `motion/` for Motion for React) and `admin/` for the panel UI. |
| `content/site.json` | The default content (from the old site). The store's copy wins once the owner saves. |
| `content/pages/`, `content/image-map.json`, `content/inventory.json` | Phase 1 scrape of the old site: reference data, also copied to `reference/` in the store by the seed. |
| `lib/content-schema.ts` | The zod schema for all content (sections, limits, placeholders noted in comments). |
| `lib/content.ts` | Reads (cached, tagged) and saves content, version history, and photo cleanup. |
| `lib/storage.ts` | The only module that knows about Vercel Blob vs `.data/`. |
| `lib/auth.ts`, `lib/session-token.ts`, `proxy.ts` | Admin users, sign-in and sessions; `proxy.ts` guards `/admin` and `/api/admin`. |
| `lib/screens.ts`, `components/admin/screen-fields.ts` | Which admin screen edits which content, and its fields. |
| `lib/portal.ts` | Employee Portal password gate and calendar address. |
| `lib/messages.ts`, `lib/rate-limit.ts` | Contact messages and rate limiting, stored in the Blob store. |
| `next.config.ts` | Cache Components, redirects from the old WordPress URLs (301), security headers and CSP. |
| `public/images/`, `public/video/` | Photos and the header video taken from the old site. |
| `scripts/seed.mjs`, `scripts/reset-admin.mjs` | The seed and admin reset scripts (plain Node). |
| `scripts/scrape/` | The Phase 1 scrape scripts (Python), with their own README. |

## What lives in the store

| Path | What |
| --- | --- |
| `content/site.json` | All website content. |
| `content/history/<timestamp>.json` | One file per save (who, when, what changed, full content). The newest 20 are kept. |
| `auth/users.json` | Admin users: email, name, role, bcrypt hash, session version. |
| `auth/attempts/…`, `ratelimit/…` | Failed sign-in counters and rate limits (hashed ids). |
| `messages/…` | Contact form messages, shown under **Admin → Messages**. |
| `media/…` | Photos uploaded in the admin panel. |
| `reference/…` | Phase 1 reference data (written by `npm run seed`, never served). |
