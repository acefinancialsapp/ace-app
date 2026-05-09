# Architecture Document

System and application architecture for the **Ace Financials** mobile app.

## Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Application Architecture Diagram](#2-application-architecture-diagram)
3. [Module-Level Architecture](#3-module-level-architecture)
4. [Component Interaction Flow](#4-component-interaction-flow)
5. [Data Flow Diagrams](#5-data-flow-diagrams)
6. [Authentication & Authorization Flow](#6-authentication--authorization-flow)
7. [API Communication Architecture](#7-api-communication-architecture)
8. [Database Architecture](#8-database-architecture)
9. [Scalability & Performance Considerations](#9-scalability--performance-considerations)
10. [Caching Strategy](#10-caching-strategy)
11. [Error Handling Architecture](#11-error-handling-architecture)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Security Architecture](#13-security-architecture)
14. [Modular Architecture Approach](#14-modular-architecture-approach)

---

## 1. High-Level System Architecture

```text
┌──────────────────────────┐         HTTPS / JSON         ┌────────────────────────────┐
│  Ace Financials Mobile   │  ─────────────────────────►  │ ACE Financials REST API    │
│  (React Native + Expo)   │  ◄─────────────────────────  │ (tenant-specific base URL) │
│  iOS · Android · Web     │       Bearer JWT             └────────────────────────────┘
└──────────────────────────┘                                          │
        │                                                              │
        │ secure storage                                               ▼
        ▼                                                  ┌────────────────────┐
┌────────────────────┐                                     │  ACE Backend DB    │
│ expo-secure-store  │                                     │  (server-managed)  │
│ (Keychain/Keystore)│                                     └────────────────────┘
└────────────────────┘
```

The mobile client is a **thin presentation tier**. All business logic and
persistence live in the **ACE backend**. The mobile app is **multi-tenant by
configuration**: the user supplies the tenant API URL at login.

## 2. Application Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  React Native App (Hermes JS Engine, New Architecture / Fabric)         │
│                                                                         │
│  ┌──────────── Presentation (app/) ─────────────────────────────────┐   │
│  │  Expo Router (file-based)                                        │   │
│  │  ┌─────────────┐ ┌────────┐ ┌──────┐ ┌─────┐ ┌────────┐          │   │
│  │  │  index.tsx  │ │ login  │ │ menu │ │ list │ │ detail │          │   │
│  │  └─────────────┘ └────────┘ └──────┘ └─────┘ └────────┘          │   │
│  └────────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                     │
│  ┌──────────── Reusable UI (components/) ───────────────────────────┐   │
│  │ ThemedText · ThemedView · ParallaxScrollView · HapticTab · ui/   │   │
│  └────────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                     │
│  ┌──────────── Hooks (hooks/) ─────────────────────────────────────-┐   │
│  │ useColorScheme · useThemeColor                                   │   │
│  └────────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                     │
│  ┌──────────── Services (services/) ────────────────────────────────┐   │
│  │ useHttp (axios wrapper)                                          │   │
│  │ getToken / storeToken / getCompUrl (expo-secure-store)           │   │
│  └────────────────────────────────┬─────────────────────────────────┘   │
│                                   │                                     │
│  ┌──────────── Constants (constants/) ──────────────────────────────┐   │
│  │ endpointConstants · aceConstants.MODULES · Colors                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. Module-Level Architecture

The domain is divided by ACE accounting **modules**, identified by short codes
(see [constants/aceConstants.ts](../constants/aceConstants.ts)):

| Code | Module |
|------|--------|
| `AR` | Accounts Receivable |
| `AP` | Accounts Payable |
| `MM` | Materials Management |
| `GL` | General Ledger |
| `HR` | Payroll & HR |
| `BR` | Balance Sheet |
| `AM` | Admin |

Each module reuses the same set of screens (`list`, `detail`, attachment
viewers, JV details, logs) — the module code is passed as a parameter to API
calls. This is a **routing-by-data** approach rather than separate route
hierarchies, keeping the UI DRY.

## 4. Component Interaction Flow

```text
[ Screen ]  ── uses ──►  [ useHttp hook ]  ── reads ──►  [ getToken / getCompUrl ]
    │                           │                                │
    │                           ▼                                ▼
    │                       axios HTTP                    expo-secure-store
    │                           │
    └── renders ──►  [ Themed components / Paper components ]
```

Typical screen lifecycle:

1. Screen mounts → reads `compUrl` & `userId` from secure store.
2. Builds endpoint URL from `endpointConstants` + `aceConstants`.
3. Calls `sendRequest(url, { method, body })` from `useHttp`.
4. Renders `loading` → `data` (or `error`).
5. User action (approve/reject) triggers another `sendRequest` POST.

## 5. Data Flow Diagrams

### Approval list flow

```text
┌──────────┐  GET /api/ace/GetApproval/all/{userId}/{module}  ┌─────────────┐
│  list    │ ────────────────────────────────────────────────► │  ACE API    │
│  screen  │                                                   │             │
│          │ ◄──────────────── JSON: ApprovalDTO[] ──────────  │             │
└────┬─────┘                                                   └─────────────┘
     │ render FlatList
     ▼
┌──────────┐  tap row  ┌──────────┐  GET ace/GetApprovalDetailByDoc  ┌──────┐
│  user    │ ────────► │ detail   │ ───────────────────────────────► │ API  │
└──────────┘           │ screen   │ ◄──── JSON: DetailDTO ────────── │      │
                       └──────────┘                                  └──────┘
```

### Attachment download flow

```text
detail.tsx
   │ GetAttachmentDetails ──► ACE API ──► metadata
   │ DownloadAttachmentDoc ──► ACE API ──► base64 / binary
   │
   ▼
expo-file-system  (write to cacheDirectory)
   │
   ├─► expo-sharing.shareAsync(uri)         (iOS / Android)
   └─► expo-intent-launcher.startActivity   (Android open with…)
```

## 6. Authentication & Authorization Flow

```text
 ┌─────────┐  enter Company URL + Compid + Username + Password
 │  user   │ ─────────────────────────────────────────────────┐
 └─────────┘                                                  ▼
                                                ┌────────────────────────┐
                                                │   login.tsx             │
                                                │   POST {compUrl}/api/   │
                                                │        auth/login       │
                                                └─────────────┬──────────┘
                                                              │
                                                              ▼
                                              ┌─────────────────────────┐
                                              │   ACE Auth endpoint      │
                                              │   issues bearer token    │
                                              └─────────────┬───────────┘
                                                            │ token
                                                            ▼
                                          ┌────────────────────────────────┐
                                          │ storeToken(token) →            │
                                          │ expo-secure-store              │
                                          │ (Keychain on iOS, Keystore AND.│
                                          └─────────────┬──────────────────┘
                                                        │
                                                        ▼
                                ┌────────────────────────────────────────┐
                                │ Subsequent useHttp requests attach     │
                                │ Authorization: Bearer <token>          │
                                └────────────────────────────────────────┘
```

Authorization is **server-side** — the backend authorizes per `userId` /
module. The client trusts the server response and renders accordingly.

## 7. API Communication Architecture

- **Protocol**: HTTPS, JSON request/response.
- **Client**: `axios` wrapped by `useHttp` (`services/app.services.tsx`).
- **Auth**: `Authorization: Bearer <jwt>` (skipped for `/login`).
- **Base URL**: dynamic, read from secure storage (`getCompUrl`) — multi-tenant.
- **Endpoint catalogue**: `constants/endpoint.ts`.

```text
   screen
     │ sendRequest(url, { method, body })
     ▼
   useHttp ── builds headers (Content-Type, Authorization)
     │
     ▼
   axios(config)
     │
     ▼
   Network ── ACE REST API
     │
     ▼
   useHttp returns { data | error, loading }
     │
     ▼
   screen re-renders
```

## 8. Database Architecture

- **No client-side database.** The mobile app is stateless beyond two
  secure-store keys (`authToken`, `comUrl`) and transient file-system caches
  for downloaded attachments.
- **Server database** is owned by the ACE backend (out of scope of this repo).

If offline support is later required, the recommended layered design is:

```
[ Screen ] → [ Repository ] → [ expo-sqlite cache ] ─sync─► [ ACE API ]
```

## 9. Scalability & Performance Considerations

Client-side scalability concerns:

- **List virtualization**: long approval lists must use `FlatList` with
  `getItemLayout`, `windowSize`, and pagination from the API.
- **Pagination & filtering**: prefer server-side filtering by module/date.
- **Bundle size**: enable Hermes (default), strip dev-only modules with
  `__DEV__` guards.
- **OTA updates**: ship JS-only fixes via **EAS Update** to roll out fixes in
  hours rather than days.
- **New Architecture** (Fabric, TurboModules) is enabled — improves render
  pipeline and reduces bridge crossings.

## 10. Caching Strategy

| Data | Cache | Lifetime |
|------|-------|----------|
| Auth token | `expo-secure-store` | Until logout / token rotation |
| Company URL | `expo-secure-store` | Persistent |
| Approval lists | None today (recommend `react-query`) | Per session |
| Attachments | `expo-file-system` cache directory | Until OS evicts |
| Images | `expo-image` built-in disk + memory cache | Library-managed |

Recommended future enhancement: introduce **`@tanstack/react-query`** with
`staleTime` per resource (e.g. 60 s for lists, infinite for static lookups).

## 11. Error Handling Architecture

```text
                    ┌─────────────────────────────┐
                    │   React render tree         │
                    │   (wrapped in ErrorBoundary)│
                    └─────────────┬───────────────┘
                                  │ throws
                                  ▼
                    ┌─────────────────────────────┐
                    │   ErrorBoundary             │ ──► Sentry / log
                    │   shows fallback UI         │
                    └─────────────────────────────┘

  HTTP failure path:
    axios reject ─► useHttp catches ─► state.error set ─► screen renders banner
```

Layers:

1. **Network** — handled inside `useHttp`; never crashes the app.
2. **Domain validation** — screens inspect `data` shape, show empty/error states.
3. **Render** — `ErrorBoundary` (recommended addition) prevents app-wide crash.
4. **Native** — Sentry (recommended) captures JS + native crashes.

## 12. Deployment Architecture

```text
┌──────────────┐   git push    ┌──────────────┐   eas build   ┌──────────────┐
│  Developer   │ ────────────► │  GitHub repo │ ────────────► │  EAS Cloud   │
└──────────────┘               └──────────────┘               │  (build VM)  │
                                                              └──────┬───────┘
                                                                     │ artifacts
                                  ┌──────────────────────────────────┤
                                  ▼                                  ▼
                        ┌─────────────────┐              ┌──────────────────────┐
                        │  Internal       │              │ Apple App Store      │
                        │  distribution   │              │ Google Play Store    │
                        │ (preview/QA)    │              │ (production)         │
                        └─────────────────┘              └──────────────────────┘
                                                                     │
                                                                     ▼
                                                          ┌──────────────────────┐
                                                          │  EAS Update (OTA)    │
                                                          │  for JS-only patches │
                                                          └──────────────────────┘
```

Build profiles (`eas.json`): `development`, `preview`, `production`.

## 13. Security Architecture

| Layer | Control |
|-------|---------|
| Storage | `expo-secure-store` → iOS Keychain / Android Keystore (hardware-backed where available) |
| Transport | HTTPS only, TLS 1.2+ |
| Auth | Stateless bearer JWT issued by ACE backend |
| Session | Token persisted across app launches; cleared on logout |
| Code | Hermes-compiled bytecode + R8 (Android) / strip-symbols (iOS) in production |
| Updates | EAS Update channels signed by EAS |
| Logging | No PII, no tokens — must be enforced via interceptor in production |

Threat model highlights:

- **Lost device** → secure store is bound to OS user; recommend short token TTL.
- **MITM** → enforce HTTPS, optionally pin certificates for sensitive tenants.
- **Reverse engineering** → strings (URLs, endpoints) are visible in the bundle;
  do not embed secrets.
- **Untrusted WebView content** → never enable `javaScriptEnabled` for
  arbitrary external HTML.

## 14. Modular Architecture Approach

This is a **single, monolithic mobile app** — there is no microfrontend or
dynamic module loading at runtime. Modularity is achieved by:

- **Folder boundaries** (`app/`, `components/`, `services/`, `hooks/`,
  `constants/`).
- **Domain modularity by data** — the same screens serve all ACE modules,
  parameterized by `aceConstants.MODULES.*`.
- **Path aliases** (`@/*`) decouple deep import paths from physical layout.

If the app grows substantially, recommended evolution:

1. Promote shared UI to a workspace package (`packages/ui`) using **npm
   workspaces** or **pnpm**.
2. Split each ACE module into its own `app/(modules)/<code>/` route group.
3. Adopt **EAS Update channels** per module/tenant for staged rollouts.
