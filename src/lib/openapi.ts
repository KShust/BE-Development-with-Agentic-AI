// Shared OpenAPI registry (api-conventions.md AC-10).
//
// The OpenAPI document is generated from the Zod schemas, never hand-written.
// Feature modules register their schemas and operations into the registry
// exported here; `scripts/generate-openapi.ts` imports every
// `src/modules/*/*.schemas.ts` and turns the accumulated registrations into the
// document at `docs/api/openapi.json`.
//
// src/lib is a leaf (module-map.md): it never imports a feature module, so this
// file holds the registry and nothing that knows about auth or users.
//
// `extendZodWithOpenApi` is called once, here, because it mutates the Zod
// prototype to add `.openapi()`. Calling it per module would work but leaves the
// behaviour dependent on import order; a single call at the registry keeps it
// deterministic.

import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();
