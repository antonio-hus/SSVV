/**
 * pagination-ft-forms.ts
 *
 * FT form descriptors for Pagination.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(__dirname, '..', '..', 'components', 'layout', '__tests__', 'ft', 'pagination');

const paginationDescriptor: FtDescriptor = {
    componentName: 'Pagination',
    reqId: 'FT-04',
    statement: 'Pagination - renders a previous/next navigation bar with a page-of-total label, or returns null when the total fits on a single page.',
    props: [
        'page: number                      - required. Current 1-based page number.',
        'pageSize: number                  - required. Items shown per page.',
        'total: number                     - required. Total item count.',
        'baseUrl: string                   - required. Base URL for link href construction.',
        'searchParams?: Record<string,string> - optional. Extra query params preserved across pages. [default: {}]',
    ].join('\n'),
    precondition: [
        'Mock next/navigation for Link if required by the test environment.',
        'No React context providers required.',
        'No server actions - nothing to mock beyond Link internals.',
        'next/link must be importable; in Jest this typically requires a manual mock or jest config alias.',
    ].join('\n'),
    renderOutput: [
        'Returns null when Math.ceil(total / pageSize) <= 1.',
        'Otherwise renders:',
        '  A "Page X of Y" label.',
        '  A Previous link when page > 1.',
        '  A Next link when page < totalPages.',
        '  Neither link when page === 1 === totalPages (but that path returns null, so unreachable).',
        '  Only Next when page === 1 and totalPages > 1.',
        '  Only Previous when page === totalPages and totalPages > 1.',
        '  Both links when 1 < page < totalPages.',
    ].join('\n'),
    postcondition: 'None - no callbacks or side-effects; navigation is handled by Next.js Link via href.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest pagination.test.tsx',
        'Link renders as an <a> element in the Jest/RTL environment - assert via getByRole("link", {name: ...}).',
        'The "Previous" and "Next" spans are hidden on mobile (hidden sm:inline) but present in the DOM; RTL queries against the DOM so getByRole("link") works.',
        'totalPages <= 1 boundary: component returns null - container.firstChild will be null.',
        'totalPages === 2 boundary: exactly one prev and one next link exist simultaneously only on page 2 of 2 - only prev is shown.',
        'searchParams preservation is verified by inspecting the rendered href attribute.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Returns null (renders nothing) when all items fit on a single page.',
            arrange: 'render(<Pagination page={1} pageSize={10} total={5} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'container.firstChild is null.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Returns null when total equals pageSize exactly (boundary: exactly one full page).',
            arrange: 'render(<Pagination page={1} pageSize={10} total={10} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'container.firstChild is null.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Renders a "Page 1 of 3" label when on the first page of three.',
            arrange: 'render(<Pagination page={1} pageSize={10} total={25} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByText(/Page 1 of 3/) is in the document.',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-04',
            description: 'Renders only the Next link (no Previous) when on the first page.',
            arrange: 'render(<Pagination page={1} pageSize={10} total={25} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("link", {name: /next/i}) is in the document.',
                'queryByRole("link", {name: /previous/i}) returns null.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-05',
            description: 'Renders only the Previous link (no Next) when on the last page.',
            arrange: 'render(<Pagination page={3} pageSize={10} total={25} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("link", {name: /previous/i}) is in the document.',
                'queryByRole("link", {name: /next/i}) returns null.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-06',
            description: 'Renders both Previous and Next links when on a middle page.',
            arrange: 'render(<Pagination page={2} pageSize={10} total={25} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: [
                'getByRole("link", {name: /previous/i}) is in the document.',
                'getByRole("link", {name: /next/i}) is in the document.',
            ].join('\n'),
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-07',
            description: 'Previous link href points to page - 1.',
            arrange: 'render(<Pagination page={2} pageSize={10} total={25} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("link", {name: /previous/i}) has href containing "page=1".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-08',
            description: 'Next link href points to page + 1.',
            arrange: 'render(<Pagination page={2} pageSize={10} total={25} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("link", {name: /next/i}) has href containing "page=3".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-09',
            description: 'Preserves existing searchParams in the generated link hrefs.',
            arrange: 'render(<Pagination page={1} pageSize={10} total={25} baseUrl="/exercises" searchParams={{search: "squat"}} />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("link", {name: /next/i}) href contains "search=squat" and "page=2".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-10',
            description: 'Renders correctly with no searchParams prop supplied (default empty object).',
            arrange: 'render(<Pagination page={1} pageSize={10} total={25} baseUrl="/exercises" />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("link", {name: /next/i}) href contains "page=2" and does not throw.',
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(paginationDescriptor, path.join(outDir, 'pagination-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});