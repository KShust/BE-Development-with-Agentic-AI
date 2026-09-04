// Integration coverage: AC-007 (audit event content and distinctness) and
// EC-4 (a failed audit write does not fail the request).
//
// Spies on the root `src/lib/logger.ts` export. Two code paths reach this
// object's `.info` during a registration request: this Story's audit line
// (`auth.service.ts`, payload `{ event: 'user.registered', ... }`) and
// pino-http's request-completion line (`src/app.ts` step 6), which fires from a
// `res` `'finish'` handler after the response has been sent. The EC-4 case
// below must fail only the audit write, so its stub throws exclusively for the
// `user.registered` payload and is a no-op for every other `.info` call —
// otherwise the completion line throws from the `'finish'` handler, outside any
// `try/catch`, and crashes the run (V-1). The assertions search the recorded
// calls for the audit payload by `event` rather than assuming it is the only
// `.info` call.
//
// Split into its own file for the SC-3 rate-limit reason explained in
// tests/support/api.ts. This file makes 2 requests.

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from '../../src/lib/logger.js';
import { truncateAll } from '../support/database.js';
import { customerBody, registerRequest, uniqueEmail, validPassword } from '../support/api.js';

beforeEach(async () => {
  await truncateAll();
  vi.restoreAllMocks();
});

describe('POST /api/v1/auth/register — audit logging (AC-007)', () => {
  it('logs a user.registered event with event, userId and requestId, and no personal data (FR-12, SC-9)', async () => {
    const infoSpy = vi.spyOn(logger, 'info');
    const email = uniqueEmail('audit');

    const res = await registerRequest().send({ email, password: validPassword() });
    expect(res.status).toBe(201);

    const auditCall = infoSpy.mock.calls.find(
      (call) => (call[0] as Record<string, unknown> | undefined)?.event === 'user.registered',
    );
    expect(auditCall).toBeDefined();

    const payload = auditCall?.[0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['event', 'requestId', 'userId']);
    expect(payload.userId).toBe(customerBody(res).id);
    expect(payload.requestId).toEqual(expect.any(String));

    const raw = JSON.stringify(payload);
    expect(raw).not.toContain(email);
    expect(raw.toLowerCase()).not.toContain('ip');
  });

  it('does not fail the request when the audit write itself throws, and logs that failure as an error (EC-4)', async () => {
    // Fail only the audit write. The stub throws for the `user.registered`
    // payload and is a no-op for every other `.info` call — notably pino-http's
    // request-completion line, which fires from a `res` `'finish'` handler after
    // this test's `await` resolves; a stub that threw there would escape every
    // `try/catch` and crash the run (V-1). No assertion here depends on
    // request-completion logging.
    vi.spyOn(logger, 'info').mockImplementation((...args) => {
      const first: unknown = args[0];
      if (
        typeof first === 'object' &&
        first !== null &&
        'event' in first &&
        (first as { event?: unknown }).event === 'user.registered'
      ) {
        throw new Error('audit sink unavailable');
      }
    });
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    const res = await registerRequest().send({
      email: uniqueEmail('audit-fail'),
      password: validPassword(),
    });

    expect(res.status).toBe(201);
    expect(errorSpy).toHaveBeenCalled();
  });
});
