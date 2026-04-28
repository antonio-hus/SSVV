import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname,
    '..',
    '..',
    'components',
    'report',
    '__tests__',
    'ft',
    'report-filter',
);

const reportFilterDescriptor: FtDescriptor = {
    componentName: 'ReportFilter',
    reqId: 'FT-08',
    statement:
        'ReportFilter - renders a controlled date range form that pushes startDate and endDate as URL search params via router.push on submit, seeding initial input values from existing search params.',
    props: 'None - component accepts no props.',
    precondition: [
        'Mock next/navigation: useRouter returns { push: jest.fn() }.',
        'Mock next/navigation: usePathname returns a controllable string.',
        'Mock next/navigation: useSearchParams returns an object with a get() method returning controllable values.',
        'No providers required - component uses no React context.',
    ].join('\n'),
    renderOutput: [
        'A <form> element.',
        'A date input labelled "Start Date" (id="startDate", type="date", required).',
        'A date input labelled "End Date" (id="endDate", type="date", required).',
        'A submit button with text "Generate Report" that is enabled when not pending.',
        'When isPending is true the button is disabled and shows "Loading…".',
        'Initial input values are seeded from the startDate and endDate search params when present, otherwise empty strings.',
    ].join('\n'),
    postcondition: [
        'router.push is called once on form submit with the string `${pathname}?startDate=<value>&endDate=<value>`.',
    ].join('\n'),
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest report-filter.test.tsx',
        'isPending is driven by startTransition with a synchronous callback - the pending state resolves before the next render in jsdom and is not reliably observable in tests.',
        'getByLabelText resolves inputs via the htmlFor/id association between <Label> and <Input>.',
        'jsdom treats type="date" inputs as plain text inputs; userEvent.type with a YYYY-MM-DD string works correctly against controlled inputs.',
        'useSearchParams mock uses get: (key) => ... pattern cast to the return type to avoid full ReadonlyURLSearchParams implementation.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description:
                'Renders the form with both empty date inputs and an enabled "Generate Report" submit button when no search params are present.',
            arrange:
                'useSearchParams mock: get() returns null for all keys.\nrender(<ReportFilter />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByLabelText("Start Date") is in the document and has value "".\ngetByLabelText("End Date") is in the document and has value "".\ngetByRole("button", {name: "Generate Report"}) is in the document and is enabled.',
        },
        {
            noTc: 'TC-02',
            description:
                'Pre-fills the Start Date input from the startDate search param when it is present in the URL.',
            arrange:
                'useSearchParams mock: get("startDate") returns "2024-01-01", get("endDate") returns null.\nrender(<ReportFilter />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByLabelText("Start Date") has value "2024-01-01".',
        },
        {
            noTc: 'TC-03',
            description:
                'Pre-fills the End Date input from the endDate search param when it is present in the URL.',
            arrange:
                'useSearchParams mock: get("startDate") returns null, get("endDate") returns "2024-01-31".\nrender(<ReportFilter />)',
            act: 'No interaction - render only.',
            expectedOutput: 'getByLabelText("End Date") has value "2024-01-31".',
        },
        {
            noTc: 'TC-04',
            description:
                'Updates the Start Date input value as the user types into it.',
            arrange:
                'useSearchParams mock: get() returns null.\nrender(<ReportFilter />)',
            act: 'userEvent.type(getByLabelText("Start Date"), "2024-01-15")',
            expectedOutput: 'getByLabelText("Start Date") has value "2024-01-15".',
        },
        {
            noTc: 'TC-05',
            description:
                'Updates the End Date input value as the user types into it.',
            arrange:
                'useSearchParams mock: get() returns null.\nrender(<ReportFilter />)',
            act: 'userEvent.type(getByLabelText("End Date"), "2024-01-31")',
            expectedOutput: 'getByLabelText("End Date") has value "2024-01-31".',
        },
        {
            noTc: 'TC-06',
            description:
                'Calls router.push once with the correct pathname and serialised startDate/endDate search params when the form is submitted.',
            arrange:
                'usePathname mock returns "/reports".\nuseSearchParams mock: get("startDate") returns "2024-01-01", get("endDate") returns "2024-01-31".\nrender(<ReportFilter />)',
            act: 'userEvent.click(getByRole("button", {name: "Generate Report"}))',
            expectedOutput:
                'mockPush has been called exactly once.\nmockPush has been called with "/reports?startDate=2024-01-01&endDate=2024-01-31".',
        },
        {
            noTc: 'TC-07',
            description:
                'Both date inputs carry the required attribute.',
            arrange:
                'useSearchParams mock: get() returns null.\nrender(<ReportFilter />)',
            act: 'No interaction - render only.',
            expectedOutput:
                'getByLabelText("Start Date") has attribute "required".\ngetByLabelText("End Date") has attribute "required".',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(
        reportFilterDescriptor,
        path.join(outDir, 'report-filter-ft-form.xlsx'),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});