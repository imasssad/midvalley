# Go-live checklist: midvalleystorage.com

This is the step-by-step plan for switching midvalleystorage.com from the old WordPress site (hosted at SiteGround)
to the new site (hosted at Vercel). Do the steps in order and tick each box as you go.

Nothing here deletes the old site. Until step 7, the old site stays exactly as it is, so you can go back to it at
any time.

> Technical details for the developer (environment variables, the seed script, email setup) are in
> [DEPLOY.md](DEPLOY.md). How to edit the website yourself is in the admin guide ([ADMIN-GUIDE.md](ADMIN-GUIDE.md)).

---

## Step 1. Answer the open questions

The new site uses only facts from the old site. Where the old site didn't say something, the new site leaves it
out or marks it as a placeholder. Please confirm or provide each of these. Most of them can be filled in by you,
directly in the admin panel, once you have your login (step 2).

- [ ] **"Rent Online" links, one per location.**
  - The old site had no Storedge "Rent Online" / move-in links. Its only "Reserve" buttons still go to the old
    QuikStor system (and on the About Us page, the Santa Fe button pointed at the Noble account).
  - The new site uses those old QuikStor links for now, as placeholders.
  - Please send the correct online-rental link for **Visalia Noble** and for **Visalia Santa Fe**. Or tell us to
    hide the Rent Online buttons.
  - Where to change it: **Admin → Locations & contact**. Paste each link, then tick "The client confirmed this
    Rent Online link".
- [ ] **Office hours** for each location.
  - The old site only listed gate hours (6AM to 8PM). Office hours stay hidden until they are filled in.
  - Where: **Admin → Locations & contact**.
- [ ] **Customer reviews (testimonials): yes or no?**
  - The old homepage had a "What Our Customers Say" heading with no reviews under it. The new site hides that
    section until at least one review is added.
  - Only use real reviews, with the customer's permission.
  - Where: **Admin → Reviews**.
- [ ] **Who should receive contact form messages** (`CONTACT_TO_EMAIL`). Several addresses are fine.
  - The old form's recipient can't be seen from outside the old site.
  - Every message is also kept in **Admin → Messages**, so nothing is lost while this is being decided.
- [ ] **Employee Portal password, and the Google Calendar link** for the staff schedule.
  - Until both are set, the Employee page shows "Employee page coming soon".
  - The developer adds them to Vercel (see DEPLOY.md, section 6).
- [ ] **The "Upfront, flat rate" selling point** in the blue bar under the promo banner. This wording wasn't on
  the old website. Please confirm it is accurate, or tell us what it should say. Where: **Admin → Home page**.
- [ ] **The photo `rss.jpg`** in the About Us photo gallery ("Wide view of a storage facility across the road").
  - It comes from the old site's media library, where its file name is RSS.jpg.
  - Please confirm it shows a Mid Valley facility, and not another business.
  - If it shouldn't be there, replace or remove it in **Admin → About Us page**.
- [ ] **A larger version of the promo banner for computer screens.** The current banner image is 1774 × 887
  pixels, which can look soft on large monitors. If you have the original design file, please send a wider export.
  Where: **Admin → Promo banner**.

## Step 2. Set up the new site on a preview address and review it together

- [ ] The developer creates the Vercel project, connects the private Blob store, adds the settings and deploys.
  See DEPLOY.md, sections 1 and 2.
- [ ] The developer loads the content (`npm run seed`) and sets up Eric's admin login.
- [ ] Vercel gives the site a preview address (something like `midvalley-….vercel.app`). Nothing changes for
  visitors yet: midvalleystorage.com still shows the old site.
- [ ] Eric and the developer go through every page together on the preview address, on a phone and on a
  computer. Use the test list in step 6.
- [ ] Eric signs in to the admin panel, makes a small change, sees it on the preview site, and undoes it.
- [ ] Fill in the answers from step 1.
- [ ] **Eric approves the switch.**

## Step 3. Leave the WordPress site alone

- [ ] Don't change, cancel or delete anything at SiteGround: hosting, WordPress, email or DNS. The old site is the
  backup until the new one is approved and has run well for a while (step 7).
- [ ] Optional but recommended: take a full backup at SiteGround (**Site Tools → Security → Backups → Create**).

## Step 4. One day before the switch: lower the DNS "TTL"

The TTL is how long computers remember where your domain points. Lowering it makes the switch, or a switch back,
take effect within minutes instead of hours.

- [ ] Find out where the domain's **DNS** is managed. This may be the registrar (where the domain was bought) or
  SiteGround. Look up which "nameservers" the domain uses.
  - **If the nameservers are SiteGround's**, the DNS records (including email) live at SiteGround. Do not cancel
    SiteGround until DNS has been moved somewhere else.
- [ ] **Write down or screenshot every existing DNS record** before changing anything, especially the **MX**
  (email) and **TXT** records.
- [ ] At least 24 hours before the switch, set the TTL of the records for `midvalleystorage.com` and
  `www.midvalleystorage.com` to 300 seconds (5 minutes).

## Step 5. Switch the domain to Vercel

- [ ] In Vercel, open the project, then **Settings → Domains**. Add `midvalleystorage.com` and set it as the
  **primary** domain.
- [ ] Add `www.midvalleystorage.com` and set it to **redirect to `midvalleystorage.com`** (301). This matches how the
  site works today: the address without "www" is the main one.
- [ ] At the DNS provider, change **only** the website records to the values Vercel shows. Usually that is an `A`
  record for `midvalleystorage.com` and a `CNAME` record for `www`. **Do not touch the MX records or any other
  record**, or email may stop working.
- [ ] Wait until Vercel shows both domains as **Valid Configuration** and has issued the security certificate
  (https). This usually takes a few minutes, sometimes up to an hour.
- [ ] Set up the contact form email as described in DEPLOY.md, section 7, if this hasn't been done yet.

## Step 6. Test everything on the real address

Go through this list on https://midvalleystorage.com. Test on a phone and on a computer.

- [ ] Every page opens: Home, About Us, Facility Features, Contact, Employee Portal, and a made-up address (it
  should show the "page not found" page).
- [ ] Old addresses still work: `/about-us/`, `/facilityfeatures/`, `/contact/` and `/employee/` (with the slash at
  the end) open the right pages.
- [ ] `http://midvalleystorage.com` and `https://www.midvalleystorage.com` both end up at
  `https://midvalleystorage.com`, and the browser shows the padlock.
- [ ] Phone numbers call the right location: Noble (559) 734-7368, Santa Fe (559) 608-5301.
- [ ] "Make a payment" opens the correct Storedge page for **each** location.
- [ ] "Rent Online" opens the confirmed link for each location (or is hidden, if that's what was decided).
- [ ] Map and directions links open the right place for each location.
- [ ] The Instagram link opens the Mid Valley Storage Instagram page.
- [ ] The contact form:
  - Send a test message for each location.
  - The email arrives at `CONTACT_TO_EMAIL`, and pressing Reply answers the sender.
  - The message also appears in **Admin → Messages**.
- [ ] Employee Portal: a wrong password is refused. The right password shows the schedule.
- [ ] Admin panel at `/admin`:
  - Sign in, change a word, check that the live site shows it within seconds, then undo it.
- [ ] **Google Search Console:**
  - Make sure the domain is still verified (see "Search Console" below).
  - Submit `https://midvalleystorage.com/sitemap.xml` under **Sitemaps**.
  - Use **URL Inspection** on the homepage.
- [ ] **Google Tag Manager:**
  - In Tag Manager, open container **GTM-TBHW45PH** and click **Preview** (Tag Assistant). Enter
    https://midvalleystorage.com.
  - Check that the tags fire on page views. Check any form or click tags too.
  - Check that Google Analytics shows the visit in its **Realtime** report.
- [ ] Share a page link in a message app and check that the preview shows the right title and picture.

## Step 7. Keep the old site for at least two weeks

- [ ] Leave the SiteGround hosting and the WordPress site running for at least two weeks after the switch. If
  something goes wrong, the DNS records can be pointed back to it within minutes.
- [ ] After two weeks without problems, raise the DNS TTL back to its normal value (for example 3600).
- [ ] **Ask Eric before cancelling anything**: SiteGround hosting, email accounts, plugins or licenses (such as
  Elementor Pro). First check the list below. Some things may still depend on SiteGround.

---

## Things that depend on the old WordPress site

Check each of these **before** the switch (step 5) and **before** cancelling anything (step 7).

| What | Why it matters | What to do |
| --- | --- | --- |
| **Email at the domain** (for example `someone@midvalleystorage.com`) | Email is delivered according to the domain's **MX records**. If they change or disappear, email stops arriving. | Before the switch, write down the MX records (and the email-related TXT records: SPF, DKIM, DMARC). When changing DNS, **change only the website records** and keep the MX and TXT records exactly as they are. Afterwards, send a test email to each address. |
| **SiteGround email accounts** | If mailboxes are hosted at SiteGround, they live inside the hosting plan. Cancelling the plan deletes them. | Check **SiteGround Site Tools → Email → Accounts**. If there are any, move them to an email provider (for example Google Workspace or Microsoft 365) **before** cancelling SiteGround, and update the MX records at that time. |
| **The contact form** (Elementor, on the old site) | It sends messages to an address we can't see from outside, and it stops working when the old site is switched off. | The new form sends to `CONTACT_TO_EMAIL` and also keeps every message in **Admin → Messages**. Check in WordPress (**Elementor → Submissions**, or the form's "Email" settings) who receives messages today, and use that address, or the one Eric prefers, for `CONTACT_TO_EMAIL`. |
| **Google Tag Manager** (GTM-TBHW45PH) | Google Analytics and any other tracking run through this container. | The new site loads the same container (`NEXT_PUBLIC_GTM_ID`). Check it fires on the live domain (step 6). Tags that relied on WordPress page elements may need updating, for example a "form submitted" trigger tied to the old Elementor form. |
| **Google Search Console verification** | If Search Console was verified with a meta tag or an uploaded HTML file on the WordPress site, verification is lost when that site goes away. | In Search Console, open **Settings → Ownership verification** to see the method. A **DNS record** (TXT) or **Google Analytics / Tag Manager** method keeps working, as long as that TXT record is kept. A **meta tag** or **HTML file** method needs replacing: add the domain as a "Domain property" verified with a DNS TXT record, before the switch. |
| **SSL certificate (https)** | SiteGround's certificate covers the old server only. | Vercel issues and renews a free certificate automatically once the domain points to it (step 5). Nothing to buy or move. |
| **Instagram link** | The footer and contact page link to Instagram. | The new site keeps the same link (`instagram.com/midvalleystorage`). Change it in **Admin → Locations & contact** if it ever changes. Update the website link in the Instagram profile only if the address changes (it doesn't). |
| **QuikStor links** on the old site | The old "Reserve" buttons still go to the old QuikStor system. | Confirm the correct Storedge "Rent Online" links (step 1). Once confirmed, nothing on the new site should point to QuikStor. If the QuikStor account is no longer used, it can be closed, but ask Eric first. |
| **Employee page password** | The old Employee page is protected by a WordPress password. That password stops working with the old site. | The new Employee Portal uses its own password (`EMPLOYEE_PORTAL_PASSWORD`) and calendar link. Agree the password with Eric, let staff know, and check the calendar shows (step 6). |
| **Analytics goals / conversions** | Goals in Google Analytics or Google Ads (such as "contact form sent" or "phone click") may depend on old page addresses or the old form. | Look through the goals (key events) in Google Analytics and the triggers in Tag Manager. Page addresses stay the same (`/contact` etc.). Anything tied to the Elementor form or a "thank you" page must be re-checked after the switch, with Tag Assistant (step 6). |
