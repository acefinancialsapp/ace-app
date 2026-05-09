# Ace Financials Mobile App — Documentation

Welcome to the official documentation for the **Ace Financials** mobile application
(`ace-app`), a cross-platform application built with **React Native + Expo
(TypeScript)** using the **Expo Router** file-based navigation system.

> **Note on stack:** The original documentation request mentioned *Angular*. This
> project is **not** an Angular application — it is a **React Native (Expo)**
> application. Wherever Angular-specific guidance was requested, this
> documentation provides the equivalent **React Native / Expo** modern patterns
> and best practices.

## Table of Contents

| # | Document | Purpose |
|---|----------|---------|
| 1 | [Configuration Document](./CONFIGURATION.md) | Environment setup, tools, secrets, build & CI/CD configuration |
| 2 | [Development Document](./DEVELOPMENT.md) | Coding standards, workflow, testing, security & best practices |
| 3 | [Architecture Document](./ARCHITECTURE.md) | High-level system, module, data-flow & deployment architecture |
| 4 | [Setup & Execution Guide](./SETUP_AND_EXECUTION.md) | Step-by-step instructions to clone, install, run, build & deploy |

## Quick Facts

| Item | Value |
|------|-------|
| App name | `ace` (slug), `ace-app` (npm) |
| Bundle identifier (iOS) | `com.acefinancials.aceapp` |
| Package name (Android) | `com.acefinancials.aceapp` |
| Framework | React Native `0.81.4`, React `19.1.0` |
| Expo SDK | `54.0.13` |
| Router | `expo-router` (file-based, typed routes) |
| Language | TypeScript `~5.8.3` |
| Build & release | EAS Build / EAS Submit |
| Owner | `acefinancialsapp` |
| EAS project ID | `91a60d89-d214-4fce-bce3-a557fc05cb9b` |

## Audience

These documents are written for:

- **New developers** onboarding to the codebase.
- **DevOps / release engineers** handling builds, signing & store submissions.
- **Production support teams** triaging incidents.
- **Architects & tech leads** reviewing design decisions.
