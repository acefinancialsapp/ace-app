# Configuration Document

Comprehensive configuration reference for the **Ace Financials** mobile app.

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Required Software & Tools](#2-required-software--tools)
3. [System Prerequisites](#3-system-prerequisites)
4. [Environment Variables & Secrets Management](#4-environment-variables--secrets-management)
5. [API Configuration](#5-api-configuration)
6. [Database Configuration](#6-database-configuration)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Build Configurations](#8-build-configurations)
9. [Production & Staging Configurations](#9-production--staging-configurations)
10. [CI/CD Configuration](#10-cicd-configuration)
11. [Logging & Monitoring Setup](#11-logging--monitoring-setup)

---

## 1. Environment Setup

The project uses **Node.js + Expo CLI** as the local development environment and
**EAS (Expo Application Services)** for cloud builds and submissions.

```text
┌────────────────────────────────────────────┐
│  Developer Workstation                     │
│  ┌──────────────────────────────────────┐  │
│  │ Node.js  →  npm  →  Expo CLI (npx)   │  │
│  │            │                          │  │
│  │            ├── Metro Bundler          │  │
│  │            ├── Expo Dev Client        │  │
│  │            └── EAS CLI (cloud builds) │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## 2. Required Software & Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | **>= 18.18 LTS** (20.x recommended) | Runtime for Metro / Expo CLI |
| npm | **>= 9.x** (bundled with Node) | Package management |
| Git | **>= 2.40** | Source control |
| Expo CLI | Bundled (`npx expo`) | Local dev server |
| EAS CLI | **>= 16.17.0** (per `eas.json`) | Cloud builds & submissions |
| Watchman *(macOS only)* | latest | File-watcher for Metro (recommended) |
| Android Studio | Hedgehog+ | Android SDK, emulator, gradle |
| Xcode *(macOS only)* | 15+ | iOS simulator, signing |
| JDK | **17** | Android builds (gradle 8) |
| VS Code | latest | Recommended IDE |

### Recommended VS Code extensions

- ESLint
- Prettier — Code formatter
- Expo Tools
- React Native Tools
- TypeScript Next

## 3. System Prerequisites

### Windows

- Windows 10 / 11 (x64)
- Enable **Virtualization** in BIOS (for Android emulator)
- Install Android Studio + an AVD image (API 34+)
- Optionally install **Expo Go** on a physical Android device for fastest iteration

### macOS

- macOS 13+ (Ventura/Sonoma)
- Xcode 15+ with command-line tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

### Linux

- Ubuntu 22.04 LTS or equivalent (Android only — iOS builds require macOS)

## 4. Environment Variables & Secrets Management

This project does **not** currently rely on a `.env` file at runtime. The
backend base URL (`comUrl`) is provided by the user at the **login screen** and
persisted to **`expo-secure-store`** (Keychain on iOS, Keystore on Android).

### Where secrets live

| Secret | Storage | Accessor |
|--------|---------|----------|
| Auth bearer token | `expo-secure-store` (key: `authToken`) | `getToken()` in [services/common.services.tsx](../services/common.services.tsx) |
| Backend base URL | `expo-secure-store` (key: `comUrl`) | `getCompUrl()` in [services/common.services.tsx](../services/common.services.tsx) |
| EAS / Apple / Google credentials | EAS Cloud (managed by `eas credentials`) | EAS Build pipeline |

### Recommended `.env` strategy (forward-looking)

If you introduce build-time environment variables (e.g. analytics keys, feature
flags), use **`expo-constants`** with `app.config.ts` and `EAS Secret`:

```ts
// app.config.ts
import 'dotenv/config';
export default {
  expo: {
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
      sentryDsn: process.env.SENTRY_DSN,
    },
  },
};
```

Push secrets to EAS:

```bash
eas secret:create --scope project --name API_BASE_URL --value https://api.example.com
```

> **Never** commit `.env`, `google-services.json`, `GoogleService-Info.plist`,
> or `*.keystore` files. Add them to `.gitignore`.

## 5. API Configuration

API endpoints are centralised in [constants/endpoint.ts](../constants/endpoint.ts):

```ts
export const endpointConstants = {
  LOGINURL: "auth/login",
  GETAPPROVAL: "ace/GetApproval",
  GETAPPROVALDETAILBYDOC: "ace/GetApprovalDetailByDoc",
  // ... etc
};
```

Module identifiers used to scope requests are in
[constants/aceConstants.ts](../constants/aceConstants.ts):

```ts
export const aceConstants = {
  MODULES: {
    RECEIVABLES: "AR",
    PAYABLES:    "AP",
    MATERIALS:   "MM",
    GENERAL_LEDGER: "GL",
    PAYROLL_AND_HR: "HR",
    BALANCE_SHEET:  "BR",
    ADMIN:          "AM",
  },
}
```

The full request URL is composed at call-site as:

```ts
const url = `${compUrl}/api/${endpointConstants.GETAPPROVAL}/all/${userId}/${aceConstants.MODULES.RECEIVABLES}`;
```

HTTP transport is centralised in the **`useHttp`** hook — see
[services/app.services.tsx](../services/app.services.tsx). It:

- Uses **`axios`**
- Auto-attaches `Authorization: Bearer <token>` (except for `/login`)
- Sets `Content-Type: application/json`
- Returns `{ data, error, loading, sendRequest }`

## 6. Database Configuration

The app is a **client-only** React Native application — there is **no embedded
database**. Persistence is limited to:

| Data | Storage |
|------|---------|
| Auth token | `expo-secure-store` |
| Company URL | `expo-secure-store` |
| File downloads | `expo-file-system` (cache / document directory) |

All business data is read from the **remote ACE Financials REST API**.

If a local DB becomes necessary in the future, recommended options are:

- **`expo-sqlite`** for relational/offline cache
- **`@react-native-async-storage/async-storage`** for simple key/value

## 7. Third-Party Integrations

Direct runtime integrations (extracted from `package.json`):

| Library | Purpose |
|---------|---------|
| `axios` | HTTP client |
| `expo-router` | File-based navigation |
| `expo-secure-store` | Encrypted credential storage |
| `expo-file-system`, `expo-sharing` | Download & share attachments |
| `expo-intent-launcher` | Open files via OS intents (Android) |
| `expo-web-browser`, `expo-linking` | External links / deep links |
| `expo-haptics` | Haptic feedback |
| `expo-image`, `expo-blur`, `expo-symbols` | UI primitives |
| `react-native-paper` | Material Design components |
| `react-native-element-dropdown` | Dropdown control |
| `react-native-webview` | Embedded web views |
| `react-native-reanimated`, `react-native-gesture-handler` | Animations & gestures |
| `@react-navigation/*` | Navigation primitives backing `expo-router` |

Backend integration: **ACE Financials REST API** (URL supplied at login).

## 8. Build Configurations

Build profiles are defined in [eas.json](../eas.json):

```json
{
  "cli": { "version": ">= 16.17.0", "appVersionSource": "remote" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },
    "production":  { "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| `development` | Local dev with `expo-dev-client`, hot reload over LAN | Internal (ad-hoc) |
| `preview` | QA / UAT install builds (release-mode bits) | Internal |
| `production` | Store-ready builds with auto version bump | Stores |

App identity (from [app.json](../app.json)):

| Platform | Identifier |
|----------|------------|
| iOS bundle | `com.acefinancials.aceapp` |
| Android package | `com.acefinancials.aceapp` |
| Scheme (deep links) | `aceapp://` |
| New Architecture (Fabric) | **enabled** (`newArchEnabled: true`) |
| Typed routes | **enabled** |

## 9. Production & Staging Configurations

The repo currently ships only `development | preview | production`. Recommended
extension to support **staging**:

```jsonc
// eas.json (recommended)
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal",
                     "env": { "APP_ENV": "development" } },
    "staging":     { "distribution": "internal",
                     "env": { "APP_ENV": "staging",
                              "API_BASE_URL": "https://stg-api.acefinancials.com" } },
    "production":  { "autoIncrement": true,
                     "env": { "APP_ENV": "production",
                              "API_BASE_URL": "https://api.acefinancials.com" } }
  }
}
```

Use `app.config.ts` to switch icons/names per environment:

```ts
const ENV = process.env.APP_ENV ?? 'development';
export default {
  expo: {
    name: ENV === 'production' ? 'Ace' : `Ace (${ENV})`,
    // ...
  }
};
```

## 10. CI/CD Configuration

The repository does **not yet contain CI/CD pipelines**. Recommended baseline
using **GitHub Actions + EAS**:

`.github/workflows/ci.yml` (recommended):

```yaml
name: CI
on:
  pull_request:
  push: { branches: [main, develop] }

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test --if-present
```

`.github/workflows/release.yml` (recommended):

```yaml
name: Release
on:
  workflow_dispatch:
    inputs:
      profile:
        type: choice
        options: [preview, production]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --non-interactive --platform all --profile ${{ inputs.profile }}
```

Required GitHub repository secrets:

| Secret | Notes |
|--------|-------|
| `EXPO_TOKEN` | Personal access token for EAS |
| `APPLE_*`, `ASC_*` | Optional — for `eas submit` to App Store |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Optional — for `eas submit` to Play |

## 11. Logging & Monitoring Setup

Currently the app uses ad-hoc `console.log` / `console.error`. Recommended
production-grade observability:

| Concern | Recommendation |
|---------|----------------|
| Crash reporting | **Sentry** (`sentry-expo` or `@sentry/react-native`) |
| Performance | Sentry Performance / Firebase Performance |
| Network logs | Axios interceptors → redact tokens before logging |
| OTA & build telemetry | **EAS Insights** (free with EAS) |
| In-app dev logging | `expo-dev-client` log overlay |

Sample Sentry initialization (place in `app/_layout.tsx`):

```ts
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false,
  debug: __DEV__,
  tracesSampleRate: 0.2,
});
```

Recommended axios interceptor (centralised in `useHttp`):

```ts
axios.interceptors.response.use(
  r => r,
  err => {
    Sentry.Native.captureException(err, { extra: { url: err.config?.url } });
    return Promise.reject(err);
  }
);
```
