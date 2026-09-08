# Definition of Done — Payments & Checkout

## 1. PCI Scope
- [ ] Card details entered only via the provider's hosted fields — no custom card-number input, ever
- [ ] No raw card data touches application code/servers at any point

## 2. Payment Confirmation
- [ ] Access/entitlement granted only after server-side confirmation (webhook/server call), never from a client callback alone
- [ ] Idempotency key sent per checkout attempt — no duplicate-charge risk on retry/double-submit

## 3. Flow States
- [ ] Distinct UI for idle, processing, succeeded, failed, and requires-action (3DS/SCA) states
- [ ] 3D Secure/SCA challenge flow tested and handled, not a dead-end
- [ ] Failure messaging distinguishes decline reasons from network/system failures

## 4. Pricing & Discounts
- [ ] Prices formatted via `Intl.NumberFormat` in the correct currency for the user's region
- [ ] Coupon/discount validated and final amount computed server-side, not trusted from client display

## 5. Subscription State
- [ ] Subscription status read from the backend's current record, not cached/inferred client-side

## 6. Security & Post-Purchase
- [ ] Payment iframe loaded only from the provider's allowlisted domain per `security-practices`
- [ ] Receipt/invoice remains accessible after purchase, not only on the transient success screen

## Sign-off
Only mark "payments-checkout: done" once all sections are checked.
