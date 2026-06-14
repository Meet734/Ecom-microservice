---
title: Frontend Product Listing Pagination Metadata Mismatch
date: 2026-06-14
status: closed
severity: medium
service: frontend
---

# Bug: Frontend Product Listing Pagination Metadata Mismatch

## Description
The pagination metadata (total results and total pages) is not displaying properly on the products listing page. The UI displays "0 products found" and does not show any pagination buttons, even when products are successfully listed.

## Steps to Reproduce
1. Navigate to the Products catalog page.
2. View the count label below filters (shows "0 products found").
3. Observe that even if multiple pages of products exist, no pagination buttons appear at the bottom.

## Expected Behavior
- The count label should display the total number of products matching the query/filter (e.g. "12 products found").
- Pagination buttons (Prev/Next) should appear when the total page count is greater than 1.

## Actual Behavior
- In `frontend/app/(dashboard)/products/page.jsx`, the pagination metadata is extracted from `data.pagination`:
  ```javascript
  setPagination((prev) => ({
    ...prev,
    total: data.pagination?.total || 0,
    totalPages: data.pagination?.totalPages || 1,
  }));
  ```
- However, the `product-service` API response returns these fields at the root of the JSON payload under `total` and `pages`:
  ```javascript
  return {
    data: products,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
  ```
- Because of this mismatch, `data.pagination` evaluates to `undefined`, defaulting the page count to `1` and total count to `0`.

## Root Cause / Fix
- **Root Cause**: The frontend is looking for pagination metadata nested under `data.pagination` (`data.pagination.total`, `data.pagination.totalPages`), whereas the backend returns them at the root level of the payload (`data.total`, `data.pages`).
- **Fix**: Update the state hydration in `frontend/app/(dashboard)/products/page.jsx` to map backend fields directly:
  ```javascript
  setPagination((prev) => ({
    ...prev,
    total: data.total || 0,
    totalPages: data.pages || 1,
  }));
  ```
