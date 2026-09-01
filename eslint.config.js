// ESLint flat config. Encodes docs/architecture/architecture.md (AD-2, AD-5,
// AD-7) and docs/architecture/module-map.md.
//
// Two layers of enforcement:
//   1. typescript-eslint (type-aware) for correctness;
//   2. no-restricted-imports / no-restricted-properties for the architecture
//      rules — layering inside a module, Prisma only in repositories, Express
//      out of services, no cross-module reach-around, process.env only in
//      src/config.
//
// Why not eslint-plugin-boundaries: its dependency rules only fire between
// different elements (folders). Our layers are files inside one module folder,
// so it cannot see route -> repository at all. Verified, then dropped.
//
// Flat config REPLACES a rule entry rather than merging it, so every block that
// sets `no-restricted-imports` must repeat every pattern that applies there.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const PRISMA = {
  group: ['@prisma/client', '**/lib/prisma.js', '**/lib/prisma.ts'],
  message: 'Prisma is imported only by a module repository (architecture.md AD-2, PC-1).',
};

const HTTP = {
  group: ['express', 'express-*', 'cookie-parser', 'cors', 'helmet', '**/middleware/*'],
  message:
    'Services, repositories and schemas must not depend on Express or HTTP middleware (architecture.md AD-2).',
};

const CROSS_MODULE = {
  group: ['../*/*.repository.js', '../*/*.repository.ts', '../*/*.schemas.js'],
  message:
    "Cross-module access goes through the other module's service, never its repository or schemas (module-map.md).",
};

const NO_REPOSITORY = {
  group: ['./*.repository.js', './*.repository.ts'],
  message:
    'Routes and controllers never reach the repository directly — call the service (architecture.md AD-2).',
};

const NO_UPWARD = {
  group: ['./*.controller.js', './*.controller.ts', './*.routes.js', './*.routes.ts'],
  message: 'Dependencies point one way: routes -> controllers -> services -> repositories (AD-2).',
};

const NO_SERVICE = {
  group: ['./*.service.js', './*.service.ts'],
  message: 'A repository never calls a service (architecture.md AD-2).',
};

const NO_MODULES = {
  group: ['../modules/*', '../modules/*/*', '**/modules/*/*'],
  message: 'src/lib and src/config are leaves: they never import a feature module (module-map.md).',
};

const restrict = (...patterns) => ['error', { patterns }];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'prisma/migrations/**',
      'docs/**',
      '.claude/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        // tsconfig.typecheck.json is the program that covers src, tests and the
        // tooling configs; tsconfig.json is build-only and excludes tests.
        project: ['./tsconfig.typecheck.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Config files are plain JS and outside the TS program.
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  // ----------------------------------------------------------- src: all files
  {
    files: ['src/**/*.ts'],
    rules: {
      // SC-9: Pino only.
      'no-console': 'error',

      // AD-7: process.env is read only in src/config/env.ts.
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read configuration through src/config/env.ts, never process.env directly.',
        },
      ],

      // Function size/complexity — project policy, adjust the numbers here.
      complexity: ['error', 12],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 4],

      // Type-safety rules AGENTS.md calls out explicitly.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  // -------------------------------------------------- src: layering per layer
  {
    files: ['src/modules/*/*.routes.ts'],
    rules: { 'no-restricted-imports': restrict(PRISMA, NO_REPOSITORY, CROSS_MODULE) },
  },
  {
    files: ['src/modules/*/*.controller.ts'],
    rules: { 'no-restricted-imports': restrict(PRISMA, NO_REPOSITORY, CROSS_MODULE) },
  },
  {
    files: ['src/modules/*/*.service.ts'],
    rules: { 'no-restricted-imports': restrict(PRISMA, HTTP, NO_UPWARD, CROSS_MODULE) },
  },
  {
    files: ['src/modules/*/*.repository.ts'],
    rules: { 'no-restricted-imports': restrict(HTTP, NO_UPWARD, NO_SERVICE, CROSS_MODULE) },
  },
  {
    files: ['src/modules/*/*.schemas.ts'],
    rules: {
      'no-restricted-imports': restrict(PRISMA, HTTP, NO_UPWARD, NO_SERVICE, CROSS_MODULE),
    },
  },
  {
    files: ['src/lib/**/*.ts', 'src/config/**/*.ts'],
    rules: { 'no-restricted-imports': restrict(PRISMA, NO_MODULES) },
  },
  {
    files: ['src/middleware/**/*.ts', 'src/app.ts', 'src/server.ts'],
    rules: { 'no-restricted-imports': restrict(PRISMA) },
  },

  // The two files allowed to do what everyone else is banned from.
  {
    files: ['src/config/env.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['src/lib/prisma.ts'],
    rules: { 'no-restricted-imports': restrict(NO_MODULES) },
  },

  // ------------------------------------------------------------------- tests
  {
    files: ['**/*.test.ts', 'tests/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-restricted-properties': 'off',
      'no-restricted-imports': 'off',
    },
  },

  prettier,
);
