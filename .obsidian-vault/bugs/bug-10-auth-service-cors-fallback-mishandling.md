# Bug-10: Auth Service Allowed Origins Fallback Mishandling

> **Status:** Open
> **Service(s):** auth-service
> **Priority:** Medium
> **Reported:** 2026-06-19

## Summary

The CORS configuration in `auth-service/index.js` uses `process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000'`. Because `String.prototype.split()` always returns an array (even for empty strings), the fallback is never used when `ALLOWED_ORIGINS` is set but empty or malformed.

## Files Affected

- `services/auth-service/index.js`
- `services/auth-service/src/config/env.js`

## Current Behavior (What's Happening)

When `process.env.ALLOWED_ORIGINS` is an empty string `''`, `.split(',')` returns `['']` (array with one empty string). The `||` fallback doesn't trigger because `['']` is truthy. This causes CORS to allow only the empty-string origin, effectively blocking legitimate origins.

## Expected Behavior (What Should Happen)

CORS origin should correctly fall back to a safe default when `ALLOWED_ORIGINS` is missing, empty, or malformed.

## Root Cause (Hypothesis)

JavaScript truthiness: an array with one empty string `['']` is truthy, so the `||` fallback is skipped.

## Evidence / Code Snippet

```js
// services/auth-service/index.js lines 16-19
app.use(cors({
    origin:      process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true, // required for cookies to work cross-origin
}));
```

## Expected Resolution

1. Update the CORS config to properly validate the origin array:
   - If `ALLOWED_ORIGINS` is missing/empty, use the fallback.
   - Filter out empty strings from the split result.
2. Alternatively, use the same pattern as other services (`env.ALLOWED_ORIGINS.split(',')`) and ensure `env.js` provides a safe default via `envalid`.

Example fix:
```js
const origins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').filter(Boolean)
  : ['http://localhost:3000'];
app.use(cors({ origin: origins, credentials: true }));
```

## Verification Steps

- [ ] Set `ALLOWED_ORIGINS=''` and verify CORS blocks appropriately or falls back correctly.
- [ ] Set `ALLOWED_ORIGINS='http://localhost:3000,http://localhost:3001'` and verify both origins are allowed.
- [ ] Unset `ALLOWED_ORIGINS` and verify fallback to `http://localhost:3000`.
