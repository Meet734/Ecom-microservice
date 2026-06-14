---
title: Inventory Service Raw Update Affected-Rows Verification Bug
date: 2026-06-14
status: closed
severity: high
service: inventory-service
---

# Bug: Inventory Service Raw Update Affected-Rows Verification Bug

## Description
When decrementing stock in `decrementStock`, the check to verify if the stock update succeeded (which throws an error if there is insufficient stock) is bypassed. This leads to invalid stock transactions and records being created even when no database rows were actually updated.

## Steps to Reproduce
1. Attempt to decrement stock for a product when the requested quantity is greater than the available stock.
2. The raw database UPDATE query runs and updates 0 rows (since `quantity >= :qty` fails).
3. The check `rowsUpdated === 0` is bypassed, and the service continues without throwing an `Insufficient stock` error.
4. It records a `StockMovement` of type `sale` with negative quantity changes, even though no stock was deducted from the database.

## Expected Behavior
- If `quantity >= :qty` fails, 0 rows should be updated, and the service should immediately throw an `Insufficient stock` error and abort the database transaction.

## Actual Behavior
- The raw query is executed using `sequelize.query(...)`:
  ```javascript
  const [rowsUpdated] = await sequelize.query(
    `UPDATE inventory
     SET quantity = quantity - :qty,
         updated_at = NOW()
     WHERE product_id = :productId
       AND quantity >= :qty`,
    {
      replacements: { qty: quantity, productId },
      type: QueryTypes.UPDATE,
      transaction: t,
    }
  );
  ```
- In PostgreSQL dialect, executing an UPDATE raw query with `QueryTypes.UPDATE` without a `RETURNING` clause does not return the number of affected rows as the first element. The returned structure is instead empty or `[undefined, commandResult]`.
- As a result, `rowsUpdated` receives `undefined`.
- The condition `rowsUpdated === 0` is evaluated as `undefined === 0` which is `false`. The validation is bypassed, and a fake stock movement is logged.

## Root Cause / Fix
- **Root Cause**: Destructuring `rowsUpdated` directly from raw `sequelize.query` for updates on PostgreSQL results in an `undefined` check because the first element of the array is empty without `RETURNING`.
- **Fix**:
  - Add `RETURNING *` (or `RETURNING quantity`) to the end of the SQL query:
    ```sql
    UPDATE inventory
    SET quantity = quantity - :qty,
        updatedAt = NOW()
    WHERE product_id = :productId
      AND quantity >= :qty
    RETURNING *
    ```
    Then `rowsUpdated` (which becomes the first updated record) can be checked: `if (!rowsUpdated) { ... }`.
  - Alternatively, use Sequelize's built-in `Inventory.update` which returns an array where the first element is the number of affected rows:
    ```javascript
    const [rowsUpdated] = await Inventory.update(
      { quantity: sequelize.literal(`quantity - ${quantity}`) },
      {
        where: {
          product_id: productId,
          quantity: { [Op.gte]: quantity }
        },
        transaction: t
      }
    );
    ```
