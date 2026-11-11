# Deploying midvalleystorage.com

How to set up hosting on Vercel, configure the site, load its content and manage admin logins. This is the
technical guide. The client's step-by-step launch list is [GO-LIVE.md](GO-LIVE.md).

The site is a Next.js 16 app. Everything that changes after launch lives in a **private Vercel Blob store**:
the website text and photos the owner edits, version history, admin logins and contact form messages. There is no
database and no other server.

---

## 1. Create the Vercel project

1. In Vercel, choose **Add New → Project** and import the GitHub repository **`imasssad/midvalley`**.
2. **Framework preset:** Next.js. `vercel.json` already sets this (`"framework": "nextjs"`). Leave the build
   command, output directory and install command at their defaults.
3. **Production branch:** `main`. Check this under **Settings → Git**. Every push to `main` deploys the live site.
   Every other branch and pull request gets its own preview URL.
4. **Node.js version:** go to **Settings → Build and Deployment → Node.js Version** and choose **22.x**. Next.js 16
   needs Node 20.9 or newer; the scripts were tested on Node 22.
5. **Blob store:** go to **Storage → Create Database → Blob**, choose **Private** access, and connect it to this
   project for **all environments** (Production, Preview, Development). This adds `BLOB_READ_WRITE_TOKEN`, or on
   newer stores `BLOB_STORE_ID` (used with Vercel OIDC). Either one is enough. The store **must be private**,
   because it holds admin logins and visitors' messages. Photos are served to visitors through `/media/…` on the
   site itself, never straight from the store.
6. Add the environment variables from the table below (**Settings → Environment Variables**), then **redeploy**.
   Variables only reach a deployment that was built after they were added.

If a deployment has no Blob store, saving fails with a clear error rather than losing data. The admin login page
also says exactly what is missing (no Blob store, no `SESSION_SECRET`, or no first-login variables).

## 2. Environment variables

Every variable is listed in [`.env.example`](.env.example) with a one-line comment. None of the real values belong
in the repository.

| Variable | Required? | What it is and where to get it | Example format |
| --- | --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` or `BLOB_STORE_ID` | **Yes** | Added automatically when the private Blob store is connected (step 1.5). | `vercel_blob_rw_<store>_<random>` / `store_<id>` |
| `SESSION_SECRET` | **Yes** | Random string, at least 32 characters. Signs the admin login cookie and the Employee Portal cookie. Generate with `openssl rand -base64 48`. Changing it signs everyone out. | 64 random characters |
| `ADMIN_EMAIL` | Yes, for the first sign-in | The owner's email. The first sign-in with this email and `ADMIN_PASSWORD` creates the owner account. Ignored once any account exists. | `owner@example.com` |
| `ADMIN_PASSWORD` | Yes, for the first sign-in | At least 10 characters. **Delete it from Vercel after the first sign-in.** | 10+ characters |
| `NEXT_PUBLIC_SITE_URL` | Recommended | The public address, with no trailing slash. Used for canonical links, the sitemap, sharing previews and structured data. Defaults to `https://midvalleystorage.com`. On a preview you may set it to the preview URL. | `https://midvalleystorage.com` |
| `NEXT_PUBLIC_GTM_ID` | Recommended | Google Tag Manager container. The old site uses **GTM-TBHW45PH**. If empty, no tracking loads. | `GTM-XXXXXXX` |
| `CONTACT_TO_EMAIL` | Yes, for email | Who receives contact form messages. Separate several addresses with commas. **Still to be confirmed by the client.** | `office@example.com, eric@example.com` |
| `CONTACT_FROM_EMAIL` | Yes, for email | The sender address, on a domain verified in Resend (section 7). | `Mid Valley Storage <website@midvalleystorage.com>` |
| `RESEND_API_KEY` | Yes, for email | Create it at resend.com → **API Keys**, with "Sending access". | `re_<random>` |
| `EMPLOYEE_PORTAL_PASSWORD` | For the Employee Portal | The shared password staff type on `/employee`. Until it is set, the page shows its placeholder line and no form. | any passphrase |
| `EMPLOYEE_CALENDAR_EMBED_URL` | For the Employee Portal | The Google Calendar embed address. It must start with `https://calendar.google.com/`; anything else is ignored. | `https://calendar.google.com/calendar/embed?src=…` |

Notes:

- `NEXT_PUBLIC_*` values are built into the pages, so a change needs a **redeploy**. So do the other variables:
  Vercel only applies changed variables to new deployments.
- If the three email variables are missing, contact messages are still saved. The owner sees them in the admin
  panel under **Messages**; they just aren't emailed.
- `VERCEL_OIDC_TOKEN` is added by Vercel itself (and by `vercel env pull`). Never set it by hand.
- `NEW_ADMIN_PASSWORD` is only for `npm run admin:reset` on a developer's computer (section 4). Never set it on Vercel.

## 3. Load the content: `npm run seed`

The site works without seeding, because any field that has never been saved is shown from the defaults in the
repository's `content/site.json`. The seed puts those defaults into the Blob store, so the admin panel's history
starts from a known version. It also stores the Phase 1 reference data (`content/pages/*.json`,
`content/image-map.json`, `content/inventory.json`) under `reference/` in the store. That data is never shown to
visitors.

### Running it

Against the live store, from your computer:

```bash
npm install
vercel link                     # once, pick the midvalley project
vercel env pull .env.local      # brings down the Blob settings (and the other variables)
npm run seed
```

Or from any machine, with only the token:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... npm run seed
```

The script reads `.env.local` if it exists, or another file with `npm run seed -- --env .env.production.local`.
It never prints values. Its first line says which store it is using: the **private Vercel Blob store**, or the
**local folder .data/** when no Blob settings are found. If you see `.data/` when you meant the live store, the
Blob settings were not loaded.

`vercel env pull` brings down a `VERCEL_OIDC_TOKEN` that expires after about 12 hours. If the seed reports that
the OIDC token is missing or expired, run `vercel env pull .env.local` again.

### What it does

| Situation | What happens |
| --- | --- |
| Nothing stored yet | Writes the repository defaults and records a history version: "Imported from the repository (npm run seed)". |
| Content already stored (normal case) | **Keeps every stored value; the owner's edits always win.** It only *adds* fields that exist in the repository defaults but are missing from the stored document, for example a field added in a later release. Lists are left exactly as stored. If something was added, it saves and records a history version that lists the added fields; otherwise it prints "Nothing to do". |
| `npm run seed -- --force` | First saves the stored content as a history version ("Before npm run seed --force"), then **replaces all the content with the repository defaults**, and records that too. |
| Reference data | Copied to `reference/…`, but only files that changed. Safe to overwrite. |

Running it twice in a row changes nothing the second time. Nothing is replaced without `--force`.

**Use `--force` only to start over deliberately**, for example on a preview store before launch. To undo it, open
the admin panel → **Change history & undo**, find the version noted "Before npm run seed --force", and choose
**Go back to this version**.

The public pages cache content for up to an hour. An admin save refreshes them at once, but the seed cannot.
After a `--force` run, visitors see the change within the hour, or immediately after the next admin save or a
redeploy. A normal seed only adds fields the site was already showing from its defaults, so visitors see no
change.

## 4. Admin logins

The admin panel is at **`/admin`**.

**First sign-in.** Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Vercel, redeploy, and sign in at `/admin/login` with
exactly those. This creates Eric's account as an **owner**. Then delete `ADMIN_PASSWORD` from Vercel; it is ignored
from now on.

**Adding people and resetting passwords.** An owner opens **People** in the admin panel to:

- add someone as an Editor (can edit everything) or an Owner (can also manage people);
- give someone a new temporary password;
- remove someone.

Each person can change their own password under **Your account**.

**If nobody can sign in** (for example, the only owner forgot their password), a developer with the Blob settings
can run:

```bash
vercel env pull .env.local
npm run admin:reset -- eric@example.com "Eric Smith"
```

- **If the email already has an account:** it gets a new password and its role is kept. Its sessions on every
  device end, and any sign-in lockout is cleared.
- **If the email is new:** an **owner** account is created.
- **The password:** a strong random one, printed **once** in the terminal. To choose it yourself, set
  `NEW_ADMIN_PASSWORD` (10+ characters) for that one command.
- **Where it is stored:** only as a bcrypt hash, in `auth/users.json` in the store.

After 5 wrong passwords in 15 minutes, sign-in for that email pauses for 15 minutes. It clears on its own.

## 5. How content edits go live

Edits in the admin panel are saved to the Blob store, and the public pages update within seconds. There is
**no redeploy** and nothing to do in Vercel or GitHub. Every save is kept in **Change history & undo** (the last 20
versions), and each one can be undone.

Code changes (design, new features) go live by pushing to `main`, which deploys automatically. Deploying never
overwrites the owner's saved content.

## 6. Employee Portal password and calendar

Both are environment variables, so the owner doesn't type them into the admin panel. To change either one:

1. In Vercel: **Settings → Environment Variables**. Edit `EMPLOYEE_PORTAL_PASSWORD` and/or
   `EMPLOYEE_CALENDAR_EMBED_URL` for **Production** (and Preview if wanted).
2. **Redeploy:** go to **Deployments**, open the newest production deployment, then **⋯ → Redeploy**.
3. Changing the password signs every device out of the portal, and staff use the new password from then on.

To get the calendar address: in Google Calendar, open the calendar's **Settings → Integrate calendar**, and copy
the `src="…"` address from the **Embed code**. It starts with `https://calendar.google.com/calendar/embed?`.
Anyone who should see the schedule needs access to that calendar in Google, or the calendar must be shared
publicly. The portal only hides the address from people who don't know the password.

## 7. Contact form email (Resend)

The contact form sends through [Resend](https://resend.com), the same service as rapidselfstorage.com.

1. In Resend, go to **Domains → Add Domain** and enter `midvalleystorage.com`. Resend lists a few DNS records:
   a DKIM `TXT` record, plus an `MX` and an SPF `TXT` record on a sending subdomain (by default `send`). Add exactly
   those at the DNS provider, then click **Verify**. These records sit on their own subdomain, so the domain's
   existing email (its own `MX` records) is not affected. Don't change or remove any existing record.
2. Create an API key (**API Keys → Create**, Sending access) and save it as `RESEND_API_KEY`.
3. Set `CONTACT_FROM_EMAIL` to an address on the verified domain, for example
   `Mid Valley Storage <website@midvalleystorage.com>`. It doesn't need to be a real mailbox.
4. Set `CONTACT_TO_EMAIL` to the address(es) that should receive messages, and redeploy.
5. Test the form on the site. The email arrives with **Reply-To** set to the visitor, so pressing Reply answers
   them directly. The message also appears in the admin panel under **Messages**.

If the domain can't be verified yet, the form still works: messages are saved and shown under **Messages**.

## 8. Security notes (Phase 3)

- **Headers on every page** (`next.config.ts`): Content-Security-Policy, Strict-Transport-Security (2 years,
  includeSubDomains, preload), X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff,
  Referrer-Policy strict-origin-when-cross-origin, and a Permissions-Policy that turns off camera, microphone,
  geolocation and payment.
- **What the CSP allows:** only what the site uses: Google Tag Manager / Analytics, the Google Maps embeds, the
  Google Calendar embed, and Vercel Blob for admin photo uploads. **If someone adds a new tag in Google Tag
  Manager** (Google Ads, a chat widget, Meta Pixel…), its hosts must be added to the CSP in `next.config.ts`,
  or the browser blocks it. The browser console names the blocked host.
- **Admin panel:**
  - `proxy.ts` checks the session cookie on `/admin` and `/api/admin`, and marks those responses
    `noindex, nofollow` and `no-store`. Every admin page and action checks the user again on the server.
  - The session cookie is httpOnly, Secure, SameSite=Lax, and lasts 7 days.
  - Passwords are stored only as bcrypt hashes. Sign-in is rate-limited per email and per connection.
- **Search engines:** `robots.txt` keeps `/admin`, `/api/` and `/employee` out of search engines, and the sitemap
  lists only the four public pages.
- **Secrets** live only in Vercel's environment variables. The Blob store is private; uploaded photos are served
  through `/media/…`, and nothing else in the store can be read from the web.
- **Keep the accounts in the business's name:** GitHub, Vercel, the domain registrar and Resend. Invite developers
  to them; developers should not own them.

## 9. Local development

```bash
npm install
cp .env.example .env.local   # fill in SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD at least
npm run seed                 # optional: fills .data/ with the defaults
npm run dev                  # http://localhost:3000, admin at /admin
```

Without Blob settings, everything is stored in the git-ignored `.data/` folder (same paths as the Blob store).
Delete `.data/` to start over. With `vercel env pull .env.local`, local runs use the **live** store, so saves change
the live site.
