---
title: Validation failures and permission errors across user, product, inventory flows
date: 2026-06-14
status: closed
severity: high
services: user-service, inventory-service, frontend
---

# Bug: Validation failures and permission errors across user, product, inventory flows

## Issues fixed in this session (3 root causes → 6 symptoms)

---

### Bug A — 400 on `POST /api/users/me/addresses` (empty `line2`)

**Service:** user-service  
**File:** `services/user-service/src/middleware/validate.middleware.js`

**Root cause:**  
Joi `string().optional()` rejects an empty string `""` by default. The address form in the frontend always sends `line2` as `""` when left blank (HTML inputs submit empty string, not `undefined`). Joi treated `""` as an invalid string and returned 400.

**Fix:**  
```js
// Before
line2: Joi.string().max(255).optional(),

// After
line2: Joi.string().max(255).allow(null, '').optional(),
```

**Pattern to remember:** Any optional string field that comes from an HTML `<input>` must use `.allow(null, '')` in Joi, because form submissions always send `""` for blank fields, never `undefined`.

---

### Bug B — 403 Insufficient permissions on inventory lookup for non-admin users

**Service:** inventory-service  
**Files:**  
- `services/inventory-service/src/middleware/auth.middleware.js`  
- `services/inventory-service/src/routes/inventory.routes.js`

**Root cause 1 — auth middleware inconsistency:**  
The inventory-service auth middleware was the only service that did not normalize `req.user`. It stored the raw JWT payload (`req.user = decoded`) instead of the normalized shape used by every other service (`req.user = { userId: decoded.sub, email, role }`). It also did not support API Gateway header injection (`x-user-id`, `x-user-role`, `x-user-email`).

**Fix:**  
Rewrote `auth.middleware.js` to match the exact pattern used by user-service and product-service — gateway headers first, then Bearer token fallback with normalized `req.user` shape.

**Root cause 2 — GET route required admin role:**  
`GET /:productId` was gated behind `authorize('admin')`. There is no security reason for customers or sellers to be blocked from checking stock levels of a product they want to buy or sell.

**Fix:**  
```js
// Before
router.get('/:productId', authenticate, authorize('admin'), controller.getInventory);

// After — any authenticated user can read stock
router.get('/:productId', authenticate, controller.getInventory);
```

Write operations (initialize, restock) remain admin-only.

---

### Bug C — Frontend showed admin-only UI to all roles, causing guaranteed 403s

**Frontend files:**  
- `frontend/app/(dashboard)/products/manage/page.jsx`  
- `frontend/app/(dashboard)/inventory/page.jsx`

**Root cause:**  
The product creation page displayed a "New Category" button to all users including customers and sellers. Category creation (`POST /api/products/categories`) requires `admin` role — clicking this button always returned 403 for non-admins. Similarly the inventory page showed Initialize and Restock forms to customers and sellers with no role check, resulting in guaranteed 403 errors.

**Fixes:**

Product manage page:
- "New Category" button and form only rendered if `user.role === 'admin'`
- Entire product creation form replaced with an informational message for `customer` role (they can't create products either)

Inventory page:
- Stock Lookup available to all authenticated users
- Initialize and Restock sections only rendered if `user.role === 'admin'`
- Added low-stock visual indicator (amber color) when quantity ≤ threshold

---

## Summary of file changes

| File | Change |
|---|---|
| `user-service/src/middleware/validate.middleware.js` | `line2` in `addAddress` schema: `.optional()` → `.allow(null, '').optional()` |
| `inventory-service/src/middleware/auth.middleware.js` | Full rewrite — added gateway header support, normalized `req.user` shape |
| `inventory-service/src/routes/inventory.routes.js` | Removed `authorize('admin')` from `GET /:productId` |
| `frontend/app/(dashboard)/products/manage/page.jsx` | Category creation gated to admin; product form blocked for customers |
| `frontend/app/(dashboard)/inventory/page.jsx` | Admin-only forms hidden from non-admin users |
