// Public entry point for @spellzee/contracts.
//
// Response types and shared enums — the seam between the API and the console.
// The backend owns these; the frontend imports them rather than re-declaring
// them, because a duplicated type drifts silently and nothing fails until a
// user sees the wrong number.
//
// Nothing with a runtime dependency on NestJS or Prisma belongs here: this
// package must stay importable from a browser.
//
// Empty until the first endpoint exists.

export {};
