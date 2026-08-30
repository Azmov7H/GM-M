# ADR-004: Feature-Oriented Architecture

## Context

The codebase needs a scalable organization pattern that keeps related code together and separates unrelated code.

## Decision

Organize code by business feature, not by technical layer.

## Alternatives Considered

| Alternative                                   | Reason for Rejection                   |
| --------------------------------------------- | -------------------------------------- |
| Layer-oriented (components/, services/, etc.) | Splits related code across directories |
| Domain-Driven Design                          | Overkill for this project size         |
| Monorepo (packages/)                          | Single application, not a library      |

## Consequences

**Positive:**

- Features are self-contained
- Easy to understand feature scope
- Simple to remove/disable features
- Better code locality
- Scales with complexity

**Negative:**

- May lead to some code duplication
- Requires discipline to maintain boundaries
- Cross-feature communication needs planning

## Status

Accepted
