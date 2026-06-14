---
title: Order Cancel Never Restores Inventory Stock
date: 2026-06-14
status: closed
severity: critical
service: order-service
---

# Bug: Order Cancel Never Restores Inventory Stock

## Description
When a confirmed order is cancelled, the inventory stock that was decremented during confirmation is never restored. The `order.cancelled` event is never published because the status check happens after the in-memory mutation.

## Steps to Reproduce
1. Create an order via `POST /api/orders` with valid product items.
2. Confirm the order via `POST /api/orders/:id/confirm` — inventory-service decrements stock.
3. Cancel the order via `POST /api/orders/:id/cancel`.
4. Check inventory-service logs — no `order.cancelled` event is received, stock is not restored.

## Expected Behavior
- Cancelling a confirmed order should publish an `order.cancelled` event.
- The inventory-service should consume this event and restore the decremented stock.

## Actual Behavior
- In `services/order-service/src/services/order.service.js`, `cancelOrder` calls `order.update({ status: 'cancelled' })` on line 228.
- Sequelize's `update()` mutates the in-memory model instance, so `order.status` becomes `'cancelled'` immediately.
- The subsequent check on line 235 `if (order.status === 'confirmed')` evaluates to `false` — it's now `'cancelled'`.
- `publishOrderCancelled()` is **never called**, so inventory-service never restores stock.

```javascript
// BEFORE fix — dead code
await order.update({ status: 'cancelled', cancelled_reason: reason || null });
if (order.status === 'confirmed') {  // Always false after update
    publishOrderCancelled({ ... });   // Never runs
}
```

## Root Cause / Fix
- **Root Cause**: The status check references the in-memory Sequelize instance *after* it has already been mutated by `.update()`.
- **Fix (Applied)**: Capture the original status before calling `.update()`:
  ```javascript
  const previousStatus = order.status;
  await order.update({ status: 'cancelled', cancelled_reason: reason || null });
  if (previousStatus === 'confirmed') {
      publishOrderCancelled({ ... });
  }
  ```
