/**
 * admin-exercises-ft-forms.ts
 *
 * FT form descriptors for the admin exercises route.
 * Run: npx tsx scripts/frontend/admin-exercises-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const routeDir = path.resolve(__dirname, '..', '..', 'app', 'admin', 'exercises');

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
        outFile: path.join(routeDir, '_components', '__tests__', 'ft', 'exercises-table', 'exercises-table-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'ExercisesTable',
            reqId: 'FT-21',
            statement: 'ExercisesTable - renders exercise rows with classification, archive status, and View/Edit links, or an empty state when no rows are supplied.',
            props: 'exercises: Exercise[] - required list of catalogue exercises to display.',
            precondition: 'Mock @/prisma/generated/prisma/client enums for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'A table with Name, Muscle Group, Equipment, Status, and Actions columns; each row includes View and Edit links.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/admin/exercises --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders headers and supplied exercise rows.', 'render(<ExercisesTable exercises={[activeExercise, archivedExercise]} />)', 'No interaction - render only.', 'Name and Muscle Group column headers are present; both exercise names are visible.'),
                tc('TC-02', 'Displays Active for an active exercise.', 'render(<ExercisesTable exercises={[activeExercise]} />)', 'No interaction - render only.', 'Text "Active" is visible.'),
                tc('TC-03', 'Displays Archived for an inactive exercise.', 'render(<ExercisesTable exercises={[archivedExercise]} />)', 'No interaction - render only.', 'Text "Archived" is visible.'),
                tc('TC-04', 'Renders View and Edit links for each exercise row.', 'render(<ExercisesTable exercises={[activeExercise]} />)', 'No interaction - render only.', 'View has href "/admin/exercises/ex-1"; Edit has href "/admin/exercises/ex-1/edit".'),
                tc('TC-05', 'Displays an empty-state message when no exercises are supplied.', 'render(<ExercisesTable exercises={[]} />)', 'No interaction - render only.', 'Text "No exercises found" is visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', '_components', '__tests__', 'ft', 'exercise-detail-information', 'exercise-detail-information-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'ExerciseDetailInformation',
            reqId: 'FT-22',
            statement: 'ExerciseDetailInformation - renders classification, availability, and optional description cards for one exercise.',
            props: 'exercise: Exercise - required exercise whose details are displayed.',
            precondition: 'Mock @/prisma/generated/prisma/client enums for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'Classification card, Availability card, and a Description card only when exercise.description is truthy.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/admin/exercises --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders classification and availability data.', 'render(<ExerciseDetailInformation exercise={exercise} />)', 'No interaction - render only.', 'Classification, Muscle Group, CHEST, Equipment, BARBELL, and Availability are visible.'),
                tc('TC-02', 'Displays Active for an active exercise.', 'render(<ExerciseDetailInformation exercise={{...exercise, isActive: true}} />)', 'No interaction - render only.', 'Text "Active" is visible.'),
                tc('TC-03', 'Displays Archived for an inactive exercise.', 'render(<ExerciseDetailInformation exercise={{...exercise, isActive: false}} />)', 'No interaction - render only.', 'Text "Archived" is visible.'),
                tc('TC-04', 'Shows the description card when description is provided.', 'render(<ExerciseDetailInformation exercise={{...exercise, description: "Controlled tempo."}} />)', 'No interaction - render only.', 'Description heading and "Controlled tempo." are visible.'),
                tc('TC-05', 'Hides the description card when description is null.', 'render(<ExerciseDetailInformation exercise={{...exercise, description: null}} />)', 'No interaction - render only.', 'queryByText("Description") returns null.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, 'new', '_components', '__tests__', 'ft', 'create-exercise-form', 'create-exercise-form-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'CreateExerciseForm',
            reqId: 'FT-23',
            statement: 'CreateExerciseForm - validates new exercise input, calls createExercise, and redirects to the exercises list on success.',
            props: 'None - the form owns its controlled input state.',
            precondition: 'Mock next/navigation useRouter as { push: jest.fn() }. Mock createExercise as jest.fn(). Mock generated Prisma enums.',
            renderOutput: 'Name, Description, Muscle Group, and Equipment fields plus a Create Exercise submit button.',
            postcondition: 'createExercise(valid payload) is called once on valid submit; router.push("/admin/exercises") is called only on success.',
            remarks: [
                'Run: npx jest create-exercise-form.test.tsx --selectProjects jsdom',
            ],
            tcRows: [
                tc('TC-01', 'Renders empty fields and enabled submit button with no alert.', 'render(<CreateExerciseForm />)', 'No interaction - render only.', 'Name, Description, Muscle Group, and Equipment values are empty; Create Exercise is enabled; no alert is visible.'),
                tc('TC-02', 'All empty required fields fail validation and do not call createExercise.', 'render form; leave all inputs/selects empty.', 'userEvent.click(Create Exercise)', 'Validation failed visible; Name, Muscle Group, and Equipment field errors visible; Description has no error; createExercise not called.'),
                tc('TC-03', 'Name below minimum length fails validation and only shows the name error.', 'Fill name Bench, valid description, CHEST, and BARBELL.', 'userEvent.click(Create Exercise)', 'Name min-length error visible; other fields have no error; createExercise not called.'),
                tc('TC-04', 'Name above maximum length fails validation and only shows the name error.', 'Fill 65-character name, valid description, CHEST, and BARBELL.', 'userEvent.click(Create Exercise)', 'Name max-length error visible; Description has no error; createExercise not called.'),
                tc('TC-05', 'Description above maximum length fails validation and only shows the description error.', 'Fill valid name, 1025-character description, CHEST, and BARBELL.', 'userEvent.click(Create Exercise)', 'Description max-length error visible; Name, Muscle Group, and Equipment have no errors; createExercise not called.'),
                tc('TC-06', 'Missing muscle group fails validation and only shows the muscle group error.', 'Fill valid name, valid description, leave Muscle Group empty, select BARBELL.', 'userEvent.click(Create Exercise)', 'Invalid muscle group visible; only Muscle Group has a field error; createExercise not called.'),
                tc('TC-07', 'Missing equipment fails validation and only shows the equipment error.', 'Fill valid name, valid description, select CHEST, leave Equipment empty.', 'userEvent.click(Create Exercise)', 'Invalid equipment visible; only Equipment has a field error; createExercise not called.'),
                tc('TC-08', 'All invalid fields show all field errors and skip createExercise.', 'Fill too-short name, 1025-character description, leave both selects empty.', 'userEvent.click(Create Exercise)', 'Name, Description, Muscle Group, and Equipment field errors visible; createExercise not called.'),
                tc('TC-09', 'Valid submit with description trims strings, calls createExercise, and navigates to the exercises list.', 'createExercise resolves success; fill name and description with surrounding spaces; select CHEST/BARBELL.', 'userEvent.click(Create Exercise)', 'createExercise called once with trimmed payload; router.push called with /admin/exercises.'),
                tc('TC-10', 'Valid submit without description calls createExercise with an empty description string.', 'createExercise resolves failed result; fill valid name, leave description empty, select CHEST/BARBELL.', 'userEvent.click(Create Exercise)', 'createExercise called once with description "".'),
                tc('TC-11', 'Create failure shows server error and does not navigate.', 'createExercise resolves {success:false,message:"Exercise already exists"}; fill valid fields.', 'userEvent.click(Create Exercise)', 'Exercise already exists visible; Create Exercise enabled; createExercise called once; router.push not called.'),
                tc('TC-12', 'Server-returned field errors render for all form fields.', 'createExercise resolves failed result with errors for name, description, muscleGroup, and equipmentNeeded; fill valid fields.', 'userEvent.click(Create Exercise)', 'Validation failed plus all returned field errors are visible; createExercise called once; router.push not called.'),
                tc('TC-13', 'Pending create disables the submit button and changes label to Creating.', 'createExercise returns a manually controlled unresolved promise; fill valid fields.', 'userEvent.click(Create Exercise) without resolving promise.', 'Creating… button is disabled; Create Exercise button text absent until cleanup resolves promise.'),
                tc('TC-14', 'After a server-side failure, a subsequent valid submission can succeed.', 'createExercise first resolves failed Exercise already exists, then resolves success; fill valid fields.', 'Click Create Exercise twice, waiting for first error before second click.', 'First click shows error; second click pushes /admin/exercises; createExercise called twice.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', 'edit', '_components', '__tests__', 'ft', 'edit-exercise-form', 'edit-exercise-form-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'EditExerciseForm',
            reqId: 'FT-24',
            statement: 'EditExerciseForm - edits exercise fields, archives/unarchives, deletes, and routes or refreshes after successful mocked server actions.',
            props: 'exercise: Exercise - existing values to prefill; exerciseId: string - ID passed to server actions.',
            precondition: 'Mock next/navigation useRouter as { push: jest.fn(), refresh: jest.fn() }. Mock updateExercise, archiveExercise, unarchiveExercise, deleteExercise. Mock generated Prisma enums.',
            renderOutput: 'Prefilled editable fields, Save Changes button, archive/unarchive control, and Delete Exercise button.',
            postcondition: 'Successful update refreshes the route; successful archive/unarchive/delete navigates to /admin/exercises; failures render error text.',
            remarks: [
                'Run: npx jest edit-exercise-form.test.tsx --selectProjects jsdom',
            ],
            tcRows: [
                tc('TC-01', 'Prefills editable fields and shows archive/delete controls for an active exercise.', 'render(<EditExerciseForm exercise={exercise} exerciseId="ex-1" />)', 'No interaction - render only.', 'Name, Description, Muscle Group, and Equipment values match exercise; Save Changes, Archive, and Delete Exercise are enabled; no alert is visible.'),
                tc('TC-02', 'Prefills an empty string when the supplied description is null.', 'render(<EditExerciseForm exercise={{...exercise, description:null}} exerciseId="ex-1" />)', 'No interaction - render only.', 'Description field value is "" rather than null.'),
                tc('TC-03', 'Name below minimum length fails validation and only shows the name error.', 'Clear Name and type Bench; other fields remain valid.', 'userEvent.click(Save Changes)', 'Validation failed and "Name must be at least 8 characters" visible; only Name has a field error; updateExercise not called.'),
                tc('TC-04', 'Name above maximum length fails validation and only shows the name error.', 'Clear Name and type 65 characters; other fields remain valid.', 'userEvent.click(Save Changes)', '"Name must be at most 64 characters" visible; Description has no field error; updateExercise not called.'),
                tc('TC-05', 'Description above maximum length fails validation and only shows the description error.', 'Clear Description and type 1025 characters; other fields remain valid.', 'userEvent.click(Save Changes)', '"Description must be at most 1024 characters" visible; Name has no field error; updateExercise not called.'),
                tc('TC-06', 'Invalid muscle group fails validation and only shows the muscle group error.', 'Render exercise with muscleGroup cast to INVALID_MUSCLE.', 'userEvent.click(Save Changes)', '"Invalid muscle group" visible; only Muscle Group has a field error; updateExercise not called.'),
                tc('TC-07', 'Invalid equipment fails validation and only shows the equipment error.', 'Render exercise with equipmentNeeded cast to INVALID_EQUIPMENT.', 'userEvent.click(Save Changes)', '"Invalid equipment" visible; only Equipment has a field error; updateExercise not called.'),
                tc('TC-08', 'All invalid fields show all field errors and skip update.', 'Render invalid enum values; type too-short Name and too-long Description.', 'userEvent.click(Save Changes)', 'Name, Description, Muscle Group, and Equipment field errors are visible; updateExercise not called.'),
                tc('TC-09', 'Valid update trims string fields, calls updateExercise, shows success, and refreshes.', 'updateExercise resolves success; type name/description with surrounding spaces; select SHOULDERS and DUMBBELL.', 'userEvent.click(Save Changes)', 'Success alert visible; updateExercise called with trimmed payload; router.refresh called once; router.push not called.'),
                tc('TC-10', 'Failed update shows server error and does not refresh or navigate.', 'updateExercise resolves {success:false,message:"Exercise already exists"}.', 'userEvent.click(Save Changes)', 'Exercise already exists visible; Save Changes enabled; updateExercise called once; refresh and push not called.'),
                tc('TC-11', 'Failed update with field errors renders returned field errors.', 'updateExercise resolves failed result with errors for name, description, muscleGroup, and equipmentNeeded.', 'userEvent.click(Save Changes)', 'All returned server field error messages are visible; router.refresh not called.'),
                tc('TC-12', 'Active exercise shows Archive and hides Unarchive.', 'render active exercise.', 'No interaction - render only.', 'Archive button visible; Unarchive button absent.'),
                tc('TC-13', 'Archived exercise shows Unarchive and hides Archive.', 'render inactive exercise.', 'No interaction - render only.', 'Unarchive button visible; Archive button absent.'),
                tc('TC-14', 'Archive success calls archiveExercise and navigates to the exercises list.', 'archiveExercise resolves success; render active exercise.', 'userEvent.click(Archive)', 'archiveExercise called with ex-1; unarchiveExercise not called; router.push called with /admin/exercises.'),
                tc('TC-15', 'Archive failure shows server error and does not navigate.', 'archiveExercise resolves {success:false,message:"Could not archive exercise"}.', 'userEvent.click(Archive)', 'Could not archive exercise visible; archiveExercise called with ex-1; router.push not called.'),
                tc('TC-16', 'Unarchive success calls unarchiveExercise and navigates to the exercises list.', 'unarchiveExercise resolves success; render inactive exercise.', 'userEvent.click(Unarchive)', 'unarchiveExercise called with ex-1; archiveExercise not called; router.push called with /admin/exercises.'),
                tc('TC-17', 'Unarchive failure shows server error and does not navigate.', 'unarchiveExercise resolves {success:false,message:"Could not unarchive exercise"}.', 'userEvent.click(Unarchive)', 'Could not unarchive exercise visible; unarchiveExercise called with ex-1; router.push not called.'),
                tc('TC-18', 'Delete success calls deleteExercise and navigates to the exercises list.', 'deleteExercise resolves success.', 'userEvent.click(Delete Exercise)', 'deleteExercise called with ex-1; router.push called with /admin/exercises.'),
                tc('TC-19', 'Delete failure shows server error and does not navigate.', 'deleteExercise resolves {success:false,message:"Exercise is used by workout sessions"}.', 'userEvent.click(Delete Exercise)', 'Exercise is used by workout sessions visible; deleteExercise called once; router.push not called.'),
                tc('TC-20', 'Pending update disables Save, archive, and delete buttons and changes Save label to Saving.', 'updateExercise returns a manually controlled unresolved promise.', 'userEvent.click(Save Changes) without resolving update.', 'Saving… button is disabled; Archive and Delete Exercise are disabled; Save Changes text absent until cleanup resolves promise.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'AdminExercisesPage',
            reqId: 'FT-25',
            statement: 'AdminExercisesPage - fetches filtered paginated exercises and renders search, archived toggle, table, and pagination.',
            props: 'searchParams: Promise<{ search?: string; page?: string; includeInactive?: string }> - route query params.',
            precondition: 'Mock listExercises. Mock next/navigation hooks for SearchInput. Mock generated Prisma enums.',
            renderOutput: 'Exercises header, Add Exercise link, search input, archived toggle, ExercisesTable, and Pagination when total exceeds page size.',
            postcondition: 'listExercises is called with search, page, pageSize 10, and includeInactive derived from query params.',
            remarks: [
                'Run: npx jest app/admin/exercises/__tests__/ft/page/page.test.tsx --selectProjects jsdom',
            ],
            tcRows: [
                tc('TC-01', 'Fetches first active page and renders default page chrome and list output.', 'listExercises resolves one active exercise; searchParams resolves {} and useSearchParams is empty.', 'render(await AdminExercisesPage(...))', 'Exercises heading, description, Add Exercise href, empty search input, Show Archived href, exercise row, and listExercises args {search:"", page:1, pageSize:10, includeInactive:false} are asserted.'),
                tc('TC-02', 'Uses the search param for fetch and seeds the SearchInput value.', 'searchParams resolves {search:"bench"}; useSearchParams contains search=bench.', 'render page.', 'Search input value is bench; listExercises called with search bench, page 1, includeInactive false.'),
                tc('TC-03', 'Uses the page param for fetch and renders Previous/Next pagination links.', 'searchParams resolves {page:"2"}; listExercises total 22.', 'render page.', 'Page 2 of 3 visible; Previous href /admin/exercises?page=1; Next href /admin/exercises?page=3; listExercises called with page 2.'),
                tc('TC-04', 'Uses combined search and page params for a filtered requested page.', 'searchParams resolves {search:"bench", page:"2"}; useSearchParams contains both; listExercises total 22.', 'render page.', 'Search input value bench; Page 2 of 3 visible; listExercises called with search bench and page 2.'),
                tc('TC-05', 'Preserves the search param in pagination links.', 'searchParams resolves {search:"bench"}; listExercises total 22.', 'render page.', 'Next href is /admin/exercises?search=bench&page=2.'),
                tc('TC-06', 'includeInactive=true fetches archived exercises.', 'searchParams resolves {includeInactive:"true"}; listExercises returns active and archived rows.', 'render page.', 'Archived row visible; listExercises called with includeInactive true.'),
                tc('TC-07', 'includeInactive=true shows the Hide Archived toggle.', 'searchParams resolves {includeInactive:"true"}; listExercises total 1.', 'render page.', 'Hide Archived href is /admin/exercises; Show Archived is absent.'),
                tc('TC-08', 'includeInactive=true is preserved in pagination links.', 'searchParams resolves {includeInactive:"true"}; listExercises total 22.', 'render page.', 'Next href is /admin/exercises?includeInactive=true&page=2.'),
                tc('TC-09', 'includeInactive=false string is treated as archived hidden.', 'searchParams resolves {includeInactive:"false"}; listExercises total 1.', 'render page.', 'Show Archived href is /admin/exercises?includeInactive=true; listExercises called with includeInactive false.'),
                tc('TC-10', 'Search and includeInactive=true are both preserved in pagination links.', 'searchParams resolves {search:"bench", includeInactive:"true"}; listExercises total 22.', 'render page.', 'Next href is /admin/exercises?search=bench&includeInactive=true&page=2; listExercises called with search bench and includeInactive true.'),
                tc('TC-11', 'Renders table empty state without pagination for successful empty result.', 'listExercises resolves success with items [] and total 0.', 'render page.', 'No exercises found is visible and no Page 1 indicator exists.'),
                tc('TC-12', 'Renders returned error message without page chrome when listExercises fails.', 'listExercises resolves {success:false,message:"Could not load exercises"}.', 'render page.', 'Could not load exercises visible; Exercises heading and search input absent.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, 'new', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'NewExercisePage',
            reqId: 'FT-26',
            statement: 'NewExercisePage - renders the add-exercise page header, back link, and CreateExerciseForm organism.',
            props: 'None - the page accepts no props.',
            precondition: 'Mock useRouter and createExercise for mounted CreateExerciseForm. Mock generated Prisma enums.',
            renderOutput: 'Add Exercise heading, description, Back to Exercises link, and create form fields.',
            postcondition: 'None at page level; CreateExerciseForm handles submission in its own FT.',
            remarks: ['Run: npx jest app/admin/exercises --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders heading, description, and back link.', 'render(await NewExercisePage())', 'No interaction - render only.', 'Heading and description visible; Back to Exercises href is /admin/exercises.'),
                tc('TC-02', 'Mounts CreateExerciseForm without submitting it.', 'render(await NewExercisePage())', 'No interaction - render only.', 'Name and Muscle Group fields plus Create Exercise button are visible; createExercise not called.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'ExerciseDetailPage',
            reqId: 'FT-27',
            statement: 'ExerciseDetailPage - fetches one exercise by route ID and renders a detail page, or calls notFound on failure.',
            props: 'params: Promise<{ id: string }> - route params containing exercise ID.',
            precondition: 'Mock getExercise and next/navigation notFound. Mock generated Prisma enums.',
            renderOutput: 'Exercise name heading, Exercise details description, Back/Edit links, and ExerciseDetailInformation.',
            postcondition: 'getExercise(id) called once. notFound() called when getExercise fails.',
            remarks: ['Run: npx jest app/admin/exercises --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders detail page when getExercise succeeds.', 'getExercise resolves success with exercise; params id ex-1.', 'render(await ExerciseDetailPage(...))', 'Heading, description, Back/Edit hrefs, CHEST detail, and getExercise("ex-1") are asserted.'),
                tc('TC-02', 'Calls notFound when getExercise fails.', 'getExercise resolves failed result; params id missing-exercise.', 'await ExerciseDetailPage(...), catching thrown mock error.', 'notFound called once; getExercise called with missing-exercise.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '[id]', 'edit', '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'EditExercisePage',
            reqId: 'FT-28',
            statement: 'EditExercisePage - fetches one exercise by route ID and renders the edit form, or calls notFound on failure.',
            props: 'params: Promise<{ id: string }> - route params containing exercise ID.',
            precondition: 'Mock getExercise and next/navigation notFound/useRouter. Mock EditExerciseForm server actions through exercise-controller. Mock generated Prisma enums.',
            renderOutput: 'Edit: {exercise.name} heading, Update exercise details description, Back to Exercises link, and prefilled EditExerciseForm.',
            postcondition: 'getExercise(id) called once. notFound() called when getExercise fails.',
            remarks: ['Run: npx jest app/admin/exercises --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders edit header, back link, and prefilled form when getExercise succeeds.', 'getExercise resolves success with exercise; params id ex-1.', 'render(await EditExercisePage(...))', 'Heading, description, Back link, prefilled name, Save Changes button, and getExercise("ex-1") are asserted.'),
                tc('TC-02', 'Calls notFound when getExercise fails.', 'getExercise resolves failed result; params id missing-exercise.', 'await EditExercisePage(...), catching thrown mock error.', 'notFound called once; getExercise called with missing-exercise.'),
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
