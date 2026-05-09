# Setup & Execution Guide

End-to-end instructions to build and run the **Ace Financials** mobile app
locally and in production.

## Table of Contents

1. [Cloning the Repository](#1-cloning-the-repository)
2. [Installing Dependencies](#2-installing-dependencies)
3. [Configuring Environment Files](#3-configuring-environment-files)
4. [Running the Application Locally](#4-running-the-application-locally)
5. [Running Backend & Frontend Services](#5-running-backend--frontend-services)
6. [Running with Docker](#6-running-with-docker)
7. [Database Migration & Seeding](#7-database-migration--seeding)
8. [Building the Application](#8-building-the-application)
9. [Running Tests](#9-running-tests)
10. [Linting & Formatting](#10-linting--formatting)
11. [Production Build Generation](#11-production-build-generation)
12. [Deployment Process](#12-deployment-process)
13. [Troubleshooting Common Issues](#13-troubleshooting-common-issues)

---

## 1. Cloning the Repository

```bash
git clone <REPO_URL> acefinancialsapp
cd acefinancialsapp
```

Verify Node and npm:

```bash
node -v   # >= 18.18
npm -v    # >= 9
```

## 2. Installing Dependencies

```bash
npm install
```

Install/upgrade global tools (one-time):

```bash
npm install -g eas-cli
# Optional: expo-cli is no longer required; use `npx expo` instead.
```

Sanity-check the project with Expo Doctor:

```bash
npx expo-doctor
```

## 3. Configuring Environment Files

This project does **not require a `.env` file** — the API base URL is provided
by the user at the **login screen** and stored securely. Therefore no
configuration step is needed before first run.

If you have introduced build-time variables (recommended pattern), create a
`.env` file (do **not** commit) and an `app.config.ts` to surface them via
`expo-constants`:

```bash
# .env
API_BASE_URL=https://stg-api.acefinancials.com
SENTRY_DSN=
```

```ts
// app.config.ts
import 'dotenv/config';
import config from './app.json';
export default {
  ...config,
  expo: {
    ...config.expo,
    extra: {
      ...config.expo.extra,
      apiBaseUrl: process.env.API_BASE_URL,
      sentryDsn: process.env.SENTRY_DSN,
    },
  },
};
```

## 4. Running the Application Locally

Start the Metro bundler and Expo dev tools:

```bash
npm start
```

In the interactive terminal:

| Key | Action |
|-----|--------|
| `a` | Open on Android emulator / connected device |
| `i` | Open on iOS simulator (macOS only) |
| `w` | Open in a web browser |
| `r` | Reload the app |
| `m` | Open the in-app dev menu |
| `j` | Open the JS debugger |

Direct platform commands:

```bash
npm run android   # builds + launches on Android
npm run ios       # macOS only
npm run web       # opens at http://localhost:8081
```

### First-time login

1. Launch the app.
2. Enter the **Company API URL** (e.g. `https://api.acefinancials.com`).
3. Enter **Company ID**, **Username**, **Password**.
4. On success the bearer token is written to secure storage; subsequent
   requests use it automatically.

## 5. Running Backend & Frontend Services

This repository contains **only the mobile client**. The backend
(ACE Financials REST API) is owned and operated separately. To work locally
against a backend you control:

1. Stand up the backend on `https://localhost:5001` (or any HTTPS host).
2. Ensure the device/emulator can reach the host:
   - Android emulator → use `https://10.0.2.2:<port>`.
   - Physical device → use the LAN IP of your dev machine.
3. Enter that URL in the app login screen as the Company URL.

> The mobile app rejects untrusted self-signed certificates by default. For
> local development you may need to install a dev root CA on the device, or
> use a tunneling service like ngrok with a real cert.

## 6. Running with Docker

The mobile app itself **cannot be run inside Docker** (it requires Android
SDK / Xcode). However, you can containerize:

- The **backend** (out of scope here).
- A **CI build agent** that runs `eas build --local` on Linux for Android.

Example Dockerfile for an Android EAS local build agent:

```dockerfile
FROM reactnativecommunity/react-native-android:latest
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm install -g eas-cli
CMD ["eas", "build", "--local", "--platform", "android", "--profile", "preview", "--non-interactive"]
```

## 7. Database Migration & Seeding

Not applicable — the mobile client has **no database**. All persistence is
performed by the backend.

For the secure-store keys used by the app (`authToken`, `comUrl`) — these are
created automatically on first login.

To **reset** local secure-store state during development, uninstall and
reinstall the app on the device/emulator, or call:

```ts
import * as secureStore from 'expo-secure-store';
await secureStore.deleteItemAsync('authToken');
await secureStore.deleteItemAsync('comUrl');
```

## 8. Building the Application

Cloud builds via EAS (recommended):

```bash
eas login                                  # one-time
eas build --platform android --profile development
eas build --platform ios     --profile development
eas build --platform all     --profile preview
```

Local builds (advanced):

```bash
npx expo prebuild                          # generates ios/ + android/
npx expo run:android                       # builds & installs APK
npx expo run:ios                           # macOS only
```

> Once you `prebuild`, the `ios/` and `android/` folders become source. Either
> commit them (bare workflow) or keep them gitignored and regenerate from
> Expo config (managed/CNG workflow).

## 9. Running Tests

The repo does not yet ship tests. After adopting the recommended setup
(see [DEVELOPMENT.md §12](./DEVELOPMENT.md#12-testing-strategy)):

```bash
npm test                  # one-shot
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
```

End-to-end with Maestro (recommended):

```bash
brew install maestro      # macOS / linuxbrew
maestro test e2e/login.flow.yaml
```

## 10. Linting & Formatting

```bash
npm run lint              # expo lint (ESLint)
npx tsc --noEmit          # TypeScript type-check
```

Recommended additions:

```bash
npx prettier --write .
```

`package.json` (recommended):

```jsonc
"scripts": {
  "lint": "expo lint",
  "lint:fix": "expo lint --fix",
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit"
}
```

Pre-commit hook (recommended):

```bash
npm install -D husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

```jsonc
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

## 11. Production Build Generation

```bash
# Increment versions are handled by EAS (autoIncrement: true on production).
eas build --platform android --profile production
eas build --platform ios     --profile production
```

Outputs (downloadable artifacts in the EAS dashboard or via CLI):

- Android: `.aab` (Google Play) and/or `.apk`
- iOS: `.ipa` (App Store / TestFlight)

For OTA-only JS updates (no store re-submission):

```bash
eas update --branch production --message "fix: list paging"
```

## 12. Deployment Process

### Internal QA (preview)

```bash
eas build --profile preview --platform all
# Distribute via the EAS share link (internal distribution).
```

### Production

```bash
# 1. Tag the release in git
git tag v1.2.0 && git push origin v1.2.0

# 2. Build
eas build --profile production --platform all

# 3. Submit to stores
eas submit --platform android --latest
eas submit --platform ios     --latest
```

Required one-time setup:

- **Apple**: App Store Connect app record, valid Apple Developer account,
  `eas credentials` configured.
- **Google**: Google Play Console app + service account JSON for `eas submit`.

## 13. Troubleshooting Common Issues

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `npx install` returned non-zero | Wrong command — `npx install` doesn't exist | Use `npm install` |
| Metro stuck / stale cache | Old transform cache | `npm start -- --clear` or `npx expo start -c` |
| `Unable to resolve module @/...` | Path alias not picked up | Verify `tsconfig.json` `paths`, restart Metro |
| Android build fails: `JAVA_HOME` not set | Missing JDK 17 | Install JDK 17 and set `JAVA_HOME` |
| Android emulator can't reach host API | Wrong host | Use `10.0.2.2` instead of `localhost` |
| iOS pod install fails | Outdated CocoaPods | `sudo gem install cocoapods` then `cd ios && pod install` |
| `401 Unauthorized` on every request | Stale token | Logout, re-login, or delete `authToken` from secure store |
| `Network request failed` | HTTPS cert untrusted on device | Install dev root CA or use ngrok |
| White screen on launch | Font load failed | Check `useFonts` in [app/_layout.tsx](../app/_layout.tsx) |
| `expo-doctor` warns about mismatched versions | Dep installed with `npm` instead of `npx expo install` | `npx expo install <pkg>` to align with SDK |
| Hermes crash on Android | Native lib mismatch after upgrade | `cd android && ./gradlew clean`, then rebuild |
| EAS build queue slow | Free-tier capacity | Use `--local` flag or upgrade EAS plan |
| `New Architecture` runtime errors | Library not Fabric-ready | Check the lib's RN-NA support; replace or pin |
