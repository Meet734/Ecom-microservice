---
title: Frontend Refresh Token Storage and Transmission Failure
date: 2026-06-14
status: closed
severity: high
service: frontend
---

# Bug: Frontend Refresh Token Storage and Transmission Failure

## Description
The frontend is unable to perform session refresh (re-authentication via refresh token) because the refresh token is stripped by the backend's JSON response wrapper but still expected by the frontend's local storage and request interceptor.

## Steps to Reproduce
1. Log in or register a user on the frontend.
2. Observe local storage values for `refreshToken` (evaluates to `"undefined"` or `null`).
3. Wait for the short-lived access token to expire (15 minutes).
4. Perform any authenticated request. The Axios interceptor attempts to call `/api/auth/refresh` but fails due to a missing or invalid refresh token, redirecting the user to `/login?session=expired`.

## Expected Behavior
- The login, register, and refresh endpoints should securely handle and share the refresh token, or the frontend should retrieve and send it correctly.
- If using HttpOnly cookies for refresh tokens:
  - The Axios requests to the backend must be sent with `withCredentials: true` (or the default Axios config should support it).
  - The frontend should not try to parse `refreshToken` from the JSON response body (`data.data` or `data`), nor try to load/save it in `localStorage` since it's HttpOnly.

## Actual Behavior
- The backend's `sendTokens` helper strips `refreshToken` from the JSON response object to send it solely via HttpOnly cookie:
  ```javascript
  const { refreshToken, ...rest } = data;
  return res.status(statusCode).json({ success: true, ...rest });
  ```
- The frontend `authStore.js` tries to destructure `refreshToken` from the response JSON body and saves it to `localStorage`, resulting in `undefined` being saved:
  ```javascript
  const { user, accessToken, refreshToken } = data; // data contains no refreshToken
  localStorage.setItem('refreshToken', refreshToken); // Stores "undefined"
  ```
- In `frontend/lib/api.js`, the response interceptor tries to read the refresh token from `localStorage` (getting `"undefined"`) and posts it as a JSON body `{ refreshToken }` to the `/api/auth/refresh` endpoint using a default Axios post without sending credentials, which fails.

## Root Cause / Fix
- **Root Cause**: Mismatch between the cookie-based token design on the backend and the localStorage-based token implementation on the frontend.
- **Fix (Applied)**:
  1. In `frontend/store/authStore.js`: removed all `refreshToken` state/localStorage references. Only `accessToken` and `user` are stored in localStorage.
  2. In `frontend/lib/api.js`: set `withCredentials: true` on the Axios instance so the HttpOnly `refreshToken` cookie is automatically sent. Refresh interceptor now sends empty body and relies on the cookie.
  3. In `services/auth-service/src/controllers/auth.controller.js`: changed cookie `sameSite` from `strict` to `lax` to ensure cookies work through the Next.js rewrite proxy.
  4. In `services/auth-service/src/middleware/validate.middleware.js`: made `refreshToken` optional in the refresh schema body since it comes via cookie.

