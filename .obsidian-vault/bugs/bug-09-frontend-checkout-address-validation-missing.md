# Bug-09: Frontend Checkout Address Validation Missing

> **Status:** Open
> **Service(s):** Frontend
> **Priority:** High
> **Reported:** 2026-06-19

## Summary

The checkout page does not validate the address payload before sending it to the order API, which can cause downstream validation failures and poor user experience.

## Files Affected

- `frontend/app/(dashboard)/checkout/page.jsx`

## Current Behavior (What's Happening)

In `handlePlaceOrder` (lines 92-122), the checkout logic only checks:
- Whether an address is selected (`selectedAddressId`)
- Whether inventory info exists
- Whether requested quantity exceeds available stock

However, it does **not** validate that the selected address object contains the required fields, nor does it validate the inline address schema if it were extended later. If an address record is missing `full_name`, `phone`, or other required fields, the order creation fails downstream without a clear frontend error.

## Expected Behavior (What Should Happen)

Before placing the order, the frontend should validate that the selected address has all required fields and provide immediate feedback to the user if data is incomplete or malformed.

## Root Cause (Hypothesis)

The frontend trusts that the user-service API always returns fully populated, valid address records. There is no client-side validation layer for the address object selected in checkout.

## Evidence / Code Snippet

```js
// Lines 92-104
const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a shipping address.');
      return;
    }
    if (!inventory) {
      setError('Cannot place order. Product stock information is not initialized.');
      return;
    }
    if (quantity > inventory.quantity) {
      setError(`Cannot place order. Requested quantity (${quantity}) exceeds available stock (${inventory.quantity}).`);
      return;
    }
    // No address field validation here
```

## Expected Resolution

1. Add a validation function that checks the selected address object for required fields (`full_name`, `phone`, `line1`, `city`, `state`, `pincode`, `country`).
2. If validation fails, set a descriptive error message and abort order placement.
3. Optionally, inline-validate each address card on render so the user can see missing fields before checkout.

## Verification Steps

- [ ] Select an address and click "Place Order" with all fields present; order should succeed.
- [ ] Simulate a malformed address response (e.g., missing `full_name`); checkout should show a clear error instead of a generic "Failed to place order."
- [ ] Ensure existing happy-path flow is unchanged.
