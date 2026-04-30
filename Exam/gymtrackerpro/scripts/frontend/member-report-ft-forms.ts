/**
 * member-report-ft-forms.ts
 *
 * FT form descriptors for the member report route.
 * Run: npx tsx scripts/frontend/member-report-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const routeDir = path.resolve(__dirname, '..', '..', 'app', 'member', 'report');

const tc = (noTc: string, description: string, arrange: string, act: string, expectedOutput: string): FtTcRow => ({
    noTc,
    description,
    arrange,
    act,
    expectedOutput,
    actualResult: 'Passed',
});

const descriptor: FtDescriptor = {
    componentName: 'MemberReportPage',
    reqId: 'FT-50',
    statement: 'MemberReportPage - reads the current member session and optional date range, then renders the progress report filter, report sections, or report error.',
    props: 'searchParams: Promise<{ startDate?: string; endDate?: string }> - route query params used to decide whether to fetch a report.',
    precondition: [
        'Mock getSession so the page can be rendered for a current member or a missing-member session.',
        'Mock getMemberProgressReport as jest.fn().',
        'Mock next/navigation useRouter, usePathname, and useSearchParams because ReportFilter is mounted by the page.',
        'Mock generated Prisma Role enum for jsdom compatibility.',
    ].join('\n'),
    renderOutput: [
        'When session.memberId exists, the page renders heading "My Progress Report", description "View your workout progress over time", and ReportFilter date inputs.',
        'When both startDate and endDate are supplied and the report fetch succeeds, report stats, exercise breakdown, and session details are rendered.',
        'When session.memberId is missing, the page returns null.',
    ].join('\n'),
    postcondition: [
        'getMemberProgressReport(session.memberId, startDate, endDate) is called only when both dates and memberId are present.',
        'The mocked report error message is rendered when getMemberProgressReport returns success: false.',
    ].join('\n'),
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest app/member/report --selectProjects jsdom',
    ],
    tcRows: [
        tc(
            'TC-01',
            'Renders nothing and does not fetch the report when session.memberId is missing.',
            'getSession resolves a member session with memberId null; searchParams resolves both startDate and endDate.',
            'render(await MemberReportPage({searchParams}))',
            'container.firstChild is null and getMemberProgressReport is not called.',
        ),
        tc(
            'TC-02',
            'Renders the page header and empty ReportFilter without fetching a report when no date range is supplied.',
            'getSession resolves memberId mem-1; useSearchParams returns empty URLSearchParams; searchParams resolves {}.',
            'render page.',
            'Heading "My Progress Report", description, empty Start Date and End Date inputs, enabled Generate Report button visible; getMemberProgressReport not called.',
        ),
        tc(
            'TC-03',
            'Keeps the start date seeded and does not fetch a report when only startDate is supplied.',
            'getSession resolves memberId mem-1; useSearchParams returns startDate=2026-01-01; searchParams resolves {startDate:"2026-01-01"}.',
            'render page.',
            'Start Date input has value 2026-01-01, End Date input has value "", and getMemberProgressReport is not called.',
        ),
        tc(
            'TC-04',
            'Keeps the end date seeded and does not fetch a report when only endDate is supplied.',
            'getSession resolves memberId mem-1; useSearchParams returns endDate=2026-01-31; searchParams resolves {endDate:"2026-01-31"}.',
            'render page.',
            'Start Date input has value "", End Date input has value 2026-01-31, and getMemberProgressReport is not called.',
        ),
        tc(
            'TC-05',
            'Fetches and renders report sections when both startDate and endDate are supplied.',
            'getSession resolves memberId mem-1; getMemberProgressReport resolves success with report data; searchParams resolves both dates.',
            'render page.',
            'Start Date and End Date inputs are seeded; Total Sessions, Total Volume "12,345 kg", Exercise Breakdown, Barbell Bench Press, and Session Details are visible; getMemberProgressReport called with mem-1 and the two dates.',
        ),
        tc(
            'TC-06',
            'Renders stats but omits optional detail sections when the successful report has empty breakdown and session arrays.',
            'getSession resolves memberId mem-1; getMemberProgressReport resolves success with totalSessions 0, totalVolume 0, averageSessionDuration 0, exerciseBreakdown [], and sessionDetails [].',
            'render page with both dates.',
            'Total Sessions and "0 kg" are visible; Exercise Breakdown and Session Details are absent; getMemberProgressReport called with mem-1 and the two dates.',
        ),
        tc(
            'TC-07',
            'Shows the returned report error when the date-range report fetch fails.',
            'getSession resolves memberId mem-1; getMemberProgressReport resolves {success:false,message:"Could not build report"}; searchParams resolves both dates.',
            'render page.',
            'Text "Could not build report" is visible; Total Sessions is absent; getMemberProgressReport called once with mem-1 and the two dates.',
        ),
    ],
};

async function main(): Promise<void> {
    await writeFt(descriptor, path.join(routeDir, '__tests__', 'ft', 'page', 'page-ft-form.xlsx'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
