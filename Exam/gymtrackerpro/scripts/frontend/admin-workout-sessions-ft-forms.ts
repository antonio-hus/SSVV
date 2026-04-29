/**
 * admin-workout-sessions-ft-forms.ts
 *
 * FT form descriptors for the admin workout sessions route.
 * Run: npx tsx scripts/frontend/admin-workout-sessions-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const routeDir = path.resolve(__dirname, '..', '..', 'app', 'admin', 'workout-sessions');

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
        outFile: path.join(routeDir, 'new', '_components', '__tests__', 'ft', 'create-workout-session-form', 'create-workout-session-form-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'CreateWorkoutSessionForm',
            reqId: 'FT-39',
            statement: 'CreateWorkoutSessionForm - validates session metadata, builds exercise rows, calls createWorkoutSession, and redirects to the member detail page on success.',
            props: 'exercises: Exercise[] - selectable catalogue entries; members: MemberWithUser[] - selectable members; defaultMemberId?: string - optional preselected member.',
            precondition: 'Mock next/navigation useRouter as { push: jest.fn() }. Mock createWorkoutSession. Mock generated Prisma Role, MuscleGroup, and Equipment enums.',
            renderOutput: 'Member, Date, Duration, Notes fields; an Exercises section with one editable row; Add Exercise, Remove, and Create Session buttons.',
            postcondition: 'createWorkoutSession(valid session, parsed rows) is called once on valid submit; router.push(`/admin/members/${memberId}`) is called on success.',
            remarks: [
                'Run: npx jest create-workout-session-form.test.tsx --selectProjects jsdom',
                'Suite is kept in a single main describe block and covers metadata validation predicates, row mutation branches, server action outcomes, and pending UI state.',
                'The form uses noValidate so client schema validation, rather than browser constraint validation, is exercised in JSDOM.',
            ],
            tcRows: [
                tc('TC-01', 'Renders empty session fields and one initial exercise row.', 'render(<CreateWorkoutSessionForm exercises={exercises} members={members} />)', 'No interaction - render only.', 'Member/date empty, duration 60, Exercises heading visible, Create Session enabled, only Remove disabled.'),
                tc('TC-02', 'Prefills member select when defaultMemberId is supplied.', 'render with defaultMemberId="mem-1".', 'No interaction - render only.', 'Member select has value mem-1.'),
                tc('TC-03', 'Rejects an empty member and does not call create.', 'Fill a valid date while leaving Member empty.', 'userEvent.click(Create Session)', 'Validation failed and Member is required visible; createWorkoutSession not called.'),
                tc('TC-04', 'Rejects an empty date and does not call create.', 'Select member and leave Date empty.', 'userEvent.click(Create Session)', 'Validation failed and date format error visible; createWorkoutSession not called.'),
                tc('TC-05', 'Rejects duration below the lower bound and does not call create.', 'Select member, set valid date, and set duration -1.', 'userEvent.click(Create Session)', 'Duration minimum error visible; createWorkoutSession not called.'),
                tc('TC-06', 'Rejects duration above the upper bound and does not call create.', 'Select member, set valid date, and set duration 181.', 'userEvent.click(Create Session)', 'Validation failed and duration max error visible; createWorkoutSession not called.'),
                tc('TC-07', 'Rejects notes over the schema limit and does not call create.', 'Select member, set valid date, and set Notes to 1025 characters.', 'userEvent.click(Create Session)', 'Validation failed alert visible; createWorkoutSession not called.'),
                tc('TC-08', 'Adds a second exercise row and enables removal.', 'render form.', 'userEvent.click(Add Exercise)', 'Member select plus two exercise selects exist; two Remove buttons exist and the first is enabled.'),
                tc('TC-09', 'Removes the second exercise row and disables the remaining Remove button.', 'Add a second exercise row.', 'Click the second Remove button.', 'Member select plus one exercise select remain; the sole Remove button is disabled.'),
                tc('TC-10', 'Submits edited metadata and row values, then navigates to member detail.', 'createWorkoutSession resolves success; fill member/date, edit duration, notes, exercise, sets, reps, and weight.', 'userEvent.click(Create Session)', 'createWorkoutSession called with trimmed notes and numeric row values; router.push /admin/members/mem-1.'),
                tc('TC-11', 'Submits an added exercise row as a second parsed row.', 'createWorkoutSession resolves success; fill valid session, add second row, select exercise.', 'userEvent.click(Create Session)', 'createWorkoutSession receives two parsed exercise rows; router.push /admin/members/mem-1.'),
                tc('TC-12', 'Shows server error and does not navigate when create fails.', 'createWorkoutSession resolves failed result.', 'userEvent.click(Create Session)', 'Server error visible; Create Session enabled; create called once; router.push not called.'),
                tc('TC-13', 'Displays returned server field errors for editable metadata.', 'createWorkoutSession resolves failed result with memberId/date/duration errors.', 'userEvent.click(Create Session)', 'Validation failed alert and returned member/date/duration errors are visible; router.push not called.'),
                tc('TC-14', 'Disables submit control while create is pending.', 'createWorkoutSession returns an unresolved promise after valid input.', 'userEvent.click(Create Session)', 'Creating... button is disabled and Create Session text is absent until the promise resolves.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', 'edit', '_components', '__tests__', 'ft', 'edit-workout-session-form', 'edit-workout-session-form-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'EditWorkoutSessionForm',
            reqId: 'FT-40',
            statement: 'EditWorkoutSessionForm - edits session metadata and exercise rows, refreshes after successful update, and deletes sessions back to the member page.',
            props: 'session: WorkoutSessionWithExercises - existing values to prefill; exercises: Exercise[] - selectable catalogue entries; sessionId: string - ID passed to server actions.',
            precondition: 'Mock next/navigation useRouter as { push: jest.fn(), refresh: jest.fn() }. Mock updateWorkoutSessionWithExercises and deleteWorkoutSession. Mock generated Prisma enums.',
            renderOutput: 'Prefilled Date, Duration, Notes fields; exercise rows; Add Exercise, Save Changes, and Delete Session buttons.',
            postcondition: 'Successful update calls router.refresh(); successful delete calls router.refresh() and router.push(`/admin/members/${session.memberId}`).',
            remarks: [
                'Run: npx jest edit-workout-session-form.test.tsx --selectProjects jsdom',
                'Suite is kept in a single main describe block and covers metadata validation predicates, row mutation branches, server action outcomes, and pending UI state.',
                'The form uses noValidate so client schema validation, rather than browser constraint validation, is exercised in JSDOM.',
            ],
            tcRows: [
                tc('TC-01', 'Prefills fields and the existing exercise row.', 'render(<EditWorkoutSessionForm session={session} exercises={exercises} sessionId="session-1" />)', 'No interaction - render only.', 'Date, duration, notes, selected exercise, Save Changes enabled, and single Remove disabled.'),
                tc('TC-02', 'Prefills nullable notes as an empty string.', 'render form with session.notes null.', 'No interaction - render only.', 'Notes textarea value is empty.'),
                tc('TC-03', 'Rejects an empty date and does not call update.', 'Clear the Date input.', 'userEvent.click(Save Changes)', 'Validation failed and date format error visible; update action not called.'),
                tc('TC-04', 'Rejects duration below the lower bound and does not call update.', 'Set duration to -1.', 'userEvent.click(Save Changes)', 'Validation failed and duration minimum error visible; update action not called.'),
                tc('TC-05', 'Rejects duration above the upper bound and does not call update.', 'Clear duration and type 181.', 'userEvent.click(Save Changes)', 'Validation failed and duration max error visible; update action not called.'),
                tc('TC-06', 'Rejects notes over the schema limit and does not call update.', 'Type 1025 characters into Notes.', 'userEvent.click(Save Changes)', 'Validation failed alert visible; update action not called.'),
                tc('TC-07', 'Adds a second exercise row and enables removal.', 'render form.', 'userEvent.click(Add Exercise)', 'Two exercise selects and two Remove buttons exist; the first Remove is enabled.'),
                tc('TC-08', 'Removes the second exercise row and disables the remaining Remove button.', 'Add a second row.', 'Click the second Remove button.', 'One exercise select remains and the sole Remove button is disabled.'),
                tc('TC-09', 'Calls update action with edited metadata and parsed existing row, then refreshes.', 'update action resolves success; edit duration, notes, exercise, sets, reps, and weight.', 'userEvent.click(Save Changes)', 'Success alert visible; update action called with trimmed notes and numeric row values; refresh called once; push not called.'),
                tc('TC-10', 'Submits a newly added row without an existing row ID.', 'update action resolves success; add a row and select an exercise.', 'userEvent.click(Save Changes)', 'update action receives the original row plus a new parsed row with id undefined.'),
                tc('TC-11', 'Shows server error and does not refresh when update fails.', 'update action resolves failed result.', 'userEvent.click(Save Changes)', 'Server error visible; Save Changes enabled; refresh and push not called.'),
                tc('TC-12', 'Displays returned server field errors for editable metadata.', 'update action resolves failed result with date and duration errors.', 'userEvent.click(Save Changes)', 'Validation failed alert plus returned date and duration errors are visible; refresh not called.'),
                tc('TC-13', 'Deletes session, refreshes, and navigates to member detail.', 'delete action resolves success.', 'userEvent.click(Delete Session)', 'delete called with session-1; refresh called; router.push /admin/members/mem-1.'),
                tc('TC-14', 'Shows delete error and does not navigate or refresh when delete fails.', 'delete action resolves failed result.', 'userEvent.click(Delete Session)', 'Server error visible; delete called once; router.push and refresh not called.'),
                tc('TC-15', 'Disables save and delete controls while update is pending.', 'update action returns an unresolved promise.', 'userEvent.click(Save Changes)', 'Saving button is disabled, Delete Session is disabled, and Save Changes text is absent until the promise resolves.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'AdminWorkoutSessionsPage',
            reqId: 'FT-41',
            statement: 'AdminWorkoutSessionsPage - redirects the standalone workout sessions index route to the new session form.',
            props: 'None - the page accepts no props.',
            precondition: 'Mock next/navigation redirect as a jest.fn() that throws an error containing the target URL.',
            renderOutput: 'None - redirect terminates rendering.',
            postcondition: 'redirect("/admin/workout-sessions/new") is called once.',
            remarks: ['Run: npx jest app/admin/workout-sessions --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Redirects immediately to the new workout session page.', 'redirect mocked to throw REDIRECT:/admin/workout-sessions/new.', 'AdminWorkoutSessionsPage()', 'Thrown error contains target URL; redirect called once with /admin/workout-sessions/new.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, 'new', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'NewWorkoutSessionPage',
            reqId: 'FT-42',
            statement: 'NewWorkoutSessionPage - loads exercises and members, renders the creation form, and optionally preselects a member from the query string.',
            props: 'searchParams: Promise<{ memberId?: string }> - optional memberId query param.',
            precondition: 'Mock listExercises, listMembers, createWorkoutSession, and useRouter. Mock generated Prisma enums.',
            renderOutput: 'New Workout Session header, Back link, and CreateWorkoutSessionForm with loaded member/exercise options.',
            postcondition: 'listExercises({pageSize:200}) and listMembers({pageSize:200}) are called. Page-level submit is covered by CreateWorkoutSessionForm FT.',
            remarks: ['Run: npx jest app/admin/workout-sessions --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Loads lists and renders form with members back link when no memberId is supplied.', 'listExercises/listMembers resolve one item each; searchParams {}.', 'render(await NewWorkoutSessionPage(...))', 'Header, members Back href, empty member select, member/exercise options, and list calls asserted.'),
                tc('TC-02', 'Prefills member and scopes Back link when memberId is supplied.', 'searchParams resolves {memberId:"mem-1"}.', 'render page.', 'Back href /admin/members/mem-1; Member select value mem-1.'),
                tc('TC-03', 'Renders form with empty options when list actions fail.', 'listExercises and listMembers resolve failed results.', 'render page.', 'Header visible; member and exercise options are absent.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', 'edit', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'EditWorkoutSessionPage',
            reqId: 'FT-43',
            statement: 'EditWorkoutSessionPage - fetches a workout session and exercise catalogue, renders the edit form, or calls notFound when the session is missing.',
            props: 'params: Promise<{ id: string }> - route params containing session ID.',
            precondition: 'Mock getWorkoutSession, listExercises, updateWorkoutSessionWithExercises, deleteWorkoutSession, next/navigation notFound/useRouter, and generated Prisma enums.',
            renderOutput: 'Edit Session header, date description, Back to Member link, and prefilled EditWorkoutSessionForm.',
            postcondition: 'getWorkoutSession(id) and listExercises({pageSize:200}) are called; notFound() called when getWorkoutSession fails.',
            remarks: ['Run: npx jest app/admin/workout-sessions --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders edit header, back link, and prefilled form when session fetch succeeds.', 'getWorkoutSession and listExercises resolve success.', 'render(await EditWorkoutSessionPage(...))', 'Header, date description, Back to Member href, date field, Save Changes button, and calls asserted.'),
                tc('TC-02', 'Renders form with empty exercise options when exercise list fetch fails.', 'getWorkoutSession succeeds; listExercises fails.', 'render page.', 'Exercise combobox exists with empty value and no named exercise option.'),
                tc('TC-03', 'Calls notFound when getWorkoutSession fails.', 'getWorkoutSession resolves failed result.', 'await EditWorkoutSessionPage(...), catching thrown mock error.', 'notFound called once; getWorkoutSession called with missing-session.'),
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
