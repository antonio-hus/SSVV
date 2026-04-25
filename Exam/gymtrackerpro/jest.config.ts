import type {Config} from 'jest';
import nextJest from 'next/jest.js';

/**
 * Wraps Jest with Next.js defaults - handles TypeScript compilation, path
 * aliases, CSS/image mocks, and automatically loads `.env.test` during test
 * runs.
 *
 * @see https://nextjs.org/docs/app/building-your-application/testing/jest
 */
const createJestConfig = nextJest({dir: './'});

/**
 * Directories that should never be scanned for tests.
 *
 * - `prisma/` - contains seed scripts and migrations, not application tests.
 * - `node_modules/` - always excluded.
 */
const globalIgnorePatterns = [
    '<rootDir>/prisma/',
    '<rootDir>/node_modules/',
];

/**
 * Root Jest configuration.
 *
 * Unit and integration suites are separated at the **script level** rather than
 * the config level:
 *
 * ```bash
 * # Unit tests only - no Docker needed, runs in parallel
 * npm test
 *
 * # Integration tests only - requires Docker, always serial (-i)
 * npm run test:integration
 * ```
 * 
 * @see docker-compose.test.yml   for the test database setup
 * @see .env.test                 for the DATABASE_URL used by integration tests
 */
const config: Config = {
    testEnvironment: 'node',

    /**
     * Matches all test files under `__tests__/` regardless of nesting depth.
     * The npm scripts narrow this further using `--testPathPattern`:
     *   - `npm test` → excludes `integration/`
     *   - `npm run test:integration` → matches only `integration/`
     */
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx',
    ],

    /**
     * Keeps the `@/` alias in sync with `tsconfig.json` → `paths`.
     * Add any other aliases here if `tsconfig.json` is extended later.
     */
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    testPathIgnorePatterns: globalIgnorePatterns,
    modulePathIgnorePatterns: globalIgnorePatterns,
};

export default createJestConfig(config);