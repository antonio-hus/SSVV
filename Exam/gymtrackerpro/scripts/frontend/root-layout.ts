import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname,
    '..',
    '..',
    'app',
    '__tests__',
    'ft',
    'layout',
);

const rootLayoutDescriptor: FtDescriptor = {
    componentName: 'RootLayout',
    reqId: 'FT-12',
    statement:
        'RootLayout - renders the root HTML shell with lang="en", applies the Inter font CSS variable class to the html element, and renders children inside the body.',
    props: 'children: React.ReactNode  - required; page content rendered inside <body>.',
    precondition: [
        'Mock next/font/google: Inter returns { variable: "mock-inter-variable" } so the CSS variable class is predictable in assertions.',
        'No navigation mocks or providers required.',
    ].join('\n'),
    renderOutput: [
        'An <html> element with lang="en" and className containing the font variable.',
        'A <body> element inside the html element.',
        'The children prop rendered inside the body.',
    ].join('\n'),
    postcondition: 'None - component is purely structural with no side effects.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest layout.test.tsx',
        'next/font/google must be mocked - font loading is unavailable in jsdom.',
        'RTL renders the component output inside a container div appended to document.body; the <html> element rendered by the component is therefore a child of that container, not document.documentElement. Use container.querySelector("html") to reach it.',
        'RootLayout is a default export; import accordingly.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description:
                'Renders children inside the body element.',
            arrange: 'render(<RootLayout><p>child content</p></RootLayout>)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByText("child content") is in the document.',
        },
        {
            noTc: 'TC-02',
            description:
                'The html element has the lang attribute set to "en".',
            arrange: 'const { container } = render(<RootLayout><p>child content</p></RootLayout>)',
            act: 'No interaction - render only.',
            expectedOutput: 'container.querySelector("html") has attribute lang="en".',
        },
        {
            noTc: 'TC-03',
            description:
                'The html element has the font CSS variable class from the Inter mock applied as a className.',
            arrange:
                'Inter mock returns { variable: "mock-inter-variable" }.\nconst { container } = render(<RootLayout><p>child content</p></RootLayout>)',
            act: 'No interaction - render only.',
            expectedOutput: 'container.querySelector("html") has class "mock-inter-variable".',
        },
    ],
};

const rootLayoutMetadataDescriptor: FtDescriptor = {
    componentName: 'RootLayoutMetadata',
    reqId: 'FT-13',
    statement:
        'RootLayoutMetadata - the named metadata export from layout.tsx carries the correct Next.js document title and description for the application.',
    props: 'None - metadata is a plain exported constant, not a component.',
    precondition: 'None - asserting directly on the imported object requires no mocks or providers.',
    renderOutput: 'Not applicable - metadata is not a rendered component.',
    postcondition: 'None - metadata is a static constant with no side effects.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest layout.test.tsx',
        'No rendering involved - tests import the named metadata export and assert on it as a plain object.',
        'next/font/google is still mocked at the file level because the module executes Inter() at import time.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'The metadata title equals "GymTracker Pro".',
            arrange: 'Import { metadata } from "../layout".',
            act: 'No interaction - import only.',
            expectedOutput: 'metadata.title equals "GymTracker Pro".',
        },
        {
            noTc: 'TC-02',
            description:
                'The metadata description equals "Gym management and workout tracking platform".',
            arrange: 'Import { metadata } from "../layout".',
            act: 'No interaction - import only.',
            expectedOutput:
                'metadata.description equals "Gym management and workout tracking platform".',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(
        rootLayoutDescriptor,
        path.join(outDir, 'layout-ft-form.xlsx'),
    );
    await writeFt(
        rootLayoutMetadataDescriptor,
        path.join(outDir, 'metadata-ft-form.xlsx'),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});