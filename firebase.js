// ============================================================================
// MoonStreamHD - shared Firebase module.
// index.html AND admin.html both import this file, so both panels use the
// SAME Firebase project and the SAME single app instance.
//
// SETUP: paste your real Web App config below.
// Firebase Console > Project settings (gear icon) > General > Your apps >
// Web app > SDK setup and configuration > "Config".
// ============================================================================
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyC5F8nVV0SEX7hJE8q_v9jALlnxooFCJas',
  authDomain: 'moonstreamhd.firebaseapp.com',
  projectId: 'moonstreamhd',
  storageBucket: 'moonstreamhd.firebasestorage.app',
  messagingSenderId: '175246327543',
  appId: '1:175246327543:web:81d66f3c84c42097589df2'
};

// Cloud Functions region (only used by the Stripe "Manage billing" button).
// Use the region you chose when installing the Stripe extension.
export const FUNCTIONS_REGION = 'us-central1';

// Stripe membership (optional - see README). Leave empty until you set up Stripe.
export const PRICE_ID = '';     // e.g. the Price ID of your monthly "Download membership"
export const PRICE_TEXT = '';   // e.g. the price text shown to viewers

// ===== Configuration check (no fake values, no demo fallback) =====
const REQUIRED = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missing = REQUIRED.filter(k => !String(firebaseConfig[k] || '').trim());
export const configError = missing.length
  ? 'Firebase is not configured. Open firebase.js and paste your Firebase Web App config. Missing: ' + missing.join(', ') +
    '. Get it from Firebase Console > Project settings > Your apps > Web app > Config. See README.md.'
  : '';

function showConfigError(msg) {
  console.error(msg);
  const put = () => {
    const d = document.createElement('div');
    d.setAttribute('role', 'alert');
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0e0d12;color:#ff8a98;padding:24px;font:16px/1.5 system-ui,sans-serif;overflow:auto';
    const h = document.createElement('h2'); h.textContent = 'Setup required'; h.style.color = '#ff3b52';
    const p = document.createElement('p'); p.textContent = msg;
    d.append(h, p); document.body.appendChild(d);
  };
  if (typeof document === 'undefined') return;
  document.body ? put() : addEventListener('DOMContentLoaded', put);
}

// ===== Initialize Firebase exactly once =====
let app = null;
if (configError) showConfigError(configError);
else app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const functions = app ? getFunctions(app, FUNCTIONS_REGION) : null;

// Friendly text for common Firebase errors (shown in both panels)
export function errMsg(e) {
  const c = (e && e.code) || '';
  const m = {
    'auth/operation-not-allowed': 'Email/Password sign-in is not enabled. Firebase Console > Build > Authentication > Sign-in method > enable Email/Password.',
    'auth/unauthorized-domain': 'This domain is not authorized. Firebase Console > Authentication > Settings > Authorized domains > add it.',
    'auth/invalid-api-key': 'The apiKey in firebase.js is invalid.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'The apiKey in firebase.js is invalid.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'Wrong email or password.',
    'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
    'auth/weak-password': 'Password is too weak (6+ characters).',
    'auth/invalid-email': 'That email address is not valid.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/internal-error': 'Firebase Authentication returned an internal error. Check the Web App config and try again.',
    'auth/invalid-continue-uri': 'The configured redirect URL is invalid. Check the Firebase Authentication settings.',
    'auth/missing-email': 'Enter your email address first.',
    'auth/missing-password': 'Enter your password first.',
    'auth/account-exists-with-different-credential': 'This email is already registered with a different sign-in method.',
    'permission-denied': 'Permission denied by Firestore rules. Publish firestore.rules, confirm the signed-in UID has a document in admins, and check the relevant collection permissions.',
    'failed-precondition': 'Firestore is not ready (is the database created?). ' + (e && e.message || ''),
    'unavailable': 'Firestore is unreachable. Check your connection and that the database exists.',
    'not-found': 'The requested Firebase resource was not found. Check that Firestore is created and the project ID is correct.',
    'resource-exhausted': 'Firebase quota or rate limit reached. Check the project usage and billing limits.',
    'storage/unauthorized': 'Storage access denied. Check Firebase Storage rules and authentication.',
    'functions/not-found': 'The requested Cloud Function was not found. Check the deployed function name and region.'
  }[c];
  return m ? m + ' (' + c + ')' : (c ? c + ': ' : '') + (e && e.message || 'Unknown error');
}

// ===== Embeds =====
// Video links from these hosts play inside the app in a sandboxed player. Add the host of your own video service here.
export const EMBED_HOSTS = [
  'iframe.mediadelivery.net',   // Bunny Stream
  '*.cloudflarestream.com',     // Cloudflare Stream
  'iframe.videodelivery.net',   // Cloudflare Stream
  'player.vimeo.com',           // Vimeo
  'youtube.com',                // YouTube (hostname is normalized below)
  'youtube-nocookie.com'
];
// Returns the player URL to put in an iframe, or null if the link is a plain video file / not an allowed host
export function embedUrl(u) {
  try {
    const x = new URL(u), h = x.hostname.replace(/^www\./, '');
    if (x.protocol !== 'https:') return null;
    if (h === 'youtu.be' && x.pathname.length > 1) return 'https://www.youtube-nocookie.com/embed/' + x.pathname.slice(1);
    if (h === 'youtube.com' && x.pathname === '/watch' && x.searchParams.get('v')) return 'https://www.youtube-nocookie.com/embed/' + x.searchParams.get('v');
    if (h === 'vimeo.com' && /^\/\d+/.test(x.pathname)) return 'https://player.vimeo.com/video/' + x.pathname.split('/')[1];
    if (/\.(mp4|m3u8|webm)$/i.test(x.pathname)) return null;
    return EMBED_HOSTS.some(p => p.startsWith('*.') ? x.hostname.endsWith(p.slice(1)) : x.hostname === p) ? x.href : null;
  } catch (e) { return null; }
}
