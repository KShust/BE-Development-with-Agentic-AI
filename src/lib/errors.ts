// Domain error taxonomy: the abstract `DomainError` base and the five subclasses
// architecture.md AD-6 names for US-001 (plan D-1). Each carries a stable `code`
// supplied at the throw site; no HTTP types and no status numbers live here —
// the centralized error middleware (src/middleware/errorHandler.ts) owns the
// class-to-status mapping (AD-6).
//
// `UnauthorizedError`, `ForbiddenError` and `NotFoundError` are deliberately not
// created: US-001 has no throw site for any of them, and AD-6 leaves each to the
// Story that first throws it.

export abstract class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = new.target.name;
  }
}

/** Uniqueness or state conflict — maps to 409 (AD-6, AC-5). */
export class ConflictError extends DomainError {}

/** Request body carried a missing or non-JSON Content-Type — maps to 415. */
export class UnsupportedMediaTypeError extends DomainError {}

/** Request body exceeded the configured size limit — maps to 413. */
export class PayloadTooLargeError extends DomainError {}

/**
 * A boundary failure that is not a `ZodError` — currently only the
 * malformed-JSON body `express.json()` raises, wrapped here so it reaches the
 * handler as a domain error rather than a library error (AD-6). Maps to 400.
 */
export class ValidationError extends DomainError {}

/** Rate limit exceeded — maps to 429 (AD-6, SC-3). */
export class TooManyRequestsError extends DomainError {}
