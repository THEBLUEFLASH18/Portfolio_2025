# Portfolio 2025

Single-page portfolio with a gated dashboard-style comms uplink powered by Firebase Auth and Firestore.

## What’s here
- **Static pages**: `index.html` (public landing with auth form) and `dashboard.html` (authenticated view with chat UI). Both share the same layout/sections and load `script.js` as a module.
- **Styling**: `styles.css` for the retro console theme; `Loading.html/.css/.js` for a progress splash screen.
- **GitHub cards**: `script.js` fetches the six most recently updated repos for `THEBLUEFLASH18` and rewires the “Experiments” cards with repo data.
- **Auth**: Firebase email/password and Google Sign-In; auth state listener redirects between `index.html` and `dashboard.html`.
- **Comms**: Firestore-backed chat. Each message is a document in `messages` with `conversationId` = visitor UID, `senderId`, `senderEmail`, `role` (`visitor` or `admin`), and `timestamp`. The dashboard subscribes to `conversationId == currentUser.uid` ordered by `timestamp`.
- **Deployment helper**: `netlify.toml` replaces `FIREBASE_KEY_PLACEHOLDER` in `script.js` with the Netlify env var `FIREBASE_KEY`.

## Firebase setup
1) Create a Firebase project and a web app; enable Email/Password and Google providers.  
2) In Firestore, create the composite index that the chat query needs: collection `messages`, fields `conversationId` (ASC) and `timestamp` (ASC).  
3) Add your Firebase config to `script.js` (or keep the placeholder if Netlify injects it).  
4) For Netlify: set env var `FIREBASE_KEY` and keep the `netlify.toml` build command as-is.

## Admin replies (no UI yet)
Use the Firebase console → Firestore → `messages` → “Add document” with:
- `conversationId`: the visitor’s UID
- `senderId`: something like `admin`
- `senderEmail`: your email (optional)
- `role`: `admin`
- `text`: your reply
- `timestamp`: server timestamp

The dashboard already renders any doc where `conversationId` matches the visitor and orders them by `timestamp`, showing admin vs visitor styling.

## Running locally
Serve the files with any static server (or open `index.html`). If not deploying through Netlify, replace `FIREBASE_KEY_PLACEHOLDER` in `script.js` with your real `apiKey` before loading the page. Replace CDN Firebase version numbers if you want to pin a different release.
