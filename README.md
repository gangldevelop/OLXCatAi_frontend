# OLXCatAI — AI-Powered Email Categorization Add-In

A modern React + TypeScript Outlook add-in for intelligent email categorization. It integrates with Office.js and a backend API, featuring a polished UI built on Fluent UI v9 optimized for Outlook's narrow add-in pane.

## Highlights

- **AI-powered categorization**: Intelligent email categorization with confidence scoring and batch processing
- **Smart category management**: Create and manage categories with keywords, colors, and optional Outlook folder linking
- **Email monitoring subscriptions**: Automatic webhook-based email categorization via Microsoft Graph
- **Real-time updates**: Polling-based change feed for category status updates and email movements
- **Batch operations**: Select multiple emails and bulk categorize/move with AI predictions
- **Comprehensive dashboard**: Statistics, recent activity, and quick navigation
- **Reporting**: Category usage analytics and insights
- **Responsive UI**: Optimized for Outlook add-in's narrow width with content constraints
- **Auth flow**: Office SSO with fallback to popup-based OAuth for JWT and Graph token retrieval
- **Outlook integration**: Manifest-driven ribbon button and taskpane

## Tech Stack

- **React 18** + **TypeScript** (strict mode)
- **Fluent UI v9** (`@fluentui/react-components`) - Modern design system
- **Axios** - HTTP client with interceptors for auth
- **Create React App (CRA)** - Build tooling
- **DOMPurify** - HTML sanitization for email content
- **office-addin-dev-certs** - SSL certificate management for development

## Getting Started

### Prerequisites

- **Node.js 16+** and npm
- **Backend API** running on `http://localhost:3002` (see Backend API expectations below)
- **Microsoft 365** account for Outlook testing (Desktop or Web)
- **SSL Certificates** (auto-generated on first run)

### Installation

```bash
npm install
```

### SSL Certificate Setup

The app uses `office-addin-dev-certs` for local HTTPS development. Certificates are automatically generated on first run:

```bash
npm run install:certs
```

This creates trusted SSL certificates in `%USERPROFILE%\.office-addin-dev-certs\` for `https://localhost:3001`.

### Development

```bash
npm start
```

**What happens:**
- App runs on `https://localhost:3001` (HTTPS required for Outlook add-ins)
- Development proxy forwards `/api/*` requests to backend at `http://localhost:3002`
- SSL certificates are automatically loaded from `%USERPROFILE%\.office-addin-dev-certs\`
- In browser-only mode (no Office.js), the app simulates Office context for UI testing

**Environment Variables (set in start script):**
- `PORT=3001` - Frontend port
- `HTTPS=true` - Enforce HTTPS
- `SSL_CRT_FILE` - Path to SSL certificate
- `SSL_KEY_FILE` - Path to SSL key
- `REACT_APP_APP_ORIGIN=https://localhost:3001` - Frontend origin for auth callbacks
- `REACT_APP_AI_ENABLE=true` - Enable AI features
- `DANGEROUSLY_DISABLE_HOST_CHECK=true` - Disable host check for proxy

### Build

```bash
npm run build
```

Production build outputs to `build/` directory.

## Configuration

### Environment Variables

Set via `.env` files or environment variables:

- **`REACT_APP_API_BASE_URL`**: Base URL for backend API
  - Defaults to `/api` in development (proxied via CRA proxy)
  - In production, defaults to `${APP_ORIGIN}/api`
  
- **`REACT_APP_APP_ORIGIN`**: Public origin for auth callbacks
  - Defaults to `https://localhost:3001` in development
  - Used for OAuth redirect URIs
  
- **`REACT_APP_BACKEND_ORIGIN`**: Backend origin (without `/api`)
  - Defaults to `http://localhost:3002` in development
  - Used for building absolute redirect URLs
  
- **`REACT_APP_AI_ENABLE`**: Enable/disable AI features
  - Set to `'true'` to enable AI categorization features
  
- **`REACT_APP_ORGANIZATION_ID`**: Organization ID for admin presets
  - Default: `93317fce-e17a-4db0-a445-deea729eaae9`

Example `.env.development.local`:
```env
REACT_APP_API_BASE_URL=/api
REACT_APP_APP_ORIGIN=https://localhost:3001
REACT_APP_BACKEND_ORIGIN=http://localhost:3002
REACT_APP_AI_ENABLE=true
```

### Package.json Proxy

The `package.json` includes a proxy configuration:
```json
"proxy": "http://localhost:3002"
```

This proxies all `/api/*` requests to the backend, avoiding CORS issues and mixed content problems (HTTPS frontend → HTTP backend).

## Outlook Add-In

### Manifest

The project includes a production-ready Outlook Add-in manifest at `public/manifest.xml` configured for `https://localhost:3001`.

### Sideloading (Development)

1. Start the app: `npm start`
2. Open Outlook Desktop
3. Go to: **Get Add-ins** → **My Add-ins** → **Add a custom add-in** → **Add from File**
4. Select `public/manifest.xml`
5. Open an email and click the **"OLXCatAI"** ribbon button to open the task pane

### Office/Graph Integration

**Authentication Flow:**
- Primary: Office SSO via `OfficeRuntime.auth.getAccessToken`
- Fallback: Popup-based OAuth flow when Office SSO unavailable
- Auth callback pages:
  - `public/auth-callback.html`
  - `public/auth/callback/index.html` (dev alias)

**Token Storage:**
- JWT and Graph token stored in `sessionStorage` via `AuthStore`
- API client automatically sends:
  - `Authorization: Bearer <jwt>` header
  - `x-graph-token: <token>` header (when available)

**Permissions:**
- Manifest requests `ReadWriteMailbox` for message access
- Graph API scopes: `Mail.Read`, `Mail.ReadWrite`, `Mail.ReadWrite.Shared`

## Application Features

### Navigation Tabs

1. **Home** - Dashboard with statistics and quick actions
2. **Emails** - Email list with search, filtering, and detail view
3. **Settings** - User preferences and configuration
4. **Reports** - Category usage analytics and insights

### Core Features

#### Dashboard
- Email statistics and counts
- Recent activity feed
- Quick navigation to categories and emails
- Category overview cards

#### Email Management
- **Email List**:
  - Paginated email listing with search
  - Category filtering
  - Bulk selection and AI categorization
  - Status badges (New/Done)
  - Category tags display
  - Responsive table layout optimized for narrow width
  
- **Email Detail**:
  - Full email content view
  - HTML email rendering with content constraints
  - AI category prediction with confidence scores
  - Manual category assignment
  - Move to category/folder
  - Mark as read
  - Content constrained to Outlook add-in width (no horizontal overflow)

#### Category Management
- Create/edit/delete categories
- Color coding
- Keyword-based rules
- Outlook folder linking
- Sync categories from Outlook folders
- Default category presets

#### AI Categorization
- Single email prediction
- Bulk email categorization with confidence filtering
- Predictive plan preview before execution
- Feedback loop for model improvement
- Confidence threshold filtering

#### Email Monitoring & Subscriptions
- **Subscription Management** (`SubscriptionStatus` component):
  - Start/stop email monitoring subscriptions
  - View subscription status
  - Microsoft Graph webhook integration (backend-handled)
  
- **Real-time Updates** (`CategoryUpdates` component):
  - Polling-based change feed (30-second intervals)
  - Display category updates and email movements
  - No frontend webhook processing (backend handles all Graph integration)

#### Reporting
- Category usage statistics
- Email distribution by category
- Time-based analytics
- Visual charts and graphs

## Backend API Expectations

The frontend expects these REST endpoints (all JSON):

### Health
- `GET /api/health/status` - Health check

### Authentication
- `GET /api/auth/login?frontend_redirect_uri=<url>` - Returns `{ authUrl: string }` for OAuth popup
- `POST /api/auth/logout` - Logout endpoint

### Emails
- `GET /api/emails?top=<number>&skip=<number>` - List emails (supports ETag caching)
- `GET /api/emails/search/:query?top=<number>&skip=<number>` - Search emails
- `GET /api/emails/:id` - Get email details
- `POST /api/emails/:id/categorize` - `{ categories: string[] }`
- `POST /api/emails/:id/read` - Mark as read
- `POST /api/emails/:id/predict-category` - AI prediction → `{ predictions: Array<{ categoryId: string, confidence: number }> }`
- `POST /api/emails/:id/move` - `{ categoryId: string }` (requires Graph token)
- `POST /api/emails/:id/feedback` - `{ categoryId: string, autoMove: boolean }` (requires Graph token)
- `POST /api/emails/bulk-move` - `{ messageIds: string[], dryRun?: boolean, minConfidence?: number }` → `{ results: Array<{ messageId, ok, reason, predictedCategoryId }> }` (requires Graph token)

### Categories
- `GET /api/categories` - List categories (requires Graph token)
- `GET /api/categories/defaults` - Get default category presets
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - `{ name: string, color: string, keywords?: string, linkFolder?: boolean }` (Graph token required if `linkFolder=true`)
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id?hard=<boolean>` - Delete category
- `POST /api/categories/predict` - `{ content: string }` - Predict category from content
- `POST /api/categories/sync-from-outlook` - Sync categories from Outlook folders (requires Graph token)

### Subscriptions (Email Monitoring)
- `GET /api/subscriptions` - List user's subscriptions
- `POST /api/subscriptions` - Create subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `GET /api/subscriptions/status` - Get subscription status

### Change Feed (Real-time Updates)
- `GET /api/changes?timeoutMs=<number>&version=<number>` - Poll for changes (long polling)
  - Returns: `{ success: boolean, version: number, items: ChangeItem[] }`
  - Change types: `email:moved`, `email:bulk-moved`

### Reports
- `GET /api/reports/category-usage` - Category usage statistics

**Important Notes:**
- All endpoints return JSON with `{ success: boolean, data: T }` structure
- Endpoints marked "requires Graph token" need `x-graph-token` header
- Email list endpoint supports HTTP 304 (Not Modified) with ETag caching
- Change feed uses long polling with version-based incremental updates

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx              # Home dashboard with stats
│   ├── CategoryManager.tsx         # Category CRUD management
│   ├── EmailList.tsx               # Paginated email list with search
│   ├── EmailDetail.tsx             # Single email view with content constraints
│   ├── EmailProcessor.tsx          # Batch operations UI
│   ├── HeaderBar.tsx               # App header with auth/health
│   ├── SignInGate.tsx              # Auth gate component
│   ├── SubscriptionStatus.tsx      # Email monitoring subscription management
│   ├── CategoryUpdates.tsx         # Real-time category updates display
│   ├── ReportingDashboard.tsx      # Analytics and reports
│   ├── Settings.tsx                # User settings
│   ├── AdminPresets.tsx            # Admin category presets
│   ├── RecentlyCategorized.tsx    # Recently categorized emails
│   ├── Toaster.tsx                 # App-wide notifications
│   └── LoadingSkeleton.tsx         # Loading states
├── hooks/
│   ├── useCategories.ts            # Category CRUD, Outlook sync
│   ├── useEmails.ts                # Email list and local state
│   ├── useSettings.ts              # User settings store
│   ├── useOffice.ts                # Office.js integration with dev fallbacks
│   ├── useSubscriptions.ts         # Subscription management
│   └── index.ts                    # Hook exports
├── services/
│   ├── emailService.ts             # Email operations API
│   ├── categoryService.ts          # Category management API
│   ├── subscriptionService.ts      # Subscription API
│   ├── changeService.ts            # Change feed polling service
│   ├── reportsService.ts           # Reports API
│   ├── healthService.ts            # Health check API
│   └── adminService.ts             # Admin operations API
├── lib/
│   ├── http.ts                     # Axios instance + auth interceptors
│   ├── outlookAuth.ts              # Auth popup/SSO + token handling
│   ├── mappers.ts                  # Backend → UI model mapping
│   ├── backoff.ts                  # Exponential backoff utility
│   ├── notify.ts                   # Notification bus
│   └── idConversion.ts             # EWS → Graph ID conversion
├── stores/
│   ├── auth.ts                     # Session-scoped auth store
│   └── recentlyCategorized.ts     # Recently categorized email tracking
├── config/
│   └── env.ts                      # Environment variable resolution
├── types/                           # TypeScript type definitions
└── App.tsx                         # Main app component with routing
```

## Email Monitoring & Subscriptions

### Architecture

The app uses a **frontend-only integration** with the backend's webhook system:

1. **Frontend**: User clicks "Start Email Monitoring"
2. **Backend**: Creates Microsoft Graph subscription and webhook endpoint
3. **Microsoft Graph**: Sends webhook notifications for new emails
4. **Backend**: Processes emails with AI categorization automatically
5. **Frontend**: Polls `/api/changes` endpoint every 30 seconds to display results

### Key Points

- ✅ **NO webhook processing in frontend** - Backend handles all Microsoft Graph integration
- ✅ **NO email processing logic** - Backend handles AI categorization
- ✅ **Frontend only consumes APIs** - Displays data via REST endpoints
- ✅ **Polling-based updates** - Change feed polling (no real-time webhook processing needed)

### Components

- **`SubscriptionStatus`**: Shows monitoring status, allows starting/stopping subscriptions
- **`CategoryUpdates`**: Displays real-time category updates with 30-second polling
- **`useSubscriptions`**: Custom hook for subscription management
- **`subscriptionService`**: API client for subscription endpoints
- **`changeService`**: Polling service for change feed with exponential backoff

## UI/UX Features

### Responsive Design
- Optimized for Outlook add-in's narrow width (~320-400px)
- Content constraints prevent horizontal overflow
- Responsive tables and layouts
- Mobile-friendly breakpoints

### Email Content Constraints
- All email content (HTML, images, tables) constrained to container width
- Images scale responsively
- Tables use fixed layout with word wrapping
- Long URLs and text break properly
- No horizontal scrolling

### Styling
- Modern Fluent UI v9 design system
- Consistent spacing and typography
- Gradient buttons and subtle shadows
- Smooth transitions and hover effects
- Accessible color contrast

## Development Notes

### HTTPS Requirements
- Outlook add-ins **require HTTPS** in production
- Development uses `office-addin-dev-certs` for local SSL certificates
- Certificates auto-install on first run (`npm run install:certs`)
- Backend can run on HTTP (proxy handles HTTPS→HTTP conversion)

### Office.js Simulation
- `public/function-file.html` exposes `window.OLXCatAI.*` helpers
- In development, these are mocked if Office.js is unavailable
- Enables browser-only testing without Outlook
- Header badge shows "Standalone Mode" when Office.js unavailable

### TypeScript
- Strict mode enabled (`strict: true` in `tsconfig.json`)
- Comprehensive type definitions
- No `any` types (except where absolutely necessary)

### CORS & Proxy
- Development proxy avoids CORS issues
- `DANGEROUSLY_DISABLE_HOST_CHECK=true` for proxy compatibility
- Backend should allow CORS from `https://localhost:3001` for direct access

## Scripts

- `npm start` - Start HTTPS dev server on port 3001
- `npm run build` - Production build
- `npm test` - CRA test runner
- `npm run install:certs` - Generate/install SSL certificates

## Security & Permissions

### Outlook Manifest
- Requests `ReadWriteMailbox` permission
- All URLs must be HTTPS in production
- Update `public/manifest.xml` before publishing

### Authentication
- JWT tokens stored in `sessionStorage`
- Graph tokens stored in `sessionStorage`
- Tokens cleared on logout
- Automatic token refresh via Office SSO when available

### Content Security
- HTML emails sanitized with DOMPurify
- XSS protection via content constraints
- No inline script execution in email content

## Troubleshooting

### SSL Certificate Issues
- Run `npm run install:certs` to regenerate certificates
- Ensure certificates are in `%USERPROFILE%\.office-addin-dev-certs\`
- Accept browser certificate warnings for localhost

### CORS Errors
- Ensure backend allows `https://localhost:3001` origin
- Check proxy configuration in `package.json`
- Verify `DANGEROUSLY_DISABLE_HOST_CHECK=true` is set

### Auth Issues
- Check backend is running on port 3002
- Verify `REACT_APP_APP_ORIGIN` is set correctly
- Ensure backend redirects to HTTPS (not HTTP)

### Email Content Overflow
- Content constraints are applied via CSS and inline styles
- Check browser console for any style conflicts
- Verify `email-body-content` class is applied

## Deployment

See `DEPLOYMENT.md` for comprehensive deployment guidance including:
- Production build configuration
- SSL certificate setup
- Outlook manifest configuration
- Environment variable setup
- Office 365 deployment methods

## License

No license file is present. If you intend to open-source this project, add a `LICENSE` file and update this section.

## Support

- File issues or reach out to maintainers for help
- Check `DEPLOYMENT.md` for deployment guidance
- Review backend API documentation for endpoint details

---

**Transform email management with intelligent categorization and a polished Outlook experience.**
