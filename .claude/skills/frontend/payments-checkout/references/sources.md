# References & Sources

## Official Documentation
- **Stripe — Elements/Payment Element documentation** — hosted-fields integration, `confirmPayment`, 3D Secure handling: https://stripe.com/docs/payments/elements
- **Stripe — Webhooks documentation** — server-side payment confirmation, event verification: https://stripe.com/docs/webhooks
- **Stripe — Idempotent Requests documentation** — the idempotency-key mechanism referenced by Rule 4: https://stripe.com/docs/api/idempotent_requests
- **Razorpay official docs** — regional PSP alternative referenced in Step 0: https://razorpay.com/docs/
- **PCI Security Standards Council — SAQ A eligibility criteria** — the scope-reduction rationale behind Rules 1-2: https://www.pcisecuritystandards.org

## Widely-Recognized Community Standards
- **OWASP — Payment Card Industry guidance / third-party script trust** — the iframe/CSP trust-boundary reasoning behind Rule 11, shared with `security-practices`: https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
