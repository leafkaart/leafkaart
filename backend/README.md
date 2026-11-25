# leafBackend
leafBackend

## Phase 3 deployment

See the [Customer API changelog](../CUSTOMER_API_CHANGELOG.md) for the Android contracts, compatibility changes, and local verification results.

1. Deploy and test the backend and dashboard together in staging. Order status changes use MongoDB transactions and require a replica set or sharded cluster. Confirm the notification event index and the order pending-work indexes are present before exposing writes. See the index definitions in `models/Notification.js` and `models/Order.js`.
2. Configure the existing `MONGODB_URL`, `JWT_SECRET`, `CLOUD_NAME`, `API_KEY`, `API_SECRET`, `EMAIL_USERNAME`, and `EMAIL_PASSWORD` settings. Verify Cloudinary authenticated image and PDF delivery, plus Gmail SMTP delivery to a test customer. Configure the dashboard with the existing `VITE_BACKEND_URL`.
3. Verify Android browse and search with a Customer bearer token. The catalog endpoints require authentication so the server can distinguish Dealers from Customers. The notification API still returns the existing `type: "order"` and `orderId` fields. Android should open that order on tap and use the existing read endpoint. Socket clients must authenticate at connection time with `auth.token` or an `Authorization: Bearer` header. The existing HTTP notification endpoints can be used without Socket.IO.
4. Back up the affected order records and inventory data. From the backend directory, run `node scripts/migrateEmiDocuments.js --dry-run` against staging. Run `--copy` to create authenticated Cloudinary copies and update references. Test Admin and Employee access. After confirming that the assets are specific to EMI orders and that authorized previews still work, run `--revoke-legacy`. That last step deletes the legacy public Cloudinary assets and requests CDN invalidation. Verify previously public links no longer load after invalidation. Resolve unrecognized references before revocation. Keep the old backend offline during the migration if it can still create or expose public EMI attachments.
5. Review the existing low-stock candidates with `node scripts/reconcileLowStock.js --dry-run`. Run `--apply` once to generate alerts for products already below five. Re-running it keeps one notification per recipient for the current low-stock period.
6. Roll out the verified backend and dashboard. Watch for pending notification or SMTP delivery errors. Old transactions and read notifications remain available in the database. Keep the authenticated EMI document endpoint available after the Cloudinary migration, since previous dashboard versions do not understand private references.

### API changes

| Route | Behavior |
|---|---|
| `POST /api/admin/products/createProduct` | Admin creates a product using multipart form data. `isActive` and `dealerVisible` default to enabled. |
| `PATCH /api/admin/products/updateProduct/:id` | Admin edits any product. Employees can manage Admin-created products within their catalog permissions. |
| `GET /api/dealer/products/listProducts?view=admin\|available\|all` | Applies the requested view within the caller's catalog scope. |
| `POST /api/orders/createOrder` | Requires a Customer session and accepts JSON or multipart form data. |
| `GET /api/notification/listNotifications?unread=true` | Returns the signed-in recipient's unread notifications. |
| `GET /api/admin/orders/:id/emi/documents/:documentId` | Streams the document to authorized Admins and Employees. |
| `PATCH /api/admin/orders/:id/emi/review` | Admin or Employee verifies or rejects the documents and records their identity on the order. |

### Schema changes

- `Product` stores the Dealer visibility toggle and a low-stock event ID. Legacy products without the toggle are treated as Dealer-visible if they otherwise meet the caller's catalog permissions.
- `Notification` stores an event key with a partial unique index per recipient. Existing rows without an event key retain their read state.
- `Order` stores the EMI reviewer name, user ID, and review time, along with pending order-created and dispatch delivery state. New EMI attachments store authenticated Cloudinary references on the order.

### Verification

Run `npm test` from the backend directory. To run the HTTP integration suite, set `LEAF_TEST_MONGO_URI` to a disposable, local MongoDB replica set. The suite creates and drops an isolated database and mocks Cloudinary and SMTP. Run `npm run build` from the frontend directory to verify the production bundle. Run `npx playwright install chromium` and `npm run test:smoke` from the frontend directory for the dashboard browser test.

### Phase 3 file inventory

`M` indicates a modified file, `A` an added file, and `D` a deleted file.

```text
M  backend/README.md
M  backend/controllers/admin/adminOrderController.js
M  backend/controllers/auth/authController.js
M  backend/controllers/customer/cartController.js
M  backend/controllers/customer/customerOrderController.js
M  backend/controllers/customer/customerProductController.js
M  backend/controllers/customer/wishlistController.js
M  backend/controllers/dealer/dealerDashboardController.js
M  backend/controllers/dealer/dealerOrderController.js
M  backend/controllers/dealer/dealerProductController.js
M  backend/controllers/employee/employeeOrderController.js
M  backend/controllers/employee/employeeProductController.js
M  backend/controllers/notification/notificationController.js
M  backend/middlewares/errorHandler.js
M  backend/middlewares/roleMiddleware.js
M  backend/models/Notification.js
M  backend/models/Order.js
M  backend/models/Product.js
M  backend/package.json
M  backend/routes/adminRoutes/adminOrderRoutes.js
M  backend/routes/adminRoutes/adminProductRoutes.js
M  backend/routes/customerRoutes/orderRoutes.js
M  backend/routes/customerRoutes/productRoutes.js
M  backend/server.js
M  backend/socket.js
M  backend/utils/emailService.js
M  backend/utils/imageUploader.js
M  backend/utils/notificationHelper.js
M  backend/utils/orderInventory.js
M  frontend/.gitignore
M  frontend/package-lock.json
M  frontend/package.json
M  frontend/src/App.jsx
M  frontend/src/components/NotificationBell.jsx
M  frontend/src/components/dashboard/DateRangeFilter.jsx
M  frontend/src/hooks/useNotifications.js
M  frontend/src/hooks/useToast.jsx
D  frontend/src/pages/Toast/Toast.jsx
M  frontend/src/pages/admin/CustomerList.jsx
M  frontend/src/pages/admin/Dashboard.jsx
M  frontend/src/pages/admin/DealersList.jsx
M  frontend/src/pages/admin/EmployeeList.jsx
M  frontend/src/pages/auth/ForgotPassword.jsx
M  frontend/src/pages/auth/Login.jsx
M  frontend/src/pages/auth/ResetPassword.jsx
M  frontend/src/pages/dealer/DealerDashboard.jsx
M  frontend/src/pages/orders/OrderDetails.jsx
M  frontend/src/pages/products/AddProductPage.jsx
M  frontend/src/pages/products/ImageUploadSection.jsx
M  frontend/src/pages/products/ProductDetail.jsx
M  frontend/src/pages/products/ProductList.jsx
M  frontend/src/socket.js
M  frontend/src/store/api/notificationApi.js
M  frontend/src/store/api/ordersApi.js
M  frontend/src/store/api/productsApi.js
D  frontend/src/store/slices/notificationSlice.js
M  frontend/src/store/store.js
A  backend/scripts/migrateEmiDocuments.js
A  backend/scripts/reconcileLowStock.js
A  backend/tests/phase3.test.js
A  backend/utils/emiDocuments.js
A  backend/utils/lowStock.js
A  backend/utils/orderDispatch.js
A  backend/utils/productVisibility.js
A  backend/utils/validateUpload.js
A  frontend/playwright.config.cjs
A  frontend/src/utils/apiError.js
A  frontend/tests/phase3.spec.cjs
```
