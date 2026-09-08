# Payments & Checkout Rules

## Rule 1: Never Touch Raw Card Data — Hosted Fields Only
- Card/payment details are entered exclusively via the payment provider's hosted fields component (Stripe Elements/Payment Element, Razorpay's Checkout) rendered in a provider-controlled iframe — the application's own JavaScript never has access to the raw card number, expiry, or CVV at any point. Never build a custom input for card number "for a better UX" — this single decision determines most of the PCI-compliance burden below.

## Rule 2: PCI Scope Is Minimized by Design
- Because raw card data never touches application code or servers (Rule 1), the app qualifies for the lowest PCI DSS SAQ tier (SAQ A) rather than a far heavier compliance burden — this is a deliberate architectural choice, not an accident, and any proposed change to the payment flow is evaluated for whether it would pull raw card data into scope before being implemented.

## Rule 3: Payment Confirmation Is Server-Verified
- A payment is only considered successful, and access/entitlement is only granted (course unlocked, subscription activated), after the backend independently confirms the charge — via the PSP's webhook or a server-side confirmation API call — never from the client-side SDK's success callback alone. A client-side success event can be spoofed, delayed, or fire before the charge is actually finalized; the client callback updates UI optimistically at most, it never authorizes access.

## Rule 4: Idempotency Keys Prevent Duplicate Charges
- Every checkout submission includes an idempotency key (generated once per checkout attempt, reused on retry) sent to the backend/PSP, consistent with `form-handling-validation`'s double-submit-prevention rule and `api-integration`'s idempotency rule applied specifically to a payment — a network blip causing a retry, or a user double-clicking "Pay," must never result in two charges for one purchase.

## Rule 5: Every Payment State Has Explicit UI
- The checkout flow has distinct, designed UI for: idle/entering details, processing (a charge is in flight — inputs disabled), succeeded, failed (with the reason), and requires-action (3DS/SCA challenge pending) — never a single ambiguous "please wait" spinner covering multiple of these states indistinguishably, which leaves the user unable to tell if it's safe to retry or if a charge might already have gone through.

## Rule 6: 3D Secure/SCA Challenges Handled Within the Flow
- 3D Secure (or regional SCA equivalent) authentication challenges are handled as an expected, first-class step in the checkout flow (the provider SDK's `handleCardAction`/`confirmPayment` flow that presents the bank's challenge UI) — not treated as a rare edge case that crashes or dead-ends the flow. This is common enough (especially for Indian/EU cards) that it must be tested, not assumed away.

## Rule 7: Failure Messaging Is Specific and Actionable
- A declined card shows the specific, PSP-provided reason where available (insufficient funds, expired card, do-not-honor) translated to user-friendly language — distinct from a network/system failure (which shows a retry action) — a generic "Payment failed" for every failure type leaves the user unable to tell whether to try a different card, check their bank, or just retry.

## Rule 8: Pricing/Currency Display Is Locale- and Region-Aware
- Displayed prices use `Intl.NumberFormat` with the correct currency for the user's billing region, consistent with `i18n-l10n`'s currency rule — the currency charged must match what's displayed to the user throughout the flow (no showing USD then charging in a different currency without clear disclosure).

## Rule 9: Subscription State Is a Single Source of Truth from the Backend
- Subscription status (active, past-due, canceled, trialing) shown anywhere in the app is read from the backend's current record (synced from the PSP via webhook) — never inferred or cached client-side in a way that can drift from the PSP's actual state (e.g. after a failed renewal charge). A user's access to gated content is gated by the backend's current status check, not a client-side flag that might be stale.

## Rule 10: Coupon/Discount Validation Happens Server-Side
- A coupon/discount code is validated and its actual discount amount computed server-side at checkout time — a client-side "coupon applied, 20% off" display is a UX preview only; the final charge amount is always computed and verified by the backend, which prevents a manipulated client from applying an invalid or expired discount.

## Rule 11: Payment UI Trust Boundary Respected
- The payment provider's embedded iframe/script is loaded only from the provider's official, allowlisted domain per `security-practices`'s CSP and third-party-script rules — no proxying or wrapping the payment iframe in a way that could allow a compromised third-party script elsewhere on the page to interfere with it (clickjacking/framing protections apply here specifically).

## Rule 12: Receipts/Invoices Accessible After Purchase
- A completed purchase's receipt/invoice remains accessible after the fact (a billing history page, an emailed receipt) — not shown only transiently on the checkout success screen and then unrecoverable. This matters for expense reporting/reimbursement use cases common with course purchases.
