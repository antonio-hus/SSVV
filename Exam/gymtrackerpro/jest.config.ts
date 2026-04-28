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

const sharedConfig = {
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testPathIgnorePatterns: globalIgnorePatterns,
    modulePathIgnorePatterns: globalIgnorePatterns,
};

/**
 * Resolves the full Next.js config (transforms, CSS mocks, etc.) first, then
 * spreads it into each project so the transforms are present in every suite.
 *
 * - `node`  → bbt, wbt, it  (no DOM needed)
 * - `jsdom` → ft            (React components require a browser-like environment)
 */
async function buildConfig(): Promise<Config> {
    const nextConfig = await createJestConfig(sharedConfig)();

    return {
        projects: [
            {
                ...nextConfig,
                displayName: 'node',
                testEnvironment: 'node',
                testMatch: [
                    '**/__tests__/bbt/**/*.test.ts',
                    '**/__tests__/wbt/**/*.test.ts',
                    '**/__tests__/it/**/*.test.ts',
                ],
            },
            {
                ...nextConfig,
                displayName: 'jsdom',
                testEnvironment: 'jsdom',
                testMatch: [
                    '**/__tests__/ft/**/*.test.ts',
                    '**/__tests__/ft/**/*.test.tsx',
                ],
            },
        ],
    };
}

export default buildConfig();