import * as path from 'path';
import {writeFt, FtDescriptor} from '@/scripts/generate-ft-forms';

const outDir = path.resolve(
    __dirname,
    '..',
    '..',
    'components',
    'layout',
    '__tests__',
    'ft',
    'sidebar-nav',
);

const sidebarNavDescriptor: FtDescriptor = {
    componentName: 'SidebarNav',
    reqId: 'FT-06',
    statement:
        'SidebarNav — renders a semantic nav with a list of icon-and-label links; marks the link whose href the current pathname starts with as active with distinct styles.',
    props: [
        'items: NavItem[]  — required; array of { label: string; href: string; icon: LucideIcon } objects to render as navigation links',
        'ariaLabel?: string  — optional accessible label for the <nav> element  [default: "Navigation"]',
    ].join('\n'),
    precondition: [
        'Mock next/navigation: usePathname returns a controllable string.',
        'No other providers required — component uses no React context.',
    ].join('\n'),
    renderOutput: [
        'A <nav> element with role="navigation" and aria-label equal to the ariaLabel prop.',
        'A <ul> containing one <li> per item in the items array.',
        'Each <li> contains a Next.js <Link> rendered as an <a> with href and title matching the item.',
        'Each link contains a LucideIcon SVG and a <span> with the item label.',
        'The link whose href the current pathname starts with receives active styles (bg-blue-50 text-blue-700).',
        'All other links receive inactive styles (text-gray-600).',
    ].join('\n'),
    postcondition:
        'None — component is purely presentational with no server actions or callbacks.',
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    remarks: [
        'Run: npx jest sidebar-nav.test.tsx',
        'usePathname is mocked per test in the Arrange phase; beforeEach sets a safe default of "/other" so any test that omits a specific mock still receives a defined return value.',
        'Active/inactive distinction is asserted via CSS class names (bg-blue-50, text-gray-600) — these are the only externally observable markers; the component does not set aria-current.',
        'RTL ignores CSS so the label <span> (hidden md:inline) is always in the DOM; getByRole("link", {name}) resolves the accessible name from the span text content correctly.',
        'next/link renders as a plain <a> in the Jest environment; href attribute assertions are reliable.',
    ],
    tcRows: [
        {
            noTc: 'TC-01',
            description:
                'Renders a nav element with default aria-label "Navigation" and one link per item when ariaLabel is omitted.',
            arrange:
                'mockUsePathname.mockReturnValue("/other").\nrender(<SidebarNav items={mockItems} />) where mockItems has two entries: Home → /home, Settings → /settings.',
            act: 'No interaction — render only.',
            expectedOutput:
                'getByRole("navigation", {name: "Navigation"}) is in the document.\ngetByRole("link", {name: "Home"}) is in the document.\ngetByRole("link", {name: "Settings"}) is in the document.',
        },
        {
            noTc: 'TC-02',
            description:
                'Sets a custom aria-label on the nav element when the ariaLabel prop is provided.',
            arrange:
                'mockUsePathname.mockReturnValue("/other").\nrender(<SidebarNav items={mockItems} ariaLabel="Main navigation" />)',
            act: 'No interaction — render only.',
            expectedOutput:
                'getByRole("navigation", {name: "Main navigation"}) is in the document.',
        },
        {
            noTc: 'TC-03',
            description:
                'Applies active styles to the link whose href exactly matches the current pathname.',
            arrange:
                'mockUsePathname.mockReturnValue("/home").\nrender(<SidebarNav items={mockItems} />)',
            act: 'No interaction — render only.',
            expectedOutput:
                'getByRole("link", {name: "Home"}) has classes bg-blue-50 and text-blue-700.',
        },
        {
            noTc: 'TC-04',
            description:
                'Applies inactive styles and omits active styles from a link whose href does not match the pathname.',
            arrange:
                'mockUsePathname.mockReturnValue("/other").\nrender(<SidebarNav items={mockItems} />)',
            act: 'No interaction — render only.',
            expectedOutput:
                'getByRole("link", {name: "Home"}) has class text-gray-600.\nLink "Home" does not have class bg-blue-50.',
        },
        {
            noTc: 'TC-05',
            description:
                'Treats a link as active when the current pathname starts with the item href but is not an exact match (prefix matching via startsWith).',
            arrange:
                'mockUsePathname.mockReturnValue("/home/dashboard").\nrender(<SidebarNav items={mockItems} />)',
            act: 'No interaction — render only.',
            expectedOutput:
                'getByRole("link", {name: "Home"}) has classes bg-blue-50 and text-blue-700.',
        },
        {
            noTc: 'TC-06',
            description:
                'Renders the nav element with an empty list and no links when the items array is empty.',
            arrange:
                'mockUsePathname.mockReturnValue("/other").\nrender(<SidebarNav items={[]} />)',
            act: 'No interaction — render only.',
            expectedOutput:
                'getByRole("navigation") is in the document.\nqueryAllByRole("link") returns an empty array.',
        },
        {
            noTc: 'TC-07',
            description:
                'When multiple items are rendered and one pathname matches, only the matching item receives active styles and all others receive inactive styles.',
            arrange:
                'mockUsePathname.mockReturnValue("/settings").\nrender(<SidebarNav items={mockItems} />)',
            act: 'No interaction — render only.',
            expectedOutput:
                'Link "Settings" has classes bg-blue-50 and text-blue-700.\nLink "Home" does not have class bg-blue-50 and has class text-gray-600.',
        },
        {
            noTc: 'TC-08',
            description:
                'Each rendered link carries the correct href attribute matching the corresponding item object.',
            arrange:
                'mockUsePathname.mockReturnValue("/other").\nrender(<SidebarNav items={mockItems} />)',
            act: 'No interaction — render only.',
            expectedOutput:
                'Link "Home" has attribute href="/home".\nLink "Settings" has attribute href="/settings".',
        },
    ],
};

async function main(): Promise<void> {
    await writeFt(
        sidebarNavDescriptor,
        path.join(outDir, 'sidebar-nav-ft-form.xlsx'),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});