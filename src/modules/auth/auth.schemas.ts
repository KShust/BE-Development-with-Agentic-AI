// Zod request/response schemas for the auth module and their OpenAPI
// registration (FR-16, FR-22, AC-10).
//
// This file is where the SC-1 password policy is expressed once (VR-8) and where
// email normalization happens before validation (BR-2, VR-4). The shared
// boundary middleware applies `registerRequestSchema`; the controller shapes the
// success response from `registerResponseSchema`. `scripts/generate-openapi.ts`
// discovers this file and turns the registrations below into
// `docs/api/openapi.json`.

import { z } from 'zod';

import { registry } from '../../lib/openapi.js';

const EMAIL_MAX = 254;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

/**
 * SC-1 composition rule: at least three of the four character classes, counted
 * over Unicode code points. Class four ("anything else") is a single class —
 * punctuation, symbol and space all fall in it.
 */
function characterClassCount(password: string): number {
  let lower = false;
  let upper = false;
  let digit = false;
  let other = false;

  for (const char of password) {
    if (/\p{Ll}/u.test(char)) lower = true;
    else if (/\p{Lu}/u.test(char)) upper = true;
    else if (/[0-9]/.test(char)) digit = true;
    else other = true;
  }

  return [lower, upper, digit, other].filter(Boolean).length;
}

function codePointLength(value: string): number {
  return [...value].length;
}

// --- Request ---------------------------------------------------------------

const emailField = z
  .string({ error: 'email is required and must be a string' })
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .email('email must be a valid email address')
      .max(EMAIL_MAX, `email must be at most ${String(EMAIL_MAX)} characters`),
  )
  .openapi({
    type: 'string',
    format: 'email',
    minLength: 1,
    maxLength: EMAIL_MAX,
    description:
      'The customer email. Trimmed and lowercased before it is validated, ' +
      'compared and stored; the bound applies to that normalized value (BR-2, VR-3, VR-4).',
  });

const passwordField = z
  .string({ error: 'password is required and must be a string' })
  .refine((value) => codePointLength(value) >= PASSWORD_MIN, {
    error: `password must be at least ${String(PASSWORD_MIN)} characters`,
  })
  .refine((value) => codePointLength(value) <= PASSWORD_MAX, {
    error: `password must be at most ${String(PASSWORD_MAX)} characters`,
  })
  .refine((value) => characterClassCount(value) >= 3, {
    error:
      'password must contain at least 3 of: a lowercase letter, an uppercase letter, ' +
      'a digit, and another character',
  })
  .openapi({
    type: 'string',
    writeOnly: true,
    minLength: PASSWORD_MIN,
    maxLength: PASSWORD_MAX,
    description:
      'The plaintext password, accepted only on this request and never returned (SR-3). ' +
      'Policy: 12-128 Unicode code points, at least 3 of the 4 character classes ' +
      '(lowercase, uppercase, digit, other) per security-conventions.md SC-1 (VR-6, VR-8).',
  });

export const registerRequestSchema = z
  .strictObject({
    email: emailField,
    password: passwordField,
  })
  .openapi('RegisterRequest', {
    description:
      'The registration request body. Exactly two properties are accepted; ' +
      'an unknown property is rejected rather than stripped (VR-9, AD-5).',
  });

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

// --- Response ------------------------------------------------------------

export const registerResponseSchema = z
  .strictObject({
    id: z.uuid().openapi({
      description: 'The account identifier — a string, never a number (AC-11, PC-3).',
    }),
    email: z.email().max(EMAIL_MAX).openapi({
      description: 'The stored, normalized email (BR-2, VR-4).',
    }),
    role: z.literal('CUSTOMER').openapi({
      description: 'The account role. CUSTOMER is the only role defined (FR-3, SC-2).',
    }),
    createdAt: z.iso.datetime({ offset: true }).openapi({
      description:
        'When the account was created, ISO 8601 with an explicit UTC offset (AC-11, PC-6).',
    }),
  })
  .openapi('RegisterResponse', {
    description:
      'The created account as an explicit DTO (AD-4, SR-5). Exactly four fields; ' +
      'no credential field is present (FR-11, SR-4, AC-006).',
  });

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

// --- Error bodies (contract only; the error middleware builds them) --------

const fieldErrorsSchema = z.record(z.string(), z.array(z.string()).min(1)).openapi('FieldErrors', {
  minProperties: 1,
  description:
    'Per-field validation messages, keyed by the field that failed (AC-6, VR-11). ' +
    'Never empty on a VALIDATION_FAILED response.',
});

function errorEnvelope(code: string, withDetails: boolean) {
  const errorShape = withDetails
    ? z.strictObject({
        code: z.literal(code),
        message: z.string(),
        details: z.strictObject({ fieldErrors: fieldErrorsSchema }),
      })
    : z.strictObject({
        code: z.literal(code),
        message: z.string(),
      });
  return z.strictObject({ error: errorShape });
}

const validationErrorResponse = errorEnvelope('VALIDATION_FAILED', true).openapi(
  'ValidationErrorResponse',
  {
    description:
      'A 400 raised by boundary validation. details.fieldErrors is always present and non-empty (VR-11).',
  },
);
const malformedJsonErrorResponse = errorEnvelope('MALFORMED_JSON', false).openapi(
  'MalformedJsonErrorResponse',
  {
    description:
      'A 400 raised when the body is not parseable JSON. No field can be named, so details is omitted.',
  },
);
const conflictErrorResponse = errorEnvelope('EMAIL_ALREADY_REGISTERED', false).openapi(
  'ConflictErrorResponse',
  {
    description:
      'The email is already registered (FR-6, BR-009). No Prisma text reaches this body (SR-6).',
  },
);
const payloadTooLargeErrorResponse = errorEnvelope('PAYLOAD_TOO_LARGE', false).openapi(
  'PayloadTooLargeErrorResponse',
  { description: 'The request body exceeds the 10kb limit (VR-10, SC-5).' },
);
const unsupportedMediaTypeErrorResponse = errorEnvelope('UNSUPPORTED_MEDIA_TYPE', false).openapi(
  'UnsupportedMediaTypeErrorResponse',
  { description: 'A body was sent with a missing or non-JSON Content-Type (VR-10, AC-2).' },
);
const rateLimitErrorResponse = errorEnvelope('RATE_LIMIT_EXCEEDED', false).openapi(
  'RateLimitErrorResponse',
  { description: 'The register rate limit was exceeded (FR-13, SC-3).' },
);
const internalErrorResponse = errorEnvelope('INTERNAL_ERROR', false).openapi(
  'InternalErrorResponse',
  {
    description:
      'An unmapped error. The body is generic; diagnostics stay server-side (SC-9, AD-6).',
  },
);

const requestIdHeader = registry.registerComponent('headers', 'XRequestId', {
  description:
    'The request id correlating this response with every log line for the request (AC-9, FR-15).',
  required: true,
  schema: { type: 'string' },
});

const errorResponseHeaders = { 'X-Request-Id': requestIdHeader.ref };

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  operationId: 'registerCustomer',
  tags: ['auth'],
  summary: 'Register a new customer account',
  description:
    'Creates one customer account from an email and a password and returns the created ' +
    'resource (FR-1, FR-2, AC-001). Public and unauthenticated (SC-4); rate limited on ' +
    '/api/v1/auth (FR-13, SC-3). The email is trimmed and lowercased before validation, ' +
    'the uniqueness check and storage (BR-2, VR-4).',
  request: {
    body: {
      required: true,
      content: {
        'application/json': { schema: registerRequestSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'The account was created. The body carries exactly four fields (FR-5, AC-006).',
      headers: { 'X-Request-Id': requestIdHeader.ref },
      content: { 'application/json': { schema: registerResponseSchema } },
    },
    400: {
      description:
        'The request body was rejected at the HTTP boundary. VALIDATION_FAILED names every ' +
        'failing field in details.fieldErrors (VR-11); MALFORMED_JSON carries no details.',
      headers: errorResponseHeaders,
      content: {
        'application/json': {
          // Rendered as `anyOf`; the `const` on `code` keeps the two branches
          // mutually exclusive, so it is `oneOf` in effect (API design d-2).
          schema: z.union([validationErrorResponse, malformedJsonErrorResponse]),
        },
      },
    },
    409: {
      description: 'An account already exists for the normalized email (FR-6, AC-002, EC-3).',
      headers: errorResponseHeaders,
      content: { 'application/json': { schema: conflictErrorResponse } },
    },
    413: {
      description: 'The request body exceeds the 10kb limit (VR-10, SC-5).',
      headers: errorResponseHeaders,
      content: { 'application/json': { schema: payloadTooLargeErrorResponse } },
    },
    415: {
      description:
        'The request carries a body with a missing or non-JSON Content-Type (VR-10, AC-2).',
      headers: errorResponseHeaders,
      content: { 'application/json': { schema: unsupportedMediaTypeErrorResponse } },
    },
    429: {
      description: 'The caller exceeded the register rate limit (FR-13, SC-3, EC-7).',
      headers: errorResponseHeaders,
      content: { 'application/json': { schema: rateLimitErrorResponse } },
    },
    500: {
      description: 'An unmapped error. The body is generic and leaks nothing on SC-9 (AD-6).',
      headers: errorResponseHeaders,
      content: { 'application/json': { schema: internalErrorResponse } },
    },
  },
});
