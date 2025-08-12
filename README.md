## OLXCatAI — AI-Powered Email Categorization Add-In

A modern React + TypeScript Outlook add-in for intelligent email categorization. It integrates with Office.js and a backend API, and ships with a streamlined UI built on Fluent UI v9.

### Highlights
- **Smart categorization workflow**: assign categories via rules/keywords and simulated AI prediction
- **Category management**: labels and optional Outlook folder linking (via backend + Graph token)
- **Batch operations**: select, process, and bulk-move messages
- **Dashboard**: stats and recent activity
- **Auth flow**: Office SSO fallback + popup to retrieve JWT and Graph token
- **Outlook add-in**: manifest-driven ribbon button and taskpane

### Tech stack
- React 18 + TypeScript
- Fluent UI v9 (`@fluentui/react-components`)
- Axios-based API client
- Create React App (CRA)

## Getting started

### Prerequisites
- Node.js 16+ and npm
- A running backend API (see Backend API expectations below)
- For Outlook testing: Microsoft 365 with Outlook Desktop or Web

### Install
```bash
npm install
```

### Run (development)
```bash
npm start
```
- The app runs on `https://localhost:3001` (HTTPS is enforced in `package.json`).
- A proxy forwards frontend requests to the backend at `http://localhost:3000`.
- In development, the app simulates Office context if Office.js is unavailable, letting you explore the UI in a regular browser. The header badge will show “Standalone Mode”.

### Build
```bash
npm run build
```

## Configuration

Set via `.env` or environment variables:
- `REACT_APP_API_BASE_URL`: Base URL for the backend API.
  - Defaults to `/api` in development (proxied to `http://localhost:3000`) and `http://localhost:3000/api` in production if not set.
- `REACT_APP_APP_ORIGIN`: Public origin of the app (used in auth callback URLs). Default: `http://localhost:3000`.

Example `.env.development.local`:
```
REACT_APP_API_BASE_URL=/api
REACT_APP_APP_ORIGIN=https://localhost:3001
```

## Outlook add-in

This project includes a production-ready Outlook Add-in manifest at `public/manifest.xml` that points to the development server on `https://localhost:3001`.

### Sideload in Outlook (Desktop)
1. Start the app: `npm start`
2. In Outlook: Get Add-ins → My Add-ins → Add a custom add-in → Add from File
3. Select `public/manifest.xml`
4. Open an email and use the “OLXCatAI” button to show the task pane

### Office/Graph integration
- Office SSO is attempted via `OfficeRuntime.auth.getAccessToken`. If unavailable, a popup-based auth flow is used.
- The auth callback bridges are hosted at:
  - `public/auth-callback.html`
  - `public/auth/callback/index.html` (alias for dev)
- On success, the app stores a JWT and a Graph token in `sessionStorage` via `AuthStore`.
- The API client sends `Authorization: Bearer <jwt>` and `x-graph-token: <token>` (when present).

## Backend API expectations

The frontend expects these endpoints (JSON):
- `GET /health/status`
- Auth
  - `GET /auth/login` → returns `{ authUrl }` for popup/dialog login
  - `POST /auth/logout`
- Emails
  - `GET /emails` (query: `top`, `skip`)
  - `GET /emails/search` (query: `q`, `top`, `skip`)
  - `GET /emails/:id`
  - `POST /emails/:id/categorize` `{ categories: string[] }`
  - `POST /emails/:id/read`
  - `POST /emails/:id/predict-category`
  - `POST /emails/:id/move` `{ categoryId }`
  - `POST /emails/bulk-move` `{ messageIds, categoryId, batchSize?, concurrency? }`
- Categories
  - `GET /categories`
  - `GET /categories/defaults`
  - `GET /categories/:id`
  - `POST /categories` `{ name, color, keywords?, linkFolder? }`
  - `PUT /categories/:id`
  - `DELETE /categories/:id` (query: `hard`)
  - `POST /categories/sync-from-outlook`
- Reports
  - `GET /reports/category-usage`

Note: The actual AI classification and Graph operations (create folder, move message) are performed by the backend. The UI simulates certain actions in development to allow quick iteration.

## Project structure

```
src/
├─ components/
│  ├─ Dashboard.tsx            # Stats and quick actions
│  ├─ CategoryManager.tsx      # Manage labels/folders and keywords
│  ├─ EmailProcessor.tsx       # Batch selection, progress, bulk move
│  ├─ EmailList.tsx            # Paginated email list with search
│  ├─ EmailDetail.tsx          # Single email view and actions
│  ├─ HeaderBar.tsx            # App header with auth/health
│  ├─ SignInGate.tsx           # Auth gate that triggers token flow
│  ├─ Toaster.tsx              # App-wide notifications
│  └─ LoadingSkeleton.tsx
├─ hooks/
│  ├─ useCategories.ts         # Category CRUD, Outlook sync
│  ├─ useEmails.ts             # Email list and local updates
│  ├─ useSettings.ts           # Local settings store (mock)
│  └─ useOffice.ts             # Office integration with dev fallbacks
├─ lib/
│  ├─ http.ts                  # Axios instance + auth/graph headers
│  ├─ outlookAuth.ts           # Auth popup/SSO + token handling
│  ├─ mappers.ts               # Backend → UI model mapping
│  ├─ idConversion.ts          # EWS → Graph v2 id conversion helper
│  └─ notify.ts                # App-level notification bus
├─ services/                   # API clients
├─ stores/auth.ts              # Session-scoped auth store
├─ config/env.ts               # Env resolution helpers
└─ types/                      # Shared TS types
```

## Development notes
- The dev server runs at `https://localhost:3001` to satisfy Office add-in HTTPS requirements. The manifest in `public/manifest.xml` references that origin.
- `public/function-file.html` exposes `window.OLXCatAI.*` helpers used by `useOffice`. In development, these are mocked if Office.js is unavailable, enabling a smooth browser-only workflow.
- The UI uses strict TypeScript settings (`tsconfig.json`) and Fluent UI v9 responsive primitives (`makeStyles`, `tokens`).

## Scripts
- `npm start` — start HTTPS dev server on port 3001
- `npm run build` — production build
- `npm test` — CRA test runner

## Security & permissions
- The Outlook manifest requests `ReadWriteMailbox` permission for message access.
- All URLs in production manifests must be HTTPS. Update `public/manifest.xml` before publishing.

## License
No license file is present. If you intend to open-source this project, add a `LICENSE` file and update this section.

## Support
- See `DEPLOYMENT.md` for end-to-end deployment guidance
- File issues or reach out to the maintainers for help

—

Transform email management with intelligent categorization and a polished Outlook experience.