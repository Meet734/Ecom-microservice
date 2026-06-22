# Bug-13: Payment Service Verified-User False Negative Due to Status Metadata

> **Status:** Open
> **Service(s):** payment-service, order-service, notification-service, frontend
> **Priority:** High
> **Reported:** 2026-06-19

## Summary

In `payment.controller.js`, the verification logic checks `order.status` and `order.payment_status`, and returns 400 if the order is cancelled or already paid. However, this verification is performed against the **order-service response** which may include metadata or a different status field from payOS/webhook state, leading to false negatives where a valid order is incorrectly rejected.

## Files Affected

- `services/payment-service/src/controllers/payment.controller.js`
- `services/payment-service/src/services/payment.service.js`
- `frontend/app/(dashboard)/checkout/page.jsx`

## Current Behavior (What's Happening)

When fetching order details from order-service in `processPayment` (lines 18-41), the payment service gets an order object and checks:
```js
if (order.status === 'cancelled') { ... }
if (order.payment_status === 'paid') { ... }
if (order.total_amount !== amount) { ... }
```

If the order-service response includes metadata fields from payOS or if `status` is mapped differently, these checks can fail prematurely. For example, an order with `status: 'confirmed'` and `payment_status: 'paid'` from a concurrent webhook might be correctly paid, but a stale fetch could show `payment_status: 'unpaid'`, causing a duplicate payment or rejection.

## Expected Behavior (What Should Happen)

The payment service should:
1. Use an idempotency key or payment reference to prevent duplicate charges.
2. Query order-service with strong consistency or use optimistic locking.
3. Handle payOS webhook status merges correctly, not relying solely on a single fetch.

## Root Cause (Hypothesis)

No idempotency mechanism and no reconciliation between frontend order state, order-service state, and payment-service state. The payment service trusts a single REST fetch without handling concurrent webhook updates.

## Evidence / Code Snippet

```js
// services/payment-service/src/controllers/payment.controller.js lines 43-55
if (order.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Cannot pay for a cancelled order' });
}
if (order.payment_status === 'paid') {
    return res.status(400).json({ success: false, message: 'Order has already been paid' });
}
if (order.total_amount !== amount) {
    return res.status(400).json({ ... });
}
```

## Expected Resolution

1. Add idempotency key support (e.g., `Idempotency-Key` header or database constraint on `transaction_id`) to prevent duplicate payments.
2. Implement a payment status reconciliation step after processing, or fetch the latest order state within a retry loop.
3. Update frontend checkout to disable the "Pay" button after the first submission or upon receiving a success/failure response.
4. Ensure payOS webhook handlers update the order and payment states atomically.

## Verification Steps

- [ ] Submit payment twice quickly; verify only one payment is recorded.
- [ ] Simulate a delayed webhook and a concurrent REST payment; verify no double charge.
- [ ] Verify frontend disables the submit button after payment is initiated.
