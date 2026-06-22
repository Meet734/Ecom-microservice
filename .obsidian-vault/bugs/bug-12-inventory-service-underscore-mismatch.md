# Bug-12: Inventory Service Sequelize Underscore Mismatch — Column Name Bugs

> **Status:** Open
> **Service(s):** inventory-service
> **Priority:** High
> **Reported:** 2026-06-19

## Summary

The Inventory Service's Sequelize configuration uses `underscored: false`, while its models define fields in `snake_case` (e.g., `low_stock_threshold`, `warehouse_location`). This causes Sequelize to query columns like `lowStockThreshold` and `warehouseLocation` in PostgreSQL, which do not exist, leading to runtime database errors.

## Files Affected

- `services/inventory-service/src/config/db.js`
- `services/inventory-service/src/models/inventory.model.js`
- `services/inventory-service/src/models/stockMovement.model.js`

## Current Behavior (What's Happening)

Sequelize's default column naming strategy camelCases model field names when `underscored: false`. Since the model fields are already snake_case (`low_stock_threshold`), Sequelize mangles them to `lowStockthreshold` or similar invalid forms. All inventory queries (initialize, get, restock, decrement, increment) will fail with "column does not exist" errors at runtime.

## Expected Behavior (What Should Happen)

Sequelize should query the exact column names defined in the model (`low_stock_threshold`, `warehouse_location`, etc.) by setting `underscored: true`, or the model definitions and DB config must be made consistent.

## Root Cause (Hypothesis)

Developer inconsistency: Inventory Service was likely scaffolded from another service but the `underscored` flag was not set to `true` to match the snake_case field names.

## Evidence / Code Snippet

```js
// services/inventory-service/src/config/db.js line 16
define: {
    timestamps: true,
    underscored: false,  // <-- BUG: should be true
    freezeTableName: true,
},
```

```js
// services/inventory-service/src/models/inventory.model.js
low_stock_threshold: { ... },   // snake_case
warehouse_location: { ... },    // snake_case
```

## Expected Resolution

1. Set `underscored: true` in `services/inventory-service/src/config/db.js` to match the snake_case model fields.
2. Verify that existing DB migrations or schema matches the corrected column names.
3. If the database was already created with wrong column names, either migrate or drop/resync in development.

## Verification Steps

- [ ] Start inventory-service and verify no Sequelize column errors in logs.
- [ ] Call `POST /api/inventory/initialize` and verify the record is created with correct column names.
- [ ] Call `GET /api/inventory/:productId` and verify data is returned correctly.
