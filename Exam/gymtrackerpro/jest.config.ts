import type {Config} from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    dir: './',
});

const config: Config = {
    testEnvironment: 'node',

    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.tsx',
    ],

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    testPathIgnorePatterns: [
        '<rootDir>/prisma/',
        '<rootDir>/node_modules/',
    ],

    modulePathIgnorePatterns: [
        '<rootDir>/prisma/',
    ],
};

export default createJestConfig(config);