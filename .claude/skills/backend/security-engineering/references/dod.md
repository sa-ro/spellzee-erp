# Definition of Done — Security Engineering

Work is not done until every applicable item below is true.

- [ ] No user input is concatenated into a SQL/NoSQL query or shell
      command — parameterized/bound queries only.
- [ ] Authorization is checked server-side for every request, including
      object-level ownership (IDOR check — can a caller substitute
      another user's ID and reach data that isn't theirs?).
- [ ] No secret, token, password, or full PII appears in logs, error
      responses, or source control.
- [ ] Passwords (if any) are hashed with a slow KDF (bcrypt/argon2), not
      reversibly encrypted or hashed with a fast general-purpose hash.
- [ ] Any endpoint that fetches a user-supplied URL blocks internal/
      private IP ranges and cloud metadata endpoints (SSRF).
- [ ] State-changing endpoints are protected from CSRF appropriately for
      the auth mechanism in use (cookie vs. bearer token).
- [ ] Output is encoded/escaped by context to prevent XSS — relying on
      framework auto-escaping, not hand-rolled escaping.
- [ ] CORS does not reflect `*` with credentialed requests.
- [ ] Auth-sensitive endpoints (login, password reset, OTP) have
      dedicated, tighter rate limiting than general API traffic.
- [ ] Secrets are sourced from environment/secrets manager, never
      hardcoded or committed.
