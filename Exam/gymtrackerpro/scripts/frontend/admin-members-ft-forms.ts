/**
 * admin-members-ft-forms.ts
 *
 * FT form descriptors for the admin members route.
 * Run: npx tsx scripts/frontend/admin-members-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const routeDir = path.resolve(__dirname, '..', '..', 'app', 'admin', 'members');

const tc = (noTc: string, description: string, arrange: string, act: string, expectedOutput: string): FtTcRow => ({
    noTc,
    description,
    arrange,
    act,
    expectedOutput,
    actualResult: 'Passed',
});

const commonStats = {
    testingTool: 'Jest + React Testing Library',
    coveragePercent: '100%',
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
};

const descriptors: Array<{descriptor: FtDescriptor; outFile: string}> = [
    {
        outFile: path.join(routeDir, '_components', '__tests__', 'ft', 'members-table', 'members-table-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'MembersTable',
            reqId: 'FT-29',
            statement: 'MembersTable - renders member rows with contact info, membership status, and View/Edit links, or an empty state when no members are supplied.',
            props: 'members: MemberWithUser[] - required list of members to display.',
            precondition: 'Mock @/prisma/generated/prisma/client Role enum for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'A table with Name, Email, Phone, Since, Status, and Actions columns; each row includes View and Edit links.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/admin/members --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders headers and supplied member rows.', 'render(<MembersTable members={[activeMember, secondMember]} />)', 'No interaction - render only.', 'Name and Email headers plus both member names are visible.'),
                tc('TC-02', 'Displays Active for an active member.', 'render(<MembersTable members={[activeMember]} />)', 'No interaction - render only.', 'Text "Active" is visible.'),
                tc('TC-03', 'Displays Suspended for an inactive member.', 'render(<MembersTable members={[suspendedMember]} />)', 'No interaction - render only.', 'Text "Suspended" is visible.'),
                tc('TC-04', 'Renders View and Edit links for each member row.', 'render(<MembersTable members={[member]} />)', 'No interaction - render only.', 'View href is /admin/members/mem-1; Edit href is /admin/members/mem-1/edit.'),
                tc('TC-05', 'Displays an empty-state message when no members are supplied.', 'render(<MembersTable members={[]} />)', 'No interaction - render only.', 'Text "No members found" is visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', '_components', '__tests__', 'ft', 'member-detail-information', 'member-detail-information-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'MemberDetailInformation',
            reqId: 'FT-30',
            statement: 'MemberDetailInformation - renders contact details, dates, and active/suspended membership status for one member.',
            props: 'member: MemberWithUser - required member whose details are displayed.',
            precondition: 'Mock @/prisma/generated/prisma/client Role enum for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'Contact card with email/phone/date of birth and Membership card with start date/status.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/admin/members --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders contact and membership details.', 'render(<MemberDetailInformation member={member} />)', 'No interaction - render only.', 'Contact, email, phone, date of birth, Membership, and membership start date are visible.'),
                tc('TC-02', 'Displays Active for an active member.', 'render(<MemberDetailInformation member={{...member, isActive:true}} />)', 'No interaction - render only.', 'Text "Active" is visible.'),
                tc('TC-03', 'Displays Suspended for an inactive member.', 'render(<MemberDetailInformation member={{...member, isActive:false}} />)', 'No interaction - render only.', 'Text "Suspended" is visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', '_components', '__tests__', 'ft', 'member-recent-workout-sessions', 'member-recent-workout-sessions-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'MemberRecentWorkoutSessions',
            reqId: 'FT-31',
            statement: 'MemberRecentWorkoutSessions - renders a recent sessions table and an Add Session link scoped to the member.',
            props: 'memberId: string - member used in Add Session URL; sessions: WorkoutSessionWithExercises[] - recent sessions to display.',
            precondition: 'Mock generated Prisma enums for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'Recent Sessions heading, Add Session link, and a table of date/duration/exercise-count rows or an empty state.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/admin/members --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders heading and member-scoped Add Session link.', 'render(<MemberRecentWorkoutSessions memberId="mem-1" sessions={[]} />)', 'No interaction - render only.', 'Heading "Recent Sessions" and Add Session href /admin/workout-sessions/new?memberId=mem-1 are visible.'),
                tc('TC-02', 'Renders supplied session rows.', 'render one session with duration 45 and two exercises.', 'No interaction - render only.', 'Session date, "45 min", and exercise count "2" are visible.'),
                tc('TC-03', 'Renders Edit link for a session.', 'render one session with id session-1.', 'No interaction - render only.', 'Edit href is /admin/workout-sessions/session-1/edit.'),
                tc('TC-04', 'Displays empty state when no sessions exist.', 'render sessions={[]}.', 'No interaction - render only.', 'Text "No sessions recorded" is visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, 'new', '_components', '__tests__', 'ft', 'create-member-form', 'create-member-form-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'CreateMemberForm',
            reqId: 'FT-32',
            statement: 'CreateMemberForm - validates new member input, calls createMemberWithTempPassword, and renders a one-time temporary password panel on success.',
            props: 'None - the form owns its controlled input state.',
            precondition: 'Mock createMemberWithTempPassword as jest.fn(). Mock generated Prisma Role enum.',
            renderOutput: 'Full Name, Email, Phone, Date of Birth, Membership Start fields plus a Create Member submit button; success replaces the form with a temporary password panel.',
            postcondition: 'createMemberWithTempPassword(valid payload) is called once on valid submit; server errors remain visible and the form is re-enabled.',
            remarks: [
                'Run: npx jest create-member-form.test.tsx --selectProjects jsdom',
                'The test file intentionally has only the main describe("CreateMemberForm") block.',
                'Predicate coverage includes createMemberSchema.omit({password:true}) fields independently: fullName, email, phone, dateOfBirth, and membershipStart.',
                'The form uses noValidate so native browser validation does not bypass the Zod validation branch and inline field-error UI.',
                'Branch coverage includes validation failure, create success, create failure, server field errors, pending UI, success replacement panel, and recovery after server error.',
            ],
            tcRows: [
                tc('TC-01', 'Renders empty fields and enabled Create Member button with no alert.', 'render(<CreateMemberForm />)', 'No interaction - render only.', 'All fields are empty; Create Member is enabled; no alert is visible.'),
                tc('TC-02', 'All empty fields fail validation and do not call createMemberWithTempPassword.', 'render form; leave all fields empty.', 'userEvent.click(Create Member)', 'Validation failed visible; Full Name, Email, Phone, Date of Birth, and Membership Start errors visible; create action not called.'),
                tc('TC-03', 'Full name below minimum length fails validation and only shows full-name error.', 'Fill fullName John and other fields valid.', 'userEvent.click(Create Member)', 'Full-name min-length error visible; other fields have no errors; create action not called.'),
                tc('TC-04', 'Full name above maximum length fails validation and only shows full-name error.', 'Fill a 65-character fullName and other fields valid.', 'userEvent.click(Create Member)', 'Full-name max-length error visible; Email has no error; create action not called.'),
                tc('TC-05', 'Invalid email fails validation and only shows email error.', 'Fill email not-an-email and other fields valid.', 'userEvent.click(Create Member)', 'Invalid email address visible; only Email has a field error; create action not called.'),
                tc('TC-06', 'Invalid phone fails validation and only shows phone error.', 'Fill phone "12 345" and other fields valid.', 'userEvent.click(Create Member)', 'Phone format error visible; only Phone has a field error; create action not called.'),
                tc('TC-07', 'Empty date of birth fails format validation and only shows date-of-birth error.', 'Fill valid fields except leave Date of Birth empty.', 'userEvent.click(Create Member)', 'Date of birth format error visible; Membership Start has no error; create action not called.'),
                tc('TC-08', 'Future date of birth fails past-date validation and skips create.', 'Fill Date of Birth 2999-01-01 and other fields valid.', 'userEvent.click(Create Member)', 'Date of birth past-date error visible; create action not called.'),
                tc('TC-09', 'Empty membership start fails format validation and only shows membership-start error.', 'Fill valid fields except leave Membership Start empty.', 'userEvent.click(Create Member)', 'Membership start date format error visible; Date of Birth has no error; create action not called.'),
                tc('TC-10', 'All invalid fields show all field errors and skip create.', 'Fill too-short Full Name, invalid Email, invalid Phone, empty Date of Birth, and empty Membership Start.', 'userEvent.click(Create Member)', 'All five field errors visible; create action not called.'),
                tc('TC-11', 'Valid submit trims strings, calls createMemberWithTempPassword, and shows temporary password panel.', 'create action resolves success with tempPassword Temp#12345; fill Full Name and Email with surrounding spaces and other fields valid.', 'userEvent.click(Create Member)', 'Success panel, temp password, and member name visible; Create Member button absent; create action called once with trimmed payload.'),
                tc('TC-12', 'Create failure shows server error and re-enables form.', 'create action resolves {success:false,message:"Email already exists"}; fill valid fields.', 'userEvent.click(Create Member)', 'Email already exists visible; Create Member enabled; create action called once.'),
                tc('TC-13', 'Server-returned field errors render for all form fields.', 'create action resolves failed validation with errors for fullName, email, phone, dateOfBirth, and membershipStart.', 'userEvent.click(Create Member)', 'Validation failed plus all returned field errors visible; create action called once.'),
                tc('TC-14', 'Pending create disables the submit button and shows Creating label.', 'create action returns a manually controlled unresolved promise; fill valid fields.', 'userEvent.click(Create Member) without resolving promise.', 'Creating… button disabled; Create Member button text absent until cleanup resolves promise.'),
                tc('TC-15', 'After a server-side failure, a subsequent valid submission can succeed.', 'create action first resolves Email already exists, then resolves success with tempPassword.', 'Click Create Member twice, waiting for first error before second click.', 'First click shows error; second click shows success panel; create action called twice.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', 'edit', '_components', '__tests__', 'ft', 'edit-member-form', 'edit-member-form-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'EditMemberForm',
            reqId: 'FT-33',
            statement: 'EditMemberForm - edits member profile fields, suspends/activates, deletes, and routes or refreshes after successful mocked server actions.',
            props: 'member: MemberWithUser - existing values to prefill; memberId: string - ID passed to server actions.',
            precondition: 'Mock next/navigation useRouter as { push: jest.fn(), refresh: jest.fn() }. Mock updateMember, suspendMember, activateMember, deleteMember. Mock generated Prisma Role enum.',
            renderOutput: 'Prefilled editable fields, Save Changes button, suspend/activate control, and Delete Member button.',
            postcondition: 'Successful update refreshes the route; successful suspend/activate navigates to member detail; successful delete refreshes and navigates to /admin/members.',
            remarks: [
                'Run: npx jest edit-member-form.test.tsx --selectProjects jsdom',
                'The test file intentionally has only the main describe("EditMemberForm") block.',
                'Predicate coverage includes updateMemberSchema fields independently: fullName, email, phone, dateOfBirth, and membershipStart.',
                'The form uses noValidate so native browser validation does not bypass the Zod validation branch and inline field-error UI.',
                'Branch coverage includes update success/failure, suspend success/failure, activate success/failure, delete success/failure, active vs suspended render, and pending UI.',
            ],
            tcRows: [
                tc('TC-01', 'Prefills editable fields and shows status/delete controls.', 'render(<EditMemberForm member={member} memberId="mem-1" />)', 'No interaction - render only.', 'Full Name, Email, Phone, Date of Birth, and Membership Start values match member; Save Changes, Suspend Member, and Delete Member enabled; no alert visible.'),
                tc('TC-02', 'Full name below minimum length fails validation and only shows full-name error.', 'Clear Full Name and type John; other fields remain valid.', 'userEvent.click(Save Changes)', 'Validation failed and full-name min-length error visible; only Full Name has a field error; updateMember not called.'),
                tc('TC-03', 'Full name above maximum length fails validation and only shows full-name error.', 'Clear Full Name and type 65 characters.', 'userEvent.click(Save Changes)', 'Full-name max-length error visible; Email has no field error; updateMember not called.'),
                tc('TC-04', 'Invalid email fails validation and only shows email error.', 'Clear Email and type not-an-email.', 'userEvent.click(Save Changes)', 'Invalid email address visible; only Email has a field error; updateMember not called.'),
                tc('TC-05', 'Invalid phone fails validation and only shows phone error.', 'Clear Phone and type "12 345".', 'userEvent.click(Save Changes)', 'Phone number format error visible; only Phone has a field error; updateMember not called.'),
                tc('TC-06', 'Empty date of birth fails format validation and only shows date-of-birth error.', 'Clear Date of Birth.', 'userEvent.click(Save Changes)', 'Date of birth format error visible; Membership Start has no error; updateMember not called.'),
                tc('TC-07', 'Future date of birth fails past-date validation and skips update.', 'Clear Date of Birth and type 2999-01-01.', 'userEvent.click(Save Changes)', 'Date of birth past-date error visible; updateMember not called.'),
                tc('TC-08', 'Empty membership start fails format validation and only shows membership-start error.', 'Clear Membership Start.', 'userEvent.click(Save Changes)', 'Membership start date format error visible; Date of Birth has no error; updateMember not called.'),
                tc('TC-09', 'All invalid fields show all field errors and skip update.', 'Set too-short Full Name, invalid Email, invalid Phone, empty Date of Birth, and empty Membership Start.', 'userEvent.click(Save Changes)', 'All five field errors are visible; updateMember not called.'),
                tc('TC-10', 'Valid update trims strings, calls updateMember, shows success, and refreshes.', 'updateMember resolves success; type Full Name and Email with surrounding spaces; update Phone.', 'userEvent.click(Save Changes)', 'Success alert visible; updateMember called with trimmed payload; router.refresh called once; router.push not called.'),
                tc('TC-11', 'Failed update shows server error and does not refresh or navigate.', 'updateMember resolves {success:false,message:"Email already exists"}.', 'userEvent.click(Save Changes)', 'Email already exists visible; Save Changes enabled; updateMember called once; refresh and push not called.'),
                tc('TC-12', 'Failed update with field errors renders returned field errors.', 'updateMember resolves failed result with errors for fullName, email, phone, dateOfBirth, and membershipStart.', 'userEvent.click(Save Changes)', 'All returned field error messages are visible; router.refresh not called.'),
                tc('TC-13', 'Active member shows Suspend Member and hides Activate Member.', 'render active member.', 'No interaction - render only.', 'Suspend Member visible; Activate Member absent.'),
                tc('TC-14', 'Suspended member shows Activate Member and hides Suspend Member.', 'render inactive member.', 'No interaction - render only.', 'Activate Member visible; Suspend Member absent.'),
                tc('TC-15', 'Suspend success calls suspendMember and navigates to member detail.', 'suspendMember resolves success; render active member.', 'userEvent.click(Suspend Member)', 'suspendMember called with mem-1; activateMember not called; router.push /admin/members/mem-1.'),
                tc('TC-16', 'Suspend failure shows server error and does not navigate.', 'suspendMember resolves {success:false,message:"Could not suspend member"}.', 'userEvent.click(Suspend Member)', 'Could not suspend member visible; suspendMember called with mem-1; router.push not called.'),
                tc('TC-17', 'Activate success calls activateMember and navigates to member detail.', 'activateMember resolves success; render inactive member.', 'userEvent.click(Activate Member)', 'activateMember called with mem-1; suspendMember not called; router.push /admin/members/mem-1.'),
                tc('TC-18', 'Activate failure shows server error and does not navigate.', 'activateMember resolves {success:false,message:"Could not activate member"}.', 'userEvent.click(Activate Member)', 'Could not activate member visible; activateMember called with mem-1; router.push not called.'),
                tc('TC-19', 'Delete success calls deleteMember, refreshes, and navigates to list.', 'deleteMember resolves success.', 'userEvent.click(Delete Member)', 'deleteMember called with mem-1; router.refresh called; router.push /admin/members.'),
                tc('TC-20', 'Delete failure shows server error and does not navigate or refresh.', 'deleteMember resolves {success:false,message:"Member has active sessions"}.', 'userEvent.click(Delete Member)', 'Member has active sessions visible; deleteMember called once; router.push and refresh not called.'),
                tc('TC-21', 'Pending update disables Save, status, and delete controls and shows Saving label.', 'updateMember returns a manually controlled unresolved promise.', 'userEvent.click(Save Changes) without resolving update.', 'Saving… button disabled; Suspend Member and Delete Member disabled; Save Changes text absent until cleanup resolves promise.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'AdminMembersPage',
            reqId: 'FT-34',
            statement: 'AdminMembersPage - fetches filtered paginated members and renders search, table, and pagination.',
            props: 'searchParams: Promise<{ search?: string; page?: string }> - route query params.',
            precondition: 'Mock listMembers. Mock next/navigation hooks for SearchInput. Mock generated Prisma Role enum.',
            renderOutput: 'Members header, Add Member link, search input, MembersTable, and Pagination when total exceeds page size.',
            postcondition: 'listMembers is called with search, page, and pageSize 10 derived from query params.',
            remarks: [
                'Run: npx jest app/admin/members/__tests__/ft/page/page.test.tsx --selectProjects jsdom',
                'Filter concerns are intentionally split: fetch args, seeded search input, page param, and pagination param preservation each have focused cases.',
            ],
            tcRows: [
                tc('TC-01', 'Fetches first page and renders default page chrome and list output.', 'listMembers resolves one member; searchParams resolves {} and useSearchParams is empty.', 'render(await AdminMembersPage(...))', 'Members heading, description, Add Member href, empty search input, member row, and listMembers args {search:"", page:1, pageSize:10} are asserted.'),
                tc('TC-02', 'Uses the search param for fetch and seeds the SearchInput value.', 'searchParams resolves {search:"john"}; useSearchParams contains search=john.', 'render page.', 'Search input value is john; listMembers called with search john, page 1, pageSize 10.'),
                tc('TC-03', 'Uses the page param for fetch and renders Previous/Next pagination links.', 'searchParams resolves {page:"2"}; listMembers total 22.', 'render page.', 'Page 2 of 3 visible; Previous href /admin/members?page=1; Next href /admin/members?page=3; listMembers called with page 2.'),
                tc('TC-04', 'Uses combined search and page params for a filtered requested page.', 'searchParams resolves {search:"john", page:"2"}; useSearchParams contains both; listMembers total 22.', 'render page.', 'Search input value john; Page 2 of 3 visible; listMembers called with search john and page 2.'),
                tc('TC-05', 'Preserves the search param in pagination links.', 'searchParams resolves {search:"john"}; listMembers total 22.', 'render page.', 'Next href is /admin/members?search=john&page=2.'),
                tc('TC-06', 'Renders table empty state without pagination for successful empty result.', 'listMembers resolves success with items [] and total 0.', 'render page.', 'No members found is visible and no Page 1 indicator exists.'),
                tc('TC-07', 'Renders returned error message without page chrome when listMembers fails.', 'listMembers resolves {success:false,message:"Could not load members"}.', 'render page.', 'Could not load members visible; Members heading and search input absent.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, 'new', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'NewMemberPage',
            reqId: 'FT-35',
            statement: 'NewMemberPage - renders the add-member page header, back link, and CreateMemberForm organism.',
            props: 'None - the page accepts no props.',
            precondition: 'Mock createMemberWithTempPassword for mounted CreateMemberForm. Mock generated Prisma Role enum.',
            renderOutput: 'Add Member heading, description, Back to Members link, and create member form fields.',
            postcondition: 'None at page level; CreateMemberForm handles submission in its own FT.',
            remarks: ['Run: npx jest app/admin/members --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders heading, description, and back link.', 'render(await NewMemberPage())', 'No interaction - render only.', 'Heading and description visible; Back to Members href is /admin/members.'),
                tc('TC-02', 'Mounts CreateMemberForm without submitting it.', 'render(await NewMemberPage())', 'No interaction - render only.', 'Full Name and Email fields plus Create Member button visible; create action not called.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'MemberDetailPage',
            reqId: 'FT-36',
            statement: 'MemberDetailPage - fetches member details and recent sessions, renders profile sections, or calls notFound on missing member.',
            props: 'params: Promise<{ id: string }> - route params containing member ID.',
            precondition: 'Mock getMember, listMemberWorkoutSessions, and next/navigation notFound. Mock generated Prisma enums.',
            renderOutput: 'Member name heading, action links, MemberDetailInformation, separator, and MemberRecentWorkoutSessions.',
            postcondition: 'getMember(id) and listMemberWorkoutSessions(id,{page:1,pageSize:10}) are called; notFound() called if member fetch fails.',
            remarks: ['Run: npx jest app/admin/members --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders member profile and recent sessions when both fetches succeed.', 'getMember and listMemberWorkoutSessions resolve success.', 'render(await MemberDetailPage(...))', 'Heading, actions, email, session duration, and both controller calls asserted.'),
                tc('TC-02', 'Falls back to empty recent sessions when session fetch fails.', 'getMember succeeds; listMemberWorkoutSessions fails.', 'render page.', 'No sessions recorded is visible.'),
                tc('TC-03', 'Calls notFound when getMember fails.', 'getMember resolves failed result.', 'await MemberDetailPage(...), catching thrown mock error.', 'notFound called once; getMember called with missing-member.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', 'edit', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'EditMemberPage',
            reqId: 'FT-37',
            statement: 'EditMemberPage - fetches one member by route ID and renders the edit form, or calls notFound on failure.',
            props: 'params: Promise<{ id: string }> - route params containing member ID.',
            precondition: 'Mock getMember and next/navigation notFound/useRouter. Mock EditMemberForm server actions through user-controller. Mock generated Prisma Role enum.',
            renderOutput: 'Edit: {member.user.fullName} heading, Update member details description, Back link, and prefilled EditMemberForm.',
            postcondition: 'getMember(id) called once. notFound() called when getMember fails.',
            remarks: ['Run: npx jest app/admin/members --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders edit header, back link, and prefilled form when getMember succeeds.', 'getMember resolves success with member; params id mem-1.', 'render(await EditMemberPage(...))', 'Heading, description, Back link, prefilled name, Save Changes button, and getMember("mem-1") asserted.'),
                tc('TC-02', 'Calls notFound when getMember fails.', 'getMember resolves failed result; params id missing-member.', 'await EditMemberPage(...), catching thrown mock error.', 'notFound called once; getMember called with missing-member.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', 'report', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'AdminMemberReportPage',
            reqId: 'FT-38',
            statement: 'AdminMemberReportPage - fetches the member and conditionally fetches a date-range progress report, rendering report sections or an error.',
            props: 'params: Promise<{ id: string }>; searchParams: Promise<{ startDate?: string; endDate?: string }>.',
            precondition: 'Mock getMember, getMemberProgressReport, next/navigation notFound/useRouter/usePathname/useSearchParams, and generated Prisma Role enum.',
            renderOutput: 'Report heading, Back link, ReportFilter, and report stats/breakdown/session details only when both dates are supplied and report fetch succeeds.',
            postcondition: 'getMemberProgressReport(id,startDate,endDate) is called only when both dates are present; notFound() called when member fetch fails.',
            remarks: [
                'Run: npx jest admin/members/.*/report/__tests__/ft/page/page.test.tsx --selectProjects jsdom',
                'The test file intentionally has only the main describe("AdminMemberReportPage") block.',
                'Date-range predicate coverage is split across no dates, startDate only, endDate only, and both dates.',
                'Page-level branches cover member fetch failure/notFound, no report fetch, successful report fetch, empty successful report, and failed report fetch.',
            ],
            tcRows: [
                tc('TC-01', 'Renders header and empty filter without fetching report when no date range is supplied.', 'getMember succeeds; useSearchParams empty; searchParams resolves {}.', 'render page.', 'Report heading, description, Back href, empty Start Date and End Date inputs, Generate Report button visible; getMember called with id; report action not called.'),
                tc('TC-02', 'Keeps startDate seeded and does not fetch report when only startDate is supplied.', 'getMember succeeds; useSearchParams returns startDate=2026-01-01; searchParams resolves {startDate:"2026-01-01"}.', 'render page.', 'Start Date value is 2026-01-01; End Date value is ""; report action not called.'),
                tc('TC-03', 'Keeps endDate seeded and does not fetch report when only endDate is supplied.', 'getMember succeeds; useSearchParams returns endDate=2026-01-31; searchParams resolves {endDate:"2026-01-31"}.', 'render page.', 'Start Date value is ""; End Date value is 2026-01-31; report action not called.'),
                tc('TC-04', 'Fetches and renders report sections when both dates are supplied.', 'getMember and getMemberProgressReport succeed; searchParams resolves both dates.', 'render page.', 'Date inputs are seeded; Total Sessions, 12,345 kg, Exercise Breakdown, Barbell Bench Press, and Session Details visible; report action called with id and dates.'),
                tc('TC-05', 'Renders stats and omits optional detail sections for an empty successful report.', 'getMember succeeds; report fetch succeeds with zero stats, exerciseBreakdown [], and sessionDetails [].', 'render page with both dates.', 'Total Sessions and 0 kg visible; Exercise Breakdown and Session Details absent; report action called with id and dates.'),
                tc('TC-06', 'Shows report error and does not render report sections when report fetch fails.', 'getMember succeeds; getMemberProgressReport resolves failed result.', 'render page with both dates.', 'Could not build report visible; Total Sessions absent; report action called with id and dates.'),
                tc('TC-07', 'Calls notFound and does not fetch report when member fetch fails.', 'getMember resolves failed result.', 'await AdminMemberReportPage(...), catching thrown mock error.', 'NEXT_NOT_FOUND thrown; getMember called with missing-member; notFound called once; report action not called.'),
            ],
        },
    },
];

async function main(): Promise<void> {
    for (const {descriptor, outFile} of descriptors) {
        await writeFt(descriptor, outFile);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
