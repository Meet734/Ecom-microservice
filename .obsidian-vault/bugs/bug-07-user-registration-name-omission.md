---
title: User Registration Name Mismatch and Profile Loss
date: 2026-06-14
status: closed
severity: medium
service: auth-service
---

# Bug: User Registration Name Mismatch and Profile Loss

## Description
When registering a new account, the user provides their name on the signup form, which is posted to the backend. However, because the backend ignores the name field, the registered user's profile is initialized with empty first and last name fields.

## Steps to Reproduce
1. Navigate to the Signup/Register page on the frontend.
2. Enter Name (e.g. "Jane Doe"), Email, and Password, and submit the form.
3. Once registered and logged in, navigate to the "My Profile" page.
4. Observe that the First Name and Last Name fields are completely empty in the profile form.

## Expected Behavior
- The user's name supplied during registration should be saved in their profile (e.g., splitting "Jane Doe" into First Name "Jane" and Last Name "Doe" or saving the name directly in the profile).

## Actual Behavior
- The frontend `authStore.js` sends the registration request containing `name`:
  ```javascript
  const { data } = await api.post('/api/auth/register', { email, password, name });
  ```
- The `auth-service` `register` function destructures only `email`, `password`, and `role`:
  ```javascript
  export const register = async ({ email, password, role = 'customer' }, meta = {}) => {
  ```
  The name parameter is discarded.
- The `auth-service` publisher publishes the `user.registered` event containing only `userId`, `email`, and `role`:
  ```javascript
  const message = Buffer.from(JSON.stringify({ userId, email, role, timestamp: new Date() }));
  ```
- The `user-service` consumer listens to this event and creates the user profile with only `auth_user_id`:
  ```javascript
  await Profile.create({ auth_user_id: userId });
  ```
  Consequently, `first_name` and `last_name` remain `null`.

## Root Cause / Fix
- **Root Cause**: The name provided in the frontend registration payload is ignored by the `auth-service` controller and service, meaning it is not forwarded to RabbitMQ and not captured by `user-service` to initialize the Profile.
- **Fix**:
  1. Update `services/auth-service/src/services/auth.service.js` register method to accept the `name` argument:
     ```javascript
     export const register = async ({ email, password, name, role = 'customer' }, meta = {}) => {
     ```
  2. Include `name` in the event payload in `publishUserRegistered`:
     ```javascript
     const message = Buffer.from(JSON.stringify({ userId, email, role, name, timestamp: new Date() }));
     ```
  3. In `services/user-service/src/events/consumer.js`, update `handleUserRegistered` to extract `name` and split it to populate the profile fields:
     ```javascript
     const handleUserRegistered = async ({ userId, email, name }) => {
         const existing = await Profile.findOne({ where: { auth_user_id: userId } });
         if (existing) return;

         let first_name = '';
         let last_name = '';
         if (name) {
             const parts = name.trim().split(/\s+/);
             first_name = parts[0] || '';
             last_name = parts.slice(1).join(' ') || '';
         }

         await Profile.create({
             auth_user_id: userId,
             first_name,
             last_name
         });
     };
     ```
