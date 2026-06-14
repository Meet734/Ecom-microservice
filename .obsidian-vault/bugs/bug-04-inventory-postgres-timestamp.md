---
title: Inventory Service Raw SQL Timestamp Column Name Mismatch
date: 2026-06-14
status: closed
severity: high
service: inventory-service
---

# Bug: Inventory Service Raw SQL Timestamp Column Name Mismatch

## Description
When attempting to place an order or directly decrement stock for a product, the inventory service crashes due to a PostgreSQL error stating that the column `updated_at` does not exist on the `inventory` table.

## Steps to Reproduce
1. Execute the `decrementStock` method (e.g., when a user confirms an order and the `order.confirmed` event is published).
2. The inventory service attempts to execute the raw SQL UPDATE query.
3. Observe the service logs. It crashes or rejects with:
   `column "updated_at" of relation "inventory" does not exist`

## Expected Behavior
- The database columns should align with the SQL queries executed by the application.
- The `updatedAt` timestamp column should be successfully updated.

## Actual Behavior
- In `services/inventory-service/src/config/db.js`, Sequelize is initialized with `underscored: false` under the `define` property:
  ```javascript
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  }
  ```
- Because `underscored` is set to `false`, Sequelize automatically creates the database columns for timestamps using camelCase: `createdAt` and `updatedAt`.
- However, in `services/inventory-service/src/services/inventory.service.js`, the raw UPDATE query in `decrementStock` explicitly tries to update `updated_at`:
  ```sql
  UPDATE inventory
  SET quantity = quantity - :qty,
      updated_at = NOW()
  WHERE product_id = :productId
    AND quantity >= :qty
  ```
- Postgres throws a syntax/relation error because the database column is named `updatedAt`, not `updated_at`.

## Root Cause / Fix
- **Root Cause**: The database schema uses camelCase (`updatedAt` and `createdAt`) due to `underscored: false` configuration, but the raw SQL query in `decrementStock` queries snake_case `updated_at`.
- **Fix**:
  - Update `services/inventory-service/src/config/db.js` to define `underscored: true` to match other microservices (which ensures all table columns and system fields use snake_case).
  - Alternatively, if camelCase must be preserved, update the raw query in `inventory.service.js` to reference `updatedAt = NOW()`.
