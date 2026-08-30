# ADR-005: Server Components Strategy

## Context

React 19 supports Server Components, which allow rendering on the server without sending JavaScript to the client. This improves performance and security.

## Decision

Default to Server Components. Only use Client Components when interactivity is required.

## Alternatives Considered

| Alternative           | Reason for Rejection                       |
| --------------------- | ------------------------------------------ |
| All Client Components | Defeats purpose of Next.js, larger bundles |
| All Server Components | No interactivity possible                  |
| Mixed without rules   | Inconsistent, hard to maintain             |

## Consequences

**Positive:**

- Smaller client bundles
- Better performance
- Database access stays on server
- Improved security

**Negative:**

- Mental overhead of server/client boundary
- Some patterns don't work with RSC
- Need to understand serialization limits

## Status

Accepted
