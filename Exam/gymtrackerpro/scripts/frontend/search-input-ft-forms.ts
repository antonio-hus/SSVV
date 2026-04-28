/**
 * search-input-ft-forms.ts
 *
 * FT form descriptors for SearchInput.
 * Run: npm run generate-ft-forms
 */

import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(__dirname, '..', '..', 'components', 'data', '__tests__', 'ft', 'search-input');

const searchInputDescriptor: FtDescriptor = {
    componentName: 'SearchInput',
    reqId: 'FT-05',
    statement: 'SearchInput - renders a controlled text input that syncs its value to a URL query parameter on change, removing the page param and applying an opacity class while the router transition is in flight.',
    props: [
        'placeholder?: string  - optional. Input placeholder text.  [default: "Search..."]',
        'paramName?: string    - optional. URL query param key.      [default: "search"]',
    ].join('\n'),
    precondition: [
        'Mock next/navigation:',
        '  useRouter returns { push: jest.fn() }.',
        '  usePathname returns "/exercises" (or any fixed pathname).',
        '  useSearchParams returns a URLSearchParams instance seeded with desired params.',
        'No additional providers required.',
        'No server actions - nothing else to mock.',
    ].join('\n'),
    renderOutput: [
        'A single <input> element with role="textbox".',
        'placeholder defaults to "Search..." when no placeholder prop is given.',
        'value initialises from searchParams.get(paramName) if present, otherwise empty string.',
        'className does not include "opacity-50" in the idle state.',
    ].join('\n'),
    postcondition: [
        'On each change: router.push() is called with the pathname and the updated query string.',
        'The updated query string includes the new search value under paramName.',
        'The updated query string does not include a "page" param (it is deleted on every change).',
        'When the input is cleared: paramName is removed from the query string entirely.',
        'A custom paramName replaces "search" as the query key.',
    ].join('\n'),
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest search-input.test.tsx',
        'useSearchParams must be mocked to return a real URLSearchParams instance so that .toString(), .get(), .set(), .delete() all work correctly.',
        'isPending from useTransition cannot be directly observed in RTL without React 19 async-transition support; test the opacity-50 class as the observable proxy for the pending state.',
        'The useEffect that syncs value from searchParams is tested via the mock returning a new URLSearchParams instance between renders.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description: 'Renders a text input with the default placeholder when no props are supplied.',
            arrange: [
                'mockUseSearchParams returns new URLSearchParams().',
                'render(<SearchInput />)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: 'getByRole("textbox") is in the document.\nInput has placeholder "Search...".\nInput value is "".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-02',
            description: 'Renders with a custom placeholder when the placeholder prop is supplied.',
            arrange: [
                'mockUseSearchParams returns new URLSearchParams().',
                'render(<SearchInput placeholder="Filter exercises..." />)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: 'Input has placeholder "Filter exercises...".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-03',
            description: 'Initialises the input value from the matching URL query parameter on first render.',
            arrange: [
                'mockUseSearchParams returns new URLSearchParams("search=deadlift").',
                'render(<SearchInput />)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: 'Input value is "deadlift".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-04',
            description: 'Calls router.push with the correct query string when the user types in the input.',
            arrange: [
                'mockUseSearchParams returns new URLSearchParams().',
                'mockPush is jest.fn().',
                'render(<SearchInput />)',
            ].join('\n'),
            act: 'userEvent.type(input, "squat")',
            expectedOutput: 'mockPush has been called.\nThe last call includes "search=squat" in the query string.\nThe pathname is "/exercises".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-05',
            description: 'Removes the page param from the query string on every keystroke.',
            arrange: [
                'mockUseSearchParams returns new URLSearchParams("search=bench&page=3").',
                'render(<SearchInput />)',
            ].join('\n'),
            act: 'userEvent.type(input, "x")',
            expectedOutput: 'The query string in the router.push call does not contain "page".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-06',
            description: 'Removes the search param from the query string when the input is cleared.',
            arrange: [
                'mockUseSearchParams returns new URLSearchParams("search=squat").',
                'render(<SearchInput />)',
            ].join('\n'),
            act: 'userEvent.clear(input)',
            expectedOutput: 'The query string in the router.push call does not contain "search".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-07',
            description: 'Uses a custom paramName as the query key when the paramName prop is supplied.',
            arrange: [
                'mockUseSearchParams returns new URLSearchParams().',
                'render(<SearchInput paramName="q" />)',
            ].join('\n'),
            act: 'userEvent.type(input, "press")',
            expectedOutput: 'The query string in the router.push call contains "q=press".\nIt does not contain "search=".',
            actualResult: 'Passed',
        },
        {
            noTc: 'TC-08',
            description: 'Initialises from a custom paramName when the matching query param is present in the URL.',
            arrange: [
                'mockUseSearchParams returns new URLSearchParams("q=lunge").',
                'render(<SearchInput paramName="q" />)',
            ].join('\n'),
            act: 'No interaction - render only.',
            expectedOutput: 'Input value is "lunge".',
            actualResult: 'Passed',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(searchInputDescriptor, path.join(outDir, 'search-input-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});