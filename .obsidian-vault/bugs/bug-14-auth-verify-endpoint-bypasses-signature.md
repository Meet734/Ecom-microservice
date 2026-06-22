# Bug-14: Auth Service /verify Endpoint Bypasses Signature and Blacklist

> **Status:** Open
> **Service(s):** auth-service
> **Priority:** Critical
> **Reported:** 2026-06-19

## Summary

The `GET /api/auth/verify` endpoint only checks that the JWT has three dot-separated segments but does NOT verify the token's signature or check if it's blacklisted. This allows tampered or revoked tokens to pass verification.

## Files Affected

- `services/auth-service/src/controllers/auth.controller.js`

## Current Behavior (What's Happening)

```js
// Lines 88-100 in auth.controller.js
const verify = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authorization required' });
        }

        const token = authHeader.split(' ')[1];
        const parts = token.split('.');

        if (parts.length !== 3) {
            return res.status(401).json({ success: false, message: 'Invalid token format' });
        }

        req.user = {
            userId: parts[1],  // <-- Uses raw base64 payload, not verified
            // ...
        };
        return res.status(200).json({ success: true, user: req.user });
    } catch (err) { ... }
};
```

The endpoint:
1. Splits the token by `.` and takes `parts[1]` (the payload) without decoding it properly.
2. Never calls `jwt.verify(token, env.JWT_ACCESS_SECRET)`.
3. Never checks `blacklist:${decoded.jti}` in Redis.

A user with a tampered token (e.g., modified role claim) would pass as "valid" because the endpoint only checks token structure.

## Expected Behavior (What Should Happen)

The verify endpoint should:
1. Verify the JWT signature using the same secret as other auth middleware.
2. Check the Redis blacklist for the token's `jti`.
3. Return the decoded, trusted user payload.

## Root Cause (Hypothesis)

The verify endpoint was likely implemented as a lightweight "format check" for the frontend, but was never hardened to perform actual cryptographic verification. This is a critical security bug.

## Evidence / Code Snippet

```js
// BUGGY: parts[1] is raw base64, not a verified user ID
req.user = {
    userId: parts[1],
    email: parts[1],
    role  : 'customer',
};
```

## Expected Resolution

1. Replace the manual `split('.')` logic with `jwt.verify(token, env.JWT_ACCESS_SECRET)`.
2. Add a Redis blacklist check using `decoded.jti`.
3. Return the verified `decoded` payload instead of `parts[1]`.

Example fix:
```js
const decoded = await verifyAccessToken(token); // reuse existing verified helper
req.user = {
    userId: decoded.sub,
    email:  decoded.email,
    role:   decoded.role,
};
```

## Verification Steps

- [ ] Send a request with a tampered token (modified payload) and verify it returns 401.
- [ ] Send a request with a blacklisted token and verify it returns 401.
- [ ] Send a request with a valid, non-blacklisted token and verify it returns 200 with correct user info.
