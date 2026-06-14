---
title: User Service Profile Address Association Order Crash
date: 2026-06-14
status: closed
severity: medium
service: user-service
---

# Bug: User Service Profile Address Association Order Crash

## Description
When the user attempts to load their profile (which includes loading their associated addresses), the profile loading service fails and throws an error because the sorting parameter is defined inside the nested `include` statement.

## Steps to Reproduce
1. Log in on the frontend and navigate to "My Profile".
2. The frontend attempts to call `/api/users/me` (handled by `getMyProfile` controller in `user-service`).
3. The server logs show a Sequelize database error or the request fails with a 500 error code.

## Expected Behavior
- The profile page should load the user's details and their addresses sorted with the default address first.

## Actual Behavior
- In `services/user-service/src/services/user.service.js`, the query includes the `order` property inside the nested association description:
  ```javascript
  const profile = await Profile.findOne({
      where: { auth_user_id: authUserId },
      include: [{ model: Address, as: 'addresses', order: [['is_default', 'DESC']] }],
  });
  ```
- In Sequelize, the nested association `include` element does not accept the `order` parameter. Depending on the library version, this option is ignored or triggers a query builder error.

## Root Cause / Fix
- **Root Cause**: Sequelize `order` directives must be specified at the top level of the query options, even when sorting associated/included models.
- **Fix**: Move the nested sorting array to the top level of the query:
  ```javascript
  const profile = await Profile.findOne({
      where: { auth_user_id: authUserId },
      include: [{ model: Address, as: 'addresses' }],
      order: [
          [{ model: Address, as: 'addresses' }, 'is_default', 'DESC']
      ],
  });
  ```
