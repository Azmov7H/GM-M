# ADR-006: Authentication Strategy

## Context

The system needs secure authentication for multiple users with different roles. Sessions must be managed securely.

## Decision

Use JWT tokens stored in HttpOnly, Secure, SameSite=Strict cookies. Sessions tracked in database. Server-side verification on every request.

## Alternatives Considered

| Alternative          | Reason for Rejection                      |
| -------------------- | ----------------------------------------- |
| NextAuth.js          | Overkill for local-first, adds complexity |
| localStorage tokens  | XSS vulnerable                            |
| Session cookies only | Less scalable                             |
| OAuth (Google)       | Requires internet, not local-first        |

## Consequences

**Positive:**

- Secure (HttpOnly prevents XSS)
- CSRF protection (SameSite=Strict)
- Server-side session tracking
- Scalable to multiple users

**Negative:**

- JWT secret management
- Session expiry handling
- More complex than simple cookies

## Status

Accepted
