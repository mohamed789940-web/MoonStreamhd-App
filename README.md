# MoonStreamHD app (installable web app + admin panel)

`index.html` (users) and `admin.html` (admin) both import the single shared `firebase.js`, so they always use the same Firebase project. Firebase is initialized once there (`getApps()` / `initializeApp()`), and `auth`, `db` and `functions` are exported from it.

## Setup guide
1. **Create the project.** console.firebase.google.com > Add project (skip if you already have one).
2. **Copy the Web App config.** Project settings (gear icon) > General > Your apps. Add a **Web app** (`</>`) if none exists, then under "SDK setup and configuration" choose **Config**. Paste the six values into `firebase.js`:
   `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
   Until all six are filled in, both pages show a "Setup required" message listing what is missing. Nothing falls back to demo data.
3. **Enable Email/Password sign-in.** Build > Authentication > Get started > Sign-in method > Email/Password > Enable.
4. **Create Firestore.** Build > Firestore Database > Create database (pick a region, production mode).
5. **Security rules.** Firestore Database > Rules: paste the contents of `firestore.rules` and **Publish**. (Or `firebase deploy --only firestore:rules`.) Rules are intentionally restrictive: only published titles are public, admin writes require an `admins/{Auth UID}` document, and private download URLs require the `stripeRole: member` custom claim or admin access.
6. **Create your admin.** Authentication > Users > Add user (your admin email + password). Open `/admin.html` and sign in once. It shows your user ID (or copy the UID from the Users tab). In Firestore create collection `admins` with a document whose **ID is that UID** (add any field, e.g. `role: admin`). Reload `/admin.html`.
7. **Authorized domains.** Authentication > Settings > Authorized domains must include the domain you serve from (your Firebase Hosting domains are added automatically; add custom domains yourself).
8. **Deploy.** `npm i -g firebase-tools`, `firebase login`, `firebase init hosting` (public directory = this folder, single-page app = No, do not overwrite existing files), `firebase deploy`. Any HTTPS host also works. Do not open the files via `file://` (ES modules and the service worker need http(s)); for local testing use `npx serve .` or `firebase emulators:start --only hosting`.
9. **Install on a phone.** Open the site and use "Add to Home Screen" / "Install".

Admin panel: add, edit, delete titles; the **Published** checkbox controls whether a title is visible in the user app (drafts stay admin-only); **Featured** puts it in the home slider.

Important: the ZIP cannot include your real Firebase credentials. You must paste the six values from your own Firebase Web App into `firebase.js`; otherwise neither panel can connect.

Common errors the pages now show in plain text: `Permission denied` (rules not published, or your UID is not in `admins`), `operation-not-allowed` (Email/Password not enabled), `unauthorized-domain` (add the domain, step 7).

Video files: host MP4 or HLS (.m3u8) on your own storage/CDN over https, and paste the URL in admin.
The video host must allow your site's domain (CORS) for HLS playback.

## Login + Download membership (first month free)
Sign-in uses Firebase Authentication (enable **Email/Password**). Streaming stays free; **downloads need a membership**.
1. Stripe: create a product "Download membership" with a **monthly recurring price**. Add product metadata `firebaseRole` = `member`. Turn on the Customer Portal (Stripe dashboard > Settings > Billing).
2. Firebase: upgrade to the Blaze plan, then install the extension **Run Payments with Stripe**. Use `customers` and `products` as the collection names and sync the product and prices.
3. In `firebase.js` set `PRICE_ID`, `PRICE_TEXT` and `FUNCTIONS_REGION` (the region you chose). Until `PRICE_ID` is set, the "Start free month" button shows a clear "not set up" message; the rest of the app works without Stripe.
4. Publish the new `firestore.rules`. The download link of each title lives in `titles/<id>/private/download` and only members can read it.
5. Open admin and re-save every title that has a download URL (this moves the link into the private spot and removes the old public one).
Notes: the free month is 30 days, card required, one per account (people can still make new accounts, so watch for abuse in Stripe). If the billing portal fails, check the function name in `index.html` (`ext-<your-instance-id>-createPortalLink`).
Downloaded files stay on the device. The app stops playing them when the last known membership end date has passed. That check runs in the browser, so treat it as a convenience, not strong protection.

## Downloads (Netflix-style)
- In admin, fill **Download URL** with a direct https .mp4. Leave it empty to turn downloads off for that title (HLS can't be downloaded).
- Viewers tap **Download** on a title. The file is saved on their device and appears under **Downloads**, where it plays offline.
- Your video host must send CORS headers allowing your site's domain, or downloads fail.
- Works best for files under about 1 GB. iPhones limit storage and can clear it, so keep files small (720p MP4).

## Embeds (YouTube, Vimeo, Bunny Stream, Cloudflare Stream...)
- In admin, **Video link** accepts a file (.mp4 / .m3u8), a normal YouTube or Vimeo link, a player link, or the full `<iframe ...>` embed code (the link is pulled out for you).
- Embeds play in a sandboxed player inside the app. Only hosts listed in `EMBED_HOSTS` (in `firebase.js`) are allowed. Add your own video service there and redeploy.
- An embedded video can't be downloaded by the app. For downloads, fill **Download URL** with an .mp4 file (members only).
