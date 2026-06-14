---
title: Frontend Product Search Response Layout Mismatch
date: 2026-06-14
status: closed
severity: high
service: frontend
---

# Bug: Frontend Product Search Response Layout Mismatch

## Description
When typing a query in the search box on the products page and clicking "Search", the product grid becomes completely empty, showing "No products found", even if matching products exist in Elasticsearch.

## Steps to Reproduce
1. Navigate to the Products page.
2. Enter a search query (e.g., "phone") and submit.
3. Observe that the list clears and displays "No products found."

## Expected Behavior
- The matching products returned by the Elasticsearch search in `product-service` should be displayed on the page.

## Actual Behavior
- In `frontend/app/(dashboard)/products/page.jsx`, the frontend attempts to read product results from `data.data`:
  ```javascript
  const { data } = response; // data is the parsed JSON response
  setProducts(data.data || []);
  ```
- However, the `product-service` search handler (which delegates to `searchProducts` in `elasticsearch.service.js`) returns the product list under the key `products` at the root, rather than `data`:
  ```javascript
  return {
    total:    result.hits.total.value,
    products: result.hits.hits.map(hit => ({ id: hit._id, ...hit._source })),
    page,
    limit,
    pages:    Math.ceil(result.hits.total.value / limit),
  };
  ```
- Since the key `data.data` is missing in the search response, `data.data` evaluates to `undefined`, and `setProducts(data.data || [])` sets the product array to `[]`.

## Root Cause / Fix
- **Root Cause**: Inconsistent response payload structure in `product-service` between the listing endpoint (returns `data`) and the search endpoint (returns `products`).
- **Fix**:
  - Update `frontend/app/(dashboard)/products/page.jsx` to load from `data.products` when search results are retrieved:
    ```javascript
    const { data } = response;
    if (searchQuery) {
      setProducts(data.products || []);
    } else {
      setProducts(data.data || []);
    }
    ```
  - Alternatively, change the product service's `searchProducts` response in `services/product-service/src/search/elasticsearch.service.js` to return `data: products` instead of `products: products` to align search and list APIs.
