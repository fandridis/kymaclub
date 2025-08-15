# Auth Store Hooks

This directory contains the authentication state management for the business app. We provide three different hooks for accessing user data, each optimized for different use cases.

## The Problem

In our app, users can exist in three states:
1. **Loading** (`undefined`) - We're still fetching user data
2. **Not authenticated** (`null`) - No user is signed in  
3. **Authenticated** (`User`) - User is signed in, but may or may not have business context

The database schema correctly reflects this reality - `businessId` is optional, and `business` can be `null`. However, in 99% of routes (except onboarding/sign-in), we know the user will have business context.

## The Solution

We provide three type-safe hooks that eliminate unnecessary optional chaining:

### `useAuth()` 
**Use in:** Root components, layouts, auth guards
```tsx
const { user } = useAuth();
// user: User | null | undefined

if (user === undefined) return <Loading />;
if (user === null) return <SignIn />;
// user is guaranteed to exist here
```

### `useAuthenticatedUser()`
**Use in:** Onboarding, profile setup, routes where user exists but business might not
```tsx
const user = useAuthenticatedUser(); 
// user: AuthenticatedUser (never null/undefined)

return <div>Welcome {user.email}!</div>; // No optional chaining needed
// But business might still be null: {user.business?.name}
```

### `useCurrentUser()` 
**Use in:** Dashboard, business settings, class management - most business routes
```tsx
const user = useCurrentUser(); 
// user: UserWithBusiness (business guaranteed to exist)

return <div>Company: {user.business.name}</div>; // No optional chaining needed!
```

## Migration Guide

### Before:
```tsx
import { useAuthStore } from '@/components/stores/auth';

function Dashboard() {
    const { user } = useAuthStore();
    
    return (
        <div>
            <h1>Welcome to {user?.business?.name}</h1>
            <p>Your role: {user?.businessRole}</p>
            <p>Business email: {user?.business?.email}</p>
        </div>
    );
}
```

### After:
```tsx
import { useCurrentUser } from '@/components/stores/auth';

function Dashboard() {
    const user = useCurrentUser();
    
    return (
        <div>
            <h1>Welcome to {user.business.name}</h1>
            <p>Your role: {user.businessRole}</p>
            <p>Business email: {user.business.email}</p>
        </div>
    );
}
```

## Error Handling

The hooks will throw descriptive errors if used in the wrong context:

- `useAuthenticatedUser()` → Throws if user is not authenticated
- `useBusinessUser()` → Throws if user doesn't have business context

These errors help catch routing issues early in development.

## When to Use Which Hook

| Hook | Loading State | Auth Required | Business Required | Use Cases |
|------|---------------|---------------|-------------------|-----------|
| `useAuth()` | ✅ Handles | ❌ No | ❌ No | Root components, auth guards |
| `useAuthenticatedUser()` | ❌ Throws | ✅ Yes | ❌ No | Onboarding, profile setup |
| `useBusinessUser()` | ❌ Throws | ✅ Yes | ✅ Yes | Dashboard, business features |
