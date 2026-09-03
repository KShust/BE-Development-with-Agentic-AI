// Integration coverage: AC-007 (audit event content and distinctness) and
// EC-4 (a failed audit write does not fail the request).
//
// Spies on the root `src/lib/logger.ts` export. General per-request logging
// goes through pino-http's own child logger (bound to `req.log`), not the
// root export, so a call landing on the root logger's `.info` here is, for
// this Story's code, the audit line and nothing else — the assertions below
// still search for it explicitly by `event` rather than assuming it is the
// only call, so this stays true even if that changes later.
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
    vi.spyOn(logger, 'info').mockImplementation(() => {
      throw new Error('audit sink unavailable');
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
