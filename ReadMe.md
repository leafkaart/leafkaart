# LeafKaart (LeafMart) — Project Documentation

> Generated from a code read-through of `client.zip` (React admin/ops panel) and `server.zip`
> (Node/Express API). This is **not** the original project README — it's a reverse-engineered
> reference covering architecture, flows, routes, roles, known issues, and a prioritized
> enhancement plan.

---

## 1. What this project actually is

This is a **multi-role e-commerce operations platform**, not a public storefront. There is no
customer-facing shop UI in the `client` folder you sent — the React app is an **internal admin /
employee / dealer console**. Customers are expected to interact through a separate channel
(likely a mobile app), since customer auth is OTP-over-SMS via Twilio rather than the
email/password flow used by staff.

**Four roles share one `User` collection:** `admin`, `employee`, `dealer`, `customer`.

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite 7, Redux Toolkit + RTK Query, React Router v7, Tailwind CSS, Framer Motion, Recharts, Socket.IO client |
| Backend | Node.js, Express 5, MongoDB (Mongoose), JWT auth, bcryptjs, Socket.IO, Cloudinary (images), Twilio Verify (customer OTP), Nodemailer (email — not wired up), express-fileupload |
| Infra hints | Deployed at `leafkaart.com` / `leafkaart.cloud`, behind CORS allow-list in `server.js` |

---

## 2. High-Level System Flow

```
                         ┌──────────────────────────┐
                         │        MongoDB            │
                         │  User / Product / Order /  │
                         │  Category / Dealer / etc.  │
                         └─────────────▲──────────────┘
                                       │ Mongoose
                         ┌─────────────┴──────────────┐
   React Admin Panel ───▶│   Express API (server.js)   │◀─── Customer app (external, uses
   (admin/employee/      │   /api/auth  /api/admin/*    │     /api/products, /api/cart,
   dealer login)         │   /api/employee/* /api/dealer│     /api/orders, Twilio OTP)
                         │   /api/products /api/orders  │
                         └─────────────┬──────────────┘
                                       │
                     ┌─────────────────┼─────────────────┐
                     ▼                 ▼                 ▼
               Cloudinary         Socket.IO          Twilio Verify
             (product/dealer   (order/notification    (customer OTP
              images, EMI docs)   push events)          login/register)
```

### Core flow narrative

1. **Auth**
   - Admin / Employee / Dealer sign in with **email + password** (`/api/auth/login`), issued a
     JWT valid for 30 days.
   - Dealers self-register (`/api/auth/dealer-register`) with KYC (PAN, GST, 3–5 store photos on
     Cloudinary) and sit in `status: "pending"` until an admin approves them — they cannot log in
     until approved.
   - Employees are created by an admin (`employee-register`), not self-service.
   - Customers use a **passwordless, mobile-OTP** flow: `send-otp` → Twilio SMS → `verify-register`
     or `verify-login`, which issues a JWT and pushes it into `user.activeTokens[]` (multi-device
     session list, used to support logout-from-this-device).

2. **Catalog**
   - Admin/Employee create `Category` → `SubCategory` → `Product`. A dealer can also submit a
     product, but it needs **admin/employee approval** (`isApproved`) before it's customer-visible.
   - Every product carries an `activityLog[]` audit trail (who created/edited/approved and when) —
     good practice, already implemented.

3. **Cart → Order**
   - Customer builds a `Cart`, then `POST /api/orders/createOrder`.
   - Server **re-prices the order from the DB** (`Product.customerPrice`) rather than trusting the
     client's line totals, and rejects the request if the client's `grandTotal` doesn't match the
     recomputed total (good — prevents price tampering on the total, see §6 for a caveat).
   - Payment method is one of `EMI | Cash On Delivery | QR`. EMI requires Aadhaar front/back + PAN
     card image uploads (KYC for financing); QR requires a payment screenshot; both go through a
     manual **`paymentReview`** step (`pending → approved/rejected`) rather than a real payment
     gateway integration.

4. **Fulfilment**
   - Admin assigns an order to a `Dealer` (`assignOrderToDealer`) who then progresses it through a
     long status list (`processing → packed → shipped → out_for_delivery → delivered`, etc.).
   - Every status change is appended to `order.timeline[]` with actor id/name/role — a solid audit
     trail, though the schema carries a lot of **legacy/duplicate field aliases** (see §6).
   - Inventory is deducted/restored via `utils/orderInventory.js` tied to order state changes.

5. **Notifications**
   - `utils/notificationHelper.js` writes a `Notification` doc and (via `socket.js`) pushes a live
     event to the recipient if they have an active socket connection; otherwise it's picked up on
     next `GET /api/notification/listNotifications`.

---

## 3. Roles & Permissions Matrix

| Capability | Admin | Employee | Dealer | Customer |
|---|:---:|:---:|:---:|:---:|
| Login method | email/password | email/password | email/password (post-approval) | mobile OTP |
| Manage categories/subcategories | ✅ | ✅* | ❌ | — |
| Create products | ✅ | ✅ | ✅ (own stock) | — |
| Approve/reject products | ✅ | ✅ | ❌ | — |
| Approve dealers | ✅ | ❌ (view only) | — | — |
| View/manage all orders | ✅ | assigned orders only | assigned orders only | own orders only |
| Assign order to dealer | ✅ | ❌ | — | — |
| Approve payment / EMI docs | ✅ | (route exists, restricted to admin logic) | ❌ | — |
| Manage banners | ✅ | ✅ | ❌ | — |
| Dashboard analytics | ✅ | — | ✅ (own scope) | — |
| Customer CRUD (admin panel) | ✅ | — | — | — |

\* Category/SubCategory routes currently have **no role check at all** — see §6.1.

---

## 4. Backend Route Reference

Base URL: `/api`. `auth` = requires valid JWT. Role columns show the middleware actually applied.

### Auth (`/api/auth`)
| Method | Path | Guard | Purpose |
|---|---|---|---|
| POST | `/register` | – | Generic email/password register (legacy path; role defaults to `"user"`, which isn't a valid enum value — see §6.2) |
| POST | `/verify-otp` | – | Email OTP verify (for the generic register path above) |
| POST | `/login` | – | Email/password login (admin/employee/dealer) |
| POST | `/logout` | – | Stub only — does not invalidate token server-side |
| POST | `/forgot-password`, `/reset-password` | – | Email OTP based reset |
| GET | `/getUserDetails` | auth | Current user profile |
| PATCH | `/updateUserDetails` | auth | Update own name/mobile |
| POST | `/dealer-register` | – | Dealer self-registration + KYC upload |
| GET | `/getAllDealers` | **none** ⚠️ | List dealers — should be admin-only |
| PATCH/DELETE | `/updateDealer/:id`, `/deleteDealer/:id` | auth + admin | Manage dealer |
| POST | `/employee-register` | **none** ⚠️ | Create employee — should be admin-only |
| GET | `/getAllEmployees` | **none** ⚠️ | List employees |
| PATCH/DELETE | `/updateEmployee/:id`, `/deleteEmployee/:id` | **none** ⚠️ | Edit/disable employee |
| POST | `/customer/send-otp` | – | Twilio OTP (register or login) |
| POST | `/customer/verify-register` | – | Verify OTP + create customer |
| POST | `/customer/verify-login` | – | Verify OTP + login customer |
| GET/PATCH/DELETE | `/getAllCustomers`, `/updateCustomer/:id`, `/deleteCustomer/:id` | **none** ⚠️ | Admin customer management — publicly reachable today |

### Admin (`/api/admin/*`)
| Path | Guard | Purpose |
|---|---|---|
| `products/pendingProducts` | **none** ⚠️ | List products awaiting approval |
| `products/approveProduct/:id`, `/rejectProduct/:id` | admin/employee | Approve/reject |
| `products/dealers-by-pincode/:pinCode` | admin/employee | Find dealers near a pincode |
| `categories/*` | **none** ⚠️ | Full CRUD, unauthenticated |
| `subCategories/*` | **none** ⚠️ | Full CRUD, unauthenticated |
| `dashboard/completeDashboard` | **none** ⚠️ | Full business analytics, unauthenticated |
| `orders/listOrders`, `/getOrder/:id` | auth (any role) | Should be admin-only, currently just requires *a* valid token |
| `orders/updateOrderStatus/:id`, `/updatePaymentStatus/:id` | auth (any role) | Same issue |
| `orders/assignOrderToDealer/:id`, `/unassignOrderToDealer/:id` | auth (any role) | Same issue |
| `orders/return-action/:id` | auth (any role) | Approve/reject return/replace requests |
| `banner/*` | admin/employee (except `listBanners`, public) | Homepage banners |

### Employee (`/api/employee/*`)
| Path | Guard |
|---|---|
| `products/*` (CRUD, commission) | admin/employee |
| `orders/assigned-orders`, `/:id/status` | employee only |

### Dealer (`/api/dealer/*`)
| Path | Guard |
|---|---|
| `products/createProduct`, `/deleteProduct/:id`, `/update-stock/:id` | dealer only |
| `products/listProducts` | auth (any role) |
| `products/updateProduct/:id` | auth (any role) — **not scoped to dealer's own product** ⚠️ |
| `orders/assigned-orders`, `/:id/status` | dealer only |
| `dashboard/overview` | dealer only |

### Customer (`/api/products`, `/api/cart`, `/api/wishlist`, `/api/address`, `/api/orders`, `/api/reviews`)
| Path | Guard | Purpose |
|---|---|---|
| `products/listApproved`, `/listByCategory/:id`, `/dealer/:id`, `/employee/:id`, `/search` | public | Storefront browsing |
| `products/getById/:id` | auth | Product detail (oddly requires login even for browsing) |
| `cart/*`, `wishlist/*`, `address/*` | auth | Standard customer account features |
| `orders/createOrder`, `/listOrders`, `/getOrder/:id`, `/return/:id` | auth | Order placement & tracking |
| `reviews/createReview`, `/markHelpful/:id` | auth | `reviews/listReviews` public, `/approveReview/:id` admin |

### Other
| Path | Guard | Notes |
|---|---|---|
| `/api/notification/*` | auth | List / mark-read |
| `/api/payment/*` | — | **Registered as a route file but never mounted in `server.js`, and it imports from a controller path that doesn't exist (`require('../controllers/')`) — this router is dead code and would crash if it were ever `require`d.** |

---

## 5. Frontend Route Reference

All authenticated routes live under `<ProtectedRoute><MainLayout /></ProtectedRoute>`; `MainLayout`
presumably renders the sidebar/navbar shared shell.

| Path prefix | Pages | Notes |
|---|---|---|
| `/` | `RoleBasedRedirect` → sends logged-in users to their dashboard, else shows `LandingPage` | Any unrecognized role falls through to `/admin/dashboard` (see §6.3) |
| `/login`, `/register`, `/dealer-register`, `/forgot-password`, `/reset-password`, `/verify-otp/:userId`, `/waiting-for-approval` | Public auth pages | `/register` and `/dealer-register` both render the same `DealerRegistrationForm` |
| `/admin/*` | dashboard, categories, dealers, products, products/:id, employees, customers, user-register, profile, banners, orders, orders/:id | Full admin console |
| `/dealer/*` | dashboard, products, products/:id, orders, orders/:id | Dealer console |
| `/employee/*` | dashboard, products, products/:id, customers, categories, dealers, orders, orders/:id | Employee has near-admin visibility (customers, dealers, categories) |
| `*` | `RoleBasedRedirect` | Catch-all |

**Route guard reality check:** `ProtectedRoute` (the component actually wired into `routes/index.jsx`)
only checks `localStorage.getItem("token")` — it does **not** check role. `PrivateRoute` and
`PublicRoute` are more complete (role-aware) implementations that exist in the codebase but are
**unused**. Practically, this means:
- A logged-in dealer can type `/admin/dashboard` into the address bar and the shell will render
  (though data calls to admin-only endpoints will 403 — except the several endpoints in §6.1 that
  have no auth check at all, which would actually return data).

---

## 6. Things the client *will* notice (issues found in the code)

### 6.1 Security — unauthenticated endpoints (highest priority)
Several sensitive endpoints have **no `auth` middleware at all**, so they're reachable by anyone
with the API URL, logged in or not:
- `GET /api/auth/getAllDealers`, `/getAllEmployees`, `/getAllCustomers` (+ their update/delete)
- `POST /api/auth/employee-register` (anyone could create themselves as an employee)
- `GET /api/admin/dashboard/completeDashboard` (full business analytics/revenue)
- `GET /api/admin/products/pendingProducts`
- All `/api/admin/categories/*` and `/api/admin/subCategories/*` (public write access — anyone can
  delete a category)

### 6.2 Login response leaks the password hash
`authController.login` does `res.json({ ...user })` without `.select('-password')`. The bcrypt
hash is sent to the browser and — because the frontend stores the whole `user` object in
`localStorage` — **the hash sits in plaintext in devtools/localStorage** on every staff device.
Low practical risk (bcrypt is one-way) but it's an easy, visible finding in any security review
and worth fixing regardless.

### 6.3 Role fallback defaults to Admin
In `RoleBasedRedirect` (frontend), any role that isn't `dealer`/`admin`/`employee` falls through
to `/admin/dashboard`. Combined with the generic `/register` endpoint defaulting to
`role: "user"` (not a valid enum value in the `User` schema — Mongoose would reject it, or silently
coerce depending on schema strictness), this is a fragile default that should fail closed, not
open.

### 6.4 Inconsistent/duplicate registration paths
There are **two customer-facing registration systems**: the generic `/api/auth/register` +
`/verify-otp` (email OTP, password-based, logs OTP to console instead of emailing it — `sendOTP`
is a `console.log` stub even though `nodemailer` is a dependency), and the dedicated
`/api/auth/customer/*` Twilio SMS flow. It's unclear which one the shipped customer app actually
uses; the unused one is dead weight and a source of confusion/bugs.

### 6.5 Dead code / broken files
- `middlewares/errorHandler.js` is written but never wired into `server.js` (no centralized error
  handling — every controller repeats its own try/catch).
- `routes/paymentRoutes.js` imports `require('../controllers/')`, which doesn't resolve to
  anything — the file is broken and not mounted in `server.js` anyway.
- `middlewares/uploadMiddleware.js` uses `multer` and `uuid`, neither of which is listed in
  `package.json` — a fresh `npm install` would build fine (both packages simply wouldn't exist)
  until something actually calls this middleware, at which point it throws `Cannot find module`.
- Frontend `PrivateRoute.jsx` and `PublicRoute.jsx` are fully-built, unused components.
- `pages/banner/BannerManagement .jsx` has a **trailing space in the filename** — cosmetic but a
  classic sign of a rushed rename; it also means the import path in `routes/index.jsx` is fragile
  on case-sensitive filesystems (Linux prod servers).

### 6.6 CORS inconsistency
Express CORS is locked to a specific origin allow-list, but `socket.js` initializes Socket.IO with
`cors: { origin: "*" }` — any website can open a socket connection to your notification stream.

### 6.7 Order schema bloat / legacy fields
`Order.timeline[]` and `Order.latestAction` keep **two parallel sets of field names**
(`performedById` vs `employeeId`, `action` vs `actionPerformed`, `createdAt` vs `timestamp`/`at`)
explicitly commented as "legacy aliases kept temporarily." This roughly doubles the document size
per timeline entry and is a maintenance trap — the two names will drift out of sync over time.

### 6.8 Minor UX/data gaps
- `orderNumber` is generated as `"ORD-" + Date.now()` — no uniqueness guarantee under concurrent
  requests in the same millisecond (low probability, but the schema has a `unique` index on it, so
  a collision would surface as a raw 500 error to the customer instead of a friendly retry).
- `logout` is a no-op on the server for staff (email/password) accounts — the JWT stays valid for
  the full 30 days after "logging out" unless it's a customer account (customers use the
  `activeTokens` list, staff don't).
- `client/dist` (a Vite production build) is checked into the zip you sent — build artifacts
  shouldn't be committed; it bloats the repo and can go stale vs. source.
- No `.env.example` was included for the server, so the exact required environment variables
  (`JWT_SECRET`, `TWILIO_*`, `CLOUDINARY_*`, `MONGO_URI`, etc.) aren't self-documented for a new
  dev setting up the project.

---

## 7. Enhancement Roadmap

### 🔴 Critical (do first)
1. **Lock down every unauthenticated endpoint** listed in §6.1 with `auth` + the correct role
   middleware (`adminMiddleware` / `adminOrEmployee`).
2. **Strip the password hash from every user-returning response** (`.select('-password')`
   everywhere, or a Mongoose `toJSON` transform on the `User` model that removes `password`, `otp`,
   `activeTokens` globally — one fix instead of remembering it per-controller).
3. **Make frontend route guarding role-aware.** Replace `ProtectedRoute`'s "has a token" check with
   the already-written `PrivateRoute`/role logic, or extend it to accept an `allowedRoles` prop per
   route branch (`/admin`, `/dealer`, `/employee`).
4. **Fix `/api/payment` or remove it.** Either wire up a real payment gateway (Razorpay/Cashfree —
   both already modeled in `Payment.js`) or delete the dead route file to stop it being a landmine
   for the next developer.

### 🟠 High
5. **Centralize error handling** — actually mount `errorHandler`, and replace repetitive
   `try/catch { res.status(500)... }` blocks in every controller with `next(err)` + the shared
   handler. Add a 404 handler for unmatched API routes too.
6. **Real server-side token invalidation on logout** for staff accounts — either move everyone to
   the `activeTokens` pattern already built for customers, or switch to short-lived access tokens
   + refresh tokens (the `Token` model already supports a `refresh` type but nothing issues one).
7. **Consolidate to one customer registration flow.** Decide if it's email/password or mobile OTP,
   and delete the other to remove duplicate logic and reduce attack surface.
8. **Add rate limiting** (e.g. `express-rate-limit`) on `/login`, `/send-otp`, `/forgot-password`,
   and `/reset-password` — currently nothing stops brute-forcing OTPs or passwords.
9. **Input validation layer** (Zod/Joi/express-validator) on all controllers — right now validation
   is manual `if (!field)` checks scattered per-controller, which is inconsistent and easy to miss
   (e.g. no email format check, no password strength rule).

### 🟡 Medium
10. **Clean up the `Order` timeline schema** — pick one canonical field set, migrate existing data,
    drop the legacy aliases.
11. **Fix `orderNumber` generation** to something collision-proof (e.g. a Mongo counter collection,
    or `ORD-${date}-${shortuuid}`), and catch duplicate-key errors gracefully.
12. **Move file uploads consistently through Cloudinary** — `uploadMiddleware.js` (local disk via
    multer) appears unused/orphaned next to `imageUploader.js` (Cloudinary); pick one path, remove
    the other, and add the missing `multer`/`uuid` deps if you keep it.
13. **Add pagination/filtering to every list endpoint** — currently only `getAllCustomers` has real
    pagination; `getAllDealers`, `getAllEmployees`, `pendingProducts`, etc. appear to return
    everything at once, which won't scale.
14. **Real email delivery** — hook `nodemailer` up to actually send the OTP/reset emails currently
    just logged to the server console.
15. **Restrict Socket.IO CORS** to the same origin allow-list used by Express, and require a valid
    JWT on socket connection (`socket.handshake.auth.token`) instead of trusting whatever `userId`
    the client sends to `join`.

### 🟢 Low / polish
16. Rename `BannerManagement .jsx` (remove trailing space), audit other filenames for the same.
17. Remove `client/dist` from version control; add `dist/` to `.gitignore` (it's already ignored
    for the server but not consistently treated that way for the client artifact you shared).
18. Add a `.env.example` for both `client` and `server` documenting every required variable.
19. Delete unused frontend files (`PrivateRoute.jsx`, `PublicRoute.jsx`) or actually use them.
20. Add automated tests — there is currently no test suite (`"test": "echo \"Error: no test
    specified\" && exit 1"` is still the default CRA/npm placeholder).
21. Add API documentation (OpenAPI/Swagger) generated from the route files — useful given how many
    role/permission combinations exist.

---

## 8. Suggested Next Steps
If you want, I can:
- Patch the §7 "Critical" items directly in the code (auth middleware on the unprotected routes,
  password-hash leak, route-guard role checks) and hand back a diff.
- Draft the missing `.env.example` files from every `process.env.X` reference found in the code.
- Write a small Postman/Thunder Client collection covering every route in §4 for manual QA.