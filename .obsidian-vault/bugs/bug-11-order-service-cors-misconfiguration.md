# Bug-11: Order Service CORS Misconfiguration — Potential Crash on Missing Env

> **Status:** Open
> **Service(s):** order-service, user-service, product-service, inventory-service, payment-service
> **Priority:** High
> **Reported:** 2026-06-19

## Summary

Multiple services call `env.ALLOWED_ORIGINS.split(',')` without any fallback. If `ALLOWED_ORIGINS` is missing or empty, `undefined.split(',')` or `''.split(',')` behaves unexpectedly. While `''.split(',')` returns `['']`, it is risky and inconsistent with the auth-service's (broken) fallback behavior.

## Files Affected

- `services/order-service/index.js`
- `services/user-service/index.js`
- `services/product-service/index.js`
- `services/inventory-service/index.js`
- `services/payment-service/index.js`
- Their respective `src/config/env.js` files

## Current Behavior (What's Happening)

These services rely on `envalid` to provide `ALLOWED_ORIGINS` with a default of `'http://localhost:3000'`, which works when `envalid` is loaded. However, if the env config is bypassed, misconfigured, or the default is removed, `env.ALLOWED_ORIGINS.split(',')` will:
- Return `['']` if empty string (truthy, breaks CORS)
- Throw `TypeError` if `undefined`

This creates inconsistent CORS handling across services compared to auth-service, and introduces a potential crash path.

## Expected Behavior (What Should Happen)

All services should handle `ALLOWED_ORIGINS` consistently with safe defaults, filtering, and never crashing on missing values.

## Root Cause (Hypothesis)

No unified pattern for `ALLOWED_ORIGINS` parsing; each service duplicates the `.split(',')` pattern without guards or validation.

## Evidence / Code Snippet

```js
// services/order-service/index.js lines 18-21
app.use(cors({
    origin:      env.ALLOWED_ORIGINS.split(','),
    credentials: true,
}));
```

## Expected Resolution

1. Standardize `ALLOWED_ORIGINS` handling across all services with a shared utility or consistent env defaults.
2. Ensure each service gracefully handles empty/missing values.
3. Consider using an array-based env var (e.g., `ALLOWED_ORIGINS=["http://localhost:3000"]`) if the framework supports it, or maintain the comma-separated string with robust parsing.

## Verification Steps

- [ ] Set `ALLOWED_ORIGINS=''` on each service and verify no crash and sensible CORS behavior.
- [ ] Set `ALLOWED_ORIGINS='http://localhost:3000,http://localhost:3001'` and verify both origins allowed.
- [ ] Verify preflight `OPTIONS` requests succeed with credentials.
