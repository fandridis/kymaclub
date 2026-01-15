# Orcavo

A monorepo for the Kymaclub platform.

## Apps

| App | Description |
|-----|-------------|
| `web-landing` | Marketing & landing pages |
| `web-business` | Business dashboard |
| `web-internal` | Internal admin tools |
| `mobile-consumer` | Consumer mobile app |

## Packages

| Package | Description |
|---------|-------------|
| `api` | Backend API (Convex) |
| `ui` | Shared UI components |
| `utils` | Shared utilities |
| `eslint-config` | ESLint configurations |
| `typescript-config` | TypeScript configurations |

## Development

```bash
# Install dependencies
pnpm install

# Run all apps
pnpm dev

# Run specific app
pnpm dev --filter=web-business
```

## Build

```bash
pnpm build
```
