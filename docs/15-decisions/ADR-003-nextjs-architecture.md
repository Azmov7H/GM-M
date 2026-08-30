# ADR-003: Next.js Application Architecture

## Context

The application needs a web framework that supports both server-side rendering and client-side interactivity. Arabic RTL must be supported natively.

## Decision

Use Next.js 16 with App Router, Server Components by default, and Server Actions for mutations.

## Alternatives Considered

| Alternative         | Reason for Rejection                 |
| ------------------- | ------------------------------------ |
| Pages Router        | Older, less capable, no RSC          |
| Vite + React Router | No server-side rendering, more setup |
| Remix               | Less mature ecosystem                |
| Nuxt.js             | Vue-based, not React                 |

## Consequences

**Positive:**

- Server Components by default (better performance)
- Built-in routing and layouts
- Server Actions for form handling
- SEO-friendly
- Active ecosystem

**Negative:**

- Learning curve for App Router
- Server/Client component boundary complexity
- Build times for large projects

## Status

Accepted
