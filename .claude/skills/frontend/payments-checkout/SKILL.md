---
name: payments-checkout
description: Use this skill whenever the user is building a checkout flow, course/subscription purchase UI, payment form, or reviewing PCI-scope concerns. Trigger for phrases like "add checkout", "buy this course", "subscription billing UI", "Stripe Elements", "payment form", "PCI compliance", "the payment failed silently", "coupon/discount code", "refund flow UI", or any request involving Stripe, Razorpay, or in-app purchase UX. Also trigger for Definition of Done review on a payments/checkout feature.
---

# Payments & Checkout Skill

Defines the frontend architecture for course/subscription purchase flows — payment form integration via a hosted-fields provider (never handling raw card data), PCI-scope minimization, failure/retry UX, and subscription-state consistency.

## Step 0: Detect Project Context Before Applying Any Rule

**Existing project?**
- Check `package.json` for `@stripe/stripe-js`/`@stripe/react-stripe-js`, `razorpay`, or another PSP SDK. Follow whatever is already established.

**New project / no precedent?**
- Default to **Stripe** (Elements/Payment Element) for a global product, or a regionally-appropriate PSP (e.g. **Razorpay** for an India-primary EdTech audience) — always via the provider's hosted-fields UI component, never a custom form that touches raw card numbers.

## When to use this
- Building a course/subscription purchase or checkout flow
- Integrating a payment provider's hosted payment form
- Handling payment success/failure/pending states and retries
- Building coupon/discount code entry
- Reviewing PCI-scope, or a PR/Definition of Done for a payments feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Never touch raw card data — hosted fields only (Stripe Elements/Payment Element or equivalent)**
2. **PCI scope is minimized by design** — the frontend never sees, stores, or transmits raw PAN/CVV
3. **Payment confirmation is server-verified**, never trusted from a client-side success callback alone
4. **Idempotency keys prevent duplicate charges** on retry/double-submit, consistent with `form-handling-validation`'s double-submit rule
5. **Every payment state (processing, succeeded, failed, requires-action) has explicit UI** — no ambiguous "please wait" forever
6. **3D Secure/SCA challenges are handled within the flow**, not treated as an unexpected edge case
7. **Failure messaging is specific and actionable**, distinguishing card-declined from network/system failure
8. **Pricing/currency display is locale- and region-aware**, consistent with `i18n-l10n`'s currency rule
9. **Subscription state (active/past-due/canceled) is a single source of truth from the backend**, not inferred client-side
10. **Coupon/discount validation happens server-side** before checkout completes, never trusting a client-applied discount
11. **Sensitive payment UI is never embedded in a compromisable context** — cross-references `security-practices`'s CSP/third-party-script rules
12. **Receipts/invoices are accessible after purchase**, not only shown transiently on the success screen

## Workflow

1. **Step 0 first, always**: detect existing PSP integration, or set Stripe (or a regional equivalent) as the standard.
2. Integrate the provider's hosted payment fields — never a custom card-number input.
3. Build explicit UI for every payment state, including 3DS/SCA challenge handling.
4. Verify payment success server-side (webhook or server-side confirmation call) before granting access/entitlement.
5. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs the checkout/payment UI flow. For CSP and third-party script trust boundaries around the payment provider's embedded iframe, see `security-practices`. For idempotency/retry mechanics at the API layer, see `api-integration`.
- Grounded in official Stripe, PCI Security Standards Council, and OWASP documentation — see `references/sources.md`.
