# Business Workflows

## Login

| Field          | Detail                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor          | All users                                                                                                                                                |
| Preconditions  | User not authenticated                                                                                                                                   |
| Steps          | 1. Enter username + password → 2. System validates credentials → 3. System creates session → 4. JWT issued in HttpOnly cookie → 5. Redirect to dashboard |
| Validation     | Username required, password required                                                                                                                     |
| Business Rules | BR-USER-003 (password length), BR-AUTH-001 (lockout after 5 failures)                                                                                    |
| Success        | User is authenticated, redirected to `/`                                                                                                                 |
| Failure        | Error message displayed, no session created                                                                                                              |
| Side Effects   | Audit log entry (login success/failure)                                                                                                                  |
| Permissions    | Unauthenticated                                                                                                                                          |

## Create Product

| Field          | Detail                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor          | Manager, Owner                                                                                                                                             |
| Preconditions  | User authenticated with `products:create` permission                                                                                                       |
| Steps          | 1. Open product form → 2. Fill name, code, prices, category, unit → 3. Submit → 4. Validate → 5. Check unique code → 6. Insert product → 7. Return to list |
| Validation     | Name required (min 3), code required (unique), prices >= 0                                                                                                 |
| Business Rules | BR-PRICE-001 (retail >= buy), BR-PRICE-002 (wholesale <= retail)                                                                                           |
| Success        | Product created, shown in product list                                                                                                                     |
| Failure        | Validation error displayed, form preserved                                                                                                                 |
| Side Effects   | Audit log entry                                                                                                                                            |
| Permissions    | `products:create`                                                                                                                                          |

## Create Sale (POS)

| Field          | Detail                                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor          | Cashier, Manager, Owner                                                                                                                                              |
| Preconditions  | User authenticated with `invoices:create` permission                                                                                                                 |
| Steps          | 1. Open POS → 2. Search/add products → 3. Set quantities and prices → 4. Select customer (optional) → 5. Choose payment type → 6. Process payment → 7. Complete sale |
| Validation     | At least one item, quantities > 0, stock available                                                                                                                   |
| Business Rules | BR-STOCK-003 (deduct stock), BR-INV-001 (cash = total), BR-INV-002 (credit partial OK), BR-INV-003 (stock check)                                                     |
| Success        | Sale completed, stock deducted, payment recorded, invoice generated                                                                                                  |
| Failure        | Stock insufficient warning, validation error                                                                                                                         |
| Side Effects   | Stock movement created, payment recorded, audit log, customer balance updated (if credit)                                                                            |
| Permissions    | `invoices:create`                                                                                                                                                    |

## Return Sale

| Field          | Detail                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Actor          | Manager, Owner                                                                                                                   |
| Preconditions  | Original sale exists, user authenticated with `invoices:return` permission                                                       |
| Steps          | 1. Find original sale → 2. Select items to return → 3. Set return quantities → 4. Confirm → 5. Process refund → 6. Restore stock |
| Validation     | Return qty <= original qty, reason required                                                                                      |
| Business Rules | BR-STOCK-004 (restore stock), BR-INV-005 (qty <= original)                                                                       |
| Success        | Return processed, stock restored, refund issued                                                                                  |
| Failure        | Validation error, stock conflict                                                                                                 |
| Side Effects   | Stock movement (IN), payment reversal (if cash), audit log                                                                       |
| Permissions    | `invoices:return`                                                                                                                |

## Create Purchase

| Field          | Detail                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Actor          | Manager, Owner                                                                                                              |
| Preconditions  | User authenticated with `purchases:create` permission                                                                       |
| Steps          | 1. Open purchase form → 2. Select supplier → 3. Add items with quantities and costs → 4. Submit → 5. Purchase order created |
| Validation     | Supplier required, at least one item, quantities > 0                                                                        |
| Business Rules | None specific                                                                                                               |
| Success        | Purchase order created in draft status                                                                                      |
| Failure        | Validation error                                                                                                            |
| Side Effects   | Audit log                                                                                                                   |
| Permissions    | `purchases:create`                                                                                                          |

## Receive Purchase

| Field          | Detail                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Actor          | Warehouse, Manager, Owner                                                                         |
| Preconditions  | Purchase order exists in submitted status                                                         |
| Steps          | 1. Open purchase order → 2. Confirm received quantities → 3. Submit → 4. Stock added to warehouse |
| Validation     | Received qty <= ordered qty                                                                       |
| Business Rules | BR-STOCK-001 (no negative stock), adds to warehouse only                                          |
| Success        | Stock increased in warehouse, purchase status updated                                             |
| Failure        | Validation error                                                                                  |
| Side Effects   | Stock movement (IN), audit log                                                                    |
| Permissions    | `stock:manage`                                                                                    |

## Stock Transfer

| Field          | Detail                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Actor          | Warehouse, Manager, Owner                                                                                                                 |
| Preconditions  | User authenticated with `stock:transfer` permission                                                                                       |
| Steps          | 1. Open transfer dialog → 2. Select product → 3. Choose direction (shop↔warehouse) → 4. Enter quantity → 5. Confirm → 6. Execute transfer |
| Validation     | Source qty >= transfer qty, product exists                                                                                                |
| Business Rules | BR-STOCK-002 (atomic transfer)                                                                                                            |
| Success        | Source decreased, destination increased, movement logged                                                                                  |
| Failure        | Insufficient stock in source                                                                                                              |
| Side Effects   | Stock movement (TRANSFER_TO_SHOP or TRANSFER_TO_WAREHOUSE), audit log                                                                     |
| Permissions    | `stock:transfer`                                                                                                                          |

## Stock Adjustment (Physical Audit)

| Field          | Detail                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor          | Manager, Owner                                                                                                                                  |
| Preconditions  | User authenticated with `stock:manage` permission                                                                                               |
| Steps          | 1. Open adjust dialog → 2. Select product → 3. Enter actual quantities (shop + warehouse) → 4. Enter reason → 5. Confirm → 6. Stock overwritten |
| Validation     | Quantities >= 0, reason required                                                                                                                |
| Business Rules | BR-STOCK-005 (override stock), reason mandatory                                                                                                 |
| Success        | Stock set to entered values, movement logged as ADJUST                                                                                          |
| Failure        | Validation error                                                                                                                                |
| Side Effects   | Stock movement (ADJUST), audit log with reason                                                                                                  |
| Permissions    | `stock:manage`                                                                                                                                  |

## Customer Payment

| Field          | Detail                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Actor          | Manager, Owner                                                                                       |
| Preconditions  | Customer exists, has outstanding balance                                                             |
| Steps          | 1. Open payment dialog → 2. Select customer → 3. Enter amount → 4. Choose payment method → 5. Submit |
| Validation     | Amount > 0, amount <= owed                                                                           |
| Business Rules | Balance updated                                                                                      |
| Success        | Payment recorded, customer balance reduced                                                           |
| Failure        | Validation error                                                                                     |
| Side Effects   | Audit log                                                                                            |
| Permissions    | `financial:manage`                                                                                   |

## Supplier Payment

| Field          | Detail                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Actor          | Manager, Owner                                                                                       |
| Preconditions  | Supplier exists, has outstanding balance                                                             |
| Steps          | 1. Open payment dialog → 2. Select supplier → 3. Enter amount → 4. Choose payment method → 5. Submit |
| Validation     | Amount > 0                                                                                           |
| Business Rules | Supplier balance updated                                                                             |
| Success        | Payment recorded, supplier balance reduced                                                           |
| Failure        | Validation error                                                                                     |
| Side Effects   | Audit log                                                                                            |
| Permissions    | `financial:manage`                                                                                   |

## Physical Inventory Count

| Field          | Detail                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Actor          | Warehouse, Manager                                                                                                                    |
| Preconditions  | No active count session                                                                                                               |
| Steps          | 1. Create count session → 2. Scan/enter products → 3. Enter counted quantities → 4. Complete count → 5. Review variances → 6. Approve |
| Validation     | Products must exist, quantities >= 0                                                                                                  |
| Business Rules | Only one active session, variance calculation                                                                                         |
| Success        | Stock adjusted to counted values                                                                                                      |
| Failure        | Validation error, session locked                                                                                                      |
| Side Effects   | Stock movements (ADJUST), audit log                                                                                                   |
| Permissions    | `physical_inventory:manage`                                                                                                           |

## Backup Database

| Field          | Detail                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Actor          | Owner                                                                                                    |
| Preconditions  | User authenticated as owner                                                                              |
| Steps          | 1. Click backup → 2. System copies database file → 3. Timestamp added → 4. File saved to `data/backups/` |
| Validation     | Disk space available                                                                                     |
| Business Rules | None                                                                                                     |
| Success        | Backup file created                                                                                      |
| Failure        | Disk error                                                                                               |
| Side Effects   | None                                                                                                     |
| Permissions    | `backup:create`                                                                                          |

## Restore Database

| Field          | Detail                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| Actor          | Owner                                                                                                              |
| Preconditions  | Backup file exists                                                                                                 |
| Steps          | 1. Select backup file → 2. Confirm restore → 3. System validates backup → 4. Replace current database → 5. Restart |
| Validation     | File integrity check                                                                                               |
| Business Rules | IRREVERSIBLE — requires explicit confirmation                                                                      |
| Success        | Database restored, session invalidated                                                                             |
| Failure        | Invalid backup file                                                                                                |
| Side Effects   | All current data lost                                                                                              |
| Permissions    | `backup:restore`                                                                                                   |

## Generate Report

| Field          | Detail                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Actor          | Manager, Owner                                                                                        |
| Preconditions  | User authenticated with `reports:view` permission                                                     |
| Steps          | 1. Select report type → 2. Set date range → 3. Apply filters → 4. View results → 5. Optionally export |
| Validation     | Date range required                                                                                   |
| Business Rules | None                                                                                                  |
| Success        | Report displayed                                                                                      |
| Failure        | No data in range                                                                                      |
| Side Effects   | None                                                                                                  |
| Permissions    | `reports:view`                                                                                        |
