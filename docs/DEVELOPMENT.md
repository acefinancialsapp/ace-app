# Development Document

Engineering standards and workflow guidance for contributors to the
**Ace Financials** mobile app.

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder & Module Structure](#2-folder--module-structure)
3. [Coding Standards & Best Practices](#3-coding-standards--best-practices)
4. [Development Workflow](#4-development-workflow)
5. [Branching Strategy](#5-branching-strategy)
6. [Git Conventions](#6-git-conventions)
7. [Dependency Management](#7-dependency-management)
8. [State Management Approach](#8-state-management-approach)
9. [API Integration Standards](#9-api-integration-standards)
10. [Error Handling Standards](#10-error-handling-standards)
11. [Performance Optimization Guidelines](#11-performance-optimization-guidelines)
12. [Testing Strategy](#12-testing-strategy)
13. [Debugging Guidelines](#13-debugging-guidelines)
14. [Modern React Native / Expo Best Practices](#14-modern-react-native--expo-best-practices)
15. [Reusable Component Guidelines](#15-reusable-component-guidelines)
16. [Security Best Practices](#16-security-best-practices)

---

## 1. Project Overview

**Ace Financials** is a corporate-finance approval-workflow mobile app for
managers/approvers across modules: **Accounts Receivable (AR)**, **Accounts
Payable (AP)**, **Materials Management (MM)**, **General Ledger (GL)**,
**Payroll & HR (HR)**, **Balance Sheet (BR)**, and **Admin (AM)**.

Core capabilities:

- Tenant-aware login (user enters company API URL + credentials).
- Module-based menu / approval list / approval detail screens.
- View attachments (download, share, open via native intents).
- View Journal Voucher (JV) details and approval logs.
- Approve / reject documents in bulk or individually.

## 2. Folder & Module Structure

```
acefinancialsapp/
├─ app/                       # Expo Router file-based routes
│  ├─ _layout.tsx             # Root layout (fonts, theming, providers)
│  └─ (tabs)/                 # Route group "(tabs)"
│     ├─ _layout.tsx          # Tabs container
│     ├─ index.tsx            # Entry / splash router
│     ├─ login.tsx            # Login screen
│     ├─ menu.tsx             # Module landing menu
│     ├─ list.tsx             # Approval list
│     └─ detail.tsx           # Approval detail
├─ assets/                    # Static fonts & images
├─ components/                # Reusable UI components
│  ├─ ThemedText.tsx
│  ├─ ThemedView.tsx
│  ├─ ParallaxScrollView.tsx
│  ├─ HapticTab.tsx
│  └─ ui/                     # Platform-specific UI primitives
├─ constants/
│  ├─ Colors.ts               # Theme palette
│  ├─ aceConstants.ts         # Domain enums (modules)
│  └─ endpoint.ts             # API endpoint catalogue
├─ hooks/                     # Custom hooks (theme, color scheme)
├─ services/
│  ├─ app.services.tsx        # `useHttp` axios wrapper
│  └─ common.services.tsx     # Token & comUrl secure-store helpers
├─ scripts/                   # One-off automation (e.g. reset-project)
├─ app.json                   # Expo config
├─ eas.json                   # EAS build profiles
├─ tsconfig.json              # TS compiler options (paths: `@/*`)
└─ package.json
```

### Path aliases

`tsconfig.json` defines `@/*` → repo root. Always import via the alias:

```ts
import { Colors } from '@/constants/Colors';
import { useHttp } from '@/services/app.services';
```

## 3. Coding Standards & Best Practices

- **Language**: TypeScript with `strict` mode. No `any` unless justified.
- **Linting**: `npm run lint` (`expo lint`, extends `eslint-config-expo`).
- **Formatting**: Prettier defaults (2-space indent, single quotes, trailing commas).
- **Naming**:
  - Components & types: `PascalCase`
  - Hooks: `useCamelCase`
  - Constants: `UPPER_SNAKE` (or grouped objects like `aceConstants`)
  - Files: match the default export (`MyScreen.tsx`)
- **One responsibility per file.** Split large screens into smaller components.
- **Pure functions** for utilities; **hooks** for stateful/effectful logic.
- **Always type props.** Avoid implicit `any`.

## 4. Development Workflow

```text
issue → feature branch → code + tests → lint + typecheck → PR → review → squash-merge
```

Standard local loop:

```bash
git checkout -b feature/ACE-123-add-bulk-approve
npm install                # only if package.json changed
npm start                  # opens Metro / Expo dev tools
# press a / i / w to launch on Android / iOS / Web
```

Before opening a PR:

```bash
npx tsc --noEmit
npm run lint
```

## 5. Branching Strategy

Recommended **GitHub Flow + release branches**:

| Branch | Purpose |
|--------|---------|
| `main` | Always deployable. Tagged for production releases. |
| `develop` *(optional)* | Integration branch for next release. |
| `feature/<TICKET>-<slug>` | New features. Branch from `develop` (or `main`). |
| `bugfix/<TICKET>-<slug>` | Non-urgent fixes. |
| `hotfix/<TICKET>-<slug>` | Urgent production fix. Branch from `main`, PR back into both. |
| `release/x.y.z` | Stabilisation prior to store submission. |

## 6. Git Conventions

Use **Conventional Commits**:

```
<type>(<scope>): <subject>

[optional body]
[optional footer(s)]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`.

Examples:

```
feat(approvals): add bulk approve action on list screen
fix(login): clear stored token on tenant URL change
chore(deps): bump expo to 54.0.13
```

Tagging releases: `vMAJOR.MINOR.PATCH` (e.g. `v1.2.0`).

## 7. Dependency Management

- Use **`npm install <pkg>`** for runtime; **`npm install -D <pkg>`** for dev.
- For Expo SDK packages, prefer **`npx expo install <pkg>`** — it pins the
  version compatible with the current Expo SDK.
- Audit regularly: `npm audit` and `npx expo-doctor`.
- Lockfile (`package-lock.json`) is committed and authoritative.
- Keep major upgrades isolated to dedicated PRs.

## 8. State Management Approach

The app currently uses **local component state** (`useState` / `useReducer`) and
**custom hooks** (`useHttp`). There is no global store yet.

Guidance:

- Prefer **server state** via the `useHttp` hook + react-query-style caching
  (consider adopting **`@tanstack/react-query`** if data refetch/caching grows).
- For cross-screen ephemeral state (auth user, current company), introduce a
  **React Context provider** rather than prop drilling.
- For complex client state, prefer **Zustand** over Redux for low-boilerplate.

## 9. API Integration Standards

All HTTP must go through `useHttp` so that auth headers, error mapping, and
future telemetry remain centralised.

```ts
const { sendRequest, data, error, loading } = useHttp<ApprovalListDTO>();

useEffect(() => {
  const url = `${compUrl}/api/${endpointConstants.GETAPPROVAL}/all/${userId}/${aceConstants.MODULES.RECEIVABLES}`;
  sendRequest(url, { method: 'GET' });
}, []);
```

Rules:

1. **Never hard-code URLs** — always build from `endpointConstants` + `compUrl`.
2. **Never call `axios` directly** in screens — use `useHttp`.
3. **Type the response** generically: `useHttp<MyDTO>()`.
4. **Handle `loading` and `error`** in every consumer.
5. **Do not log tokens** or full request bodies in production.

## 10. Error Handling Standards

Layers of error handling:

1. **Transport** — `useHttp` already catches axios errors and exposes a
   user-safe `error` string.
2. **Screen** — show a non-blocking message (Snackbar / Banner). Do not crash.
3. **Boundary** — wrap the root in an **ErrorBoundary** to catch render errors.

Recommended root-level boundary:

```tsx
// components/ErrorBoundary.tsx
import React from 'react';
import { Text, View } from 'react-native';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Sentry.Native.captureException(error, { extra: info });
  }
  render() {
    if (this.state.error) {
      return <View><Text>Something went wrong. Please restart the app.</Text></View>;
    }
    return this.props.children;
  }
}
```

User-facing message rules:

- Map known HTTP statuses (`401`, `403`, `404`, `5xx`) to friendly copy.
- Never expose stack traces or raw API errors to end users.

## 11. Performance Optimization Guidelines

- Use **`FlatList`** / `SectionList` (not `.map()` inside `ScrollView`) for
  long approval lists. Provide `keyExtractor`, `getItemLayout`, and
  `initialNumToRender`.
- **Memoize** expensive renders: `React.memo`, `useMemo`, `useCallback`.
- Use the **Hermes** engine (default in RN 0.81) — keep it on.
- **New Architecture (Fabric/TurboModules)** is enabled — avoid legacy bridge
  modules; prefer Expo SDK or RN core APIs.
- Replace generic `<Image>` with **`expo-image`** (already a dep) for caching.
- Defer heavy work with `InteractionManager.runAfterInteractions`.
- Use `react-native-reanimated` (worklets) for animations — never animate via
  `setState` on every frame.
- Avoid anonymous inline objects/functions in tight render paths.

## 12. Testing Strategy

The project does not yet ship tests. Recommended pyramid:

| Layer | Tooling | Scope |
|-------|---------|-------|
| **Unit** | Jest + `jest-expo` preset | Pure functions, hooks, reducers |
| **Component** | `@testing-library/react-native` | Component rendering & interactions |
| **Integration** | `msw` (mock service worker) + RTL | Screen + API contract |
| **E2E** | **Maestro** *(recommended)* or Detox | Real device flows: login → approve |

Suggested setup:

```bash
npm install -D jest jest-expo @testing-library/react-native @testing-library/jest-native
```

`package.json`:

```jsonc
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
},
"jest": { "preset": "jest-expo" }
```

Coverage target: **80% lines / 70% branches** for `services/`, `hooks/`, and `components/`.

## 13. Debugging Guidelines

- **Metro logs**: visible in the terminal running `npm start`.
- **In-app dev menu**: shake device or press `m` in Metro.
- **React DevTools**: `npx react-devtools` then reload the app.
- **Network**: enable axios interceptor logging in dev only:
  ```ts
  if (__DEV__) {
    axios.interceptors.request.use(c => { console.log('→', c.method, c.url); return c; });
  }
  ```
- **Native logs**:
  - Android: `adb logcat *:S ReactNative:V ReactNativeJS:V`
  - iOS: Xcode → Window → Devices and Simulators → View Device Logs
- **Hermes profiling**: enable from dev menu → "Start Profiling".

## 14. Modern React Native / Expo Best Practices

> *(Equivalent of the requested "Angular latest best practices" section,
> adapted to this project's actual stack.)*

- **Functional components + hooks only.** Class components are discouraged
  except for Error Boundaries.
- **Expo Router (file-based)** with **typed routes** (`experiments.typedRoutes:
  true`) — use `<Link href="/menu">`, `router.push('/list')`, etc.
- **Server Components / Suspense** are not yet standard in RN; prefer
  `react-query` for declarative data fetching when adopted.
- **New Architecture (Fabric + TurboModules + Hermes)** is on — avoid legacy
  modules and Bridge-based libraries.
- Prefer **Expo SDK modules** over community modules when both exist
  (e.g. `expo-image` over `react-native-fast-image`).
- Use **EAS Update** for OTA JS-only patches (no store re-submission).
- Enable **TypeScript `strict`** and `noUncheckedIndexedAccess`.
- Use **ESM-style** imports; avoid `require()` outside asset loading.
- Compose styles with **`StyleSheet.create`**; avoid creating style objects in
  render.

## 15. Reusable Component Guidelines

- Place shared UI in `components/`; place domain-screen-only components in the
  same folder as the screen.
- Components must be **presentational** by default — accept data via props,
  emit events via callback props.
- Theme via **`useColorScheme()` + `Colors.ts`** — never hard-code colors.
- Keep public props stable; add new ones as optional with sensible defaults.
- Document non-obvious props with JSDoc comments.
- Provide an **accessibility label** (`accessibilityLabel`) for any touchable.
- Prefer composition over configuration: small components > one big monolith
  with 20 props.

Template:

```tsx
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export interface ApprovalCardProps {
  title: string;
  amount: number;
  onPress?: () => void;
}

export function ApprovalCard({ title, amount, onPress }: ApprovalCardProps) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      <ThemedText>{amount.toLocaleString()}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 8, marginVertical: 6 },
});
```

## 16. Security Best Practices

- **Secrets in `expo-secure-store`** only — never `AsyncStorage`, never plain files.
- **HTTPS only** — reject `http://` URLs at the login screen if possible.
- **No tokens in logs.** Strip `Authorization` headers before logging.
- **Pin transport** (optional, advanced): use `react-native-ssl-pinning` for
  high-risk environments.
- **Validate user-supplied API URL**: must be a well-formed `https://` origin.
- **Update dependencies**: `npm audit` weekly; `npx expo-doctor` before each release.
- **OWASP Mobile Top 10** awareness — particularly:
  - M1 Improper Credential Usage → enforce token expiry and re-login.
  - M4 Insufficient Input/Output Validation → sanitize all server data
    before rendering inside `WebView`.
  - M9 Insecure Data Storage → audit anything written to disk.
- **WebView**: set `originWhitelist`, disable `javaScriptEnabled` unless required,
  never inject untrusted HTML.
- **Code obfuscation**: enable Hermes + ProGuard/R8 for production Android;
  enable bitcode/strip-symbols for iOS production builds.
