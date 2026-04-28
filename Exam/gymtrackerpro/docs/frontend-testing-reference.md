# Frontend Testing Guide — Component & Page Layer

This document is the authoritative reference for writing frontend tests and their
accompanying FT form descriptors for the UI layer of this project.
Follow every rule here precisely and in order.

---

## 1. What Frontend Testing Means Here

A frontend test (FT) answers one question:
**"Does this component render correctly and behave as intended when the user interacts with it?"**

It is not a unit test of isolated logic. It is not an end-to-end test against a real
server. It tests the *rendered contract* of a component: what it shows, what it
responds to, and what it calls.

The testing boundary is always:
```
Component  ←→  React DOM  ←→  User Interaction
               ↑
           Server Actions  (always mocked — jest.fn() / jest.mock())
```

Every test must therefore:
- Render the component inside a minimal but realistic provider tree.
- Interact with the DOM exactly as a user would (via `userEvent`, not `fireEvent`).
- Assert on visible DOM output — text, roles, attributes — never on internal state
  or implementation details.
- Mock every server action the component imports. Never call real network or
  database code from a frontend test.

The rule of thumb: if you need a real server action to pass, it is not a frontend test.

---

## 2. Bottom-Up Testing Order

Frontend tests are written and run **bottom-up**, from the smallest reusable pieces
to the full page. Each level is verified before the level above depends on it.

```
Page            (tested last — renders real child components, all server actions mocked)
    ↑
Organism        (feature-level component, e.g. ExerciseForm, ExerciseList)
    ↑
Molecule        (composed UI, e.g. FormField, SearchBar, PaginationControls)
    ↑
Atom            ← start here (Button, Input, Badge, Spinner, ErrorMessage)
```

**Atom**: single-responsibility, no server actions, no composition of other project
components. Test every prop variant, every disabled/loading/error state.

**Molecule**: composes atoms. May have local state (e.g. a controlled input). No server
actions. Test interaction flows between the composed atoms.

**Organism**: a feature slice with its own server actions. Server actions are always
mocked here. Test the full user workflow within the feature: idle state, success
path, error path, validation, and error recovery.

**Page**: renders real organisms and molecules in the correct layout. All server
actions remain mocked. Test only what the page itself adds: routing triggers,
layout rendering, and cross-organism interactions.

Rules:
- When writing atom or molecule tests, there are no server actions — there is nothing
  to mock at that level.
- When writing organism tests, mock every server action the component imports.
  Do not test server-action logic here — that belongs to integration tests.
- When writing page tests, do not re-test organism internals. Test only what the
  page itself adds.
- Never reach downward to test a child component's internal behaviour from a parent
  test. The child has its own test file.

---

## 3. Workflow — Descriptor Before Test

The mandatory workflow for every new component is:

```
1. Fill in the FtDescriptor in *-ft-forms.ts
2. Run npm run generate-ft-forms:... to produce the xlsx workbooks
3. Implement the Jest test cases in *.test.tsx
```

The descriptor is the specification. The Jest file is the implementation.
They must stay in sync — every `tcRow` in the descriptor maps 1-to-1 to one `it()`
block in the test file.

---

## 4. Filling in the FtDescriptor

### 4.1 Header fields

| Field | What to write |
|---|---|
| `componentName` | The component's export name exactly as it appears in source, e.g. `ExerciseForm`. |
| `reqId` | Unique identifier, e.g. `FT-ATOM-1`, `FT-MOL-2`, `FT-ORG-3`, `FT-PAGE-1`. Prefix by level, increment per component. |
| `statement` | One sentence: `ComponentName — what it renders and its primary responsibility.` |
| `props` | All accepted props with types, whether required or optional, and defaults. Write as a TypeScript-style list. |
| `precondition` | Required providers, global mocks, and mocked server actions needed before rendering. Write `"None"` for atoms with no dependencies. |
| `renderOutput` | What the component renders in its default / happy-path state, described in terms of visible elements and their roles. |
| `postcondition` | Side-effects after interaction: which mocked server actions were called with what arguments, navigation triggered, callbacks invoked. Use `"None"` for purely presentational components. |
| `testingTool` | Default is `"Jest + React Testing Library"`. Override if using Playwright Component Tests, etc. |
| `remarks` | Always include the run command and any known limitations or gotchas. |
| `tcsFailed` | Start at `0`. Update after a test run if failures occur. |
| `bugsFound` | Start at `0`. |
| `bugsFixed` | Start at `'n/a'`. |
| `retested` | Start at `'not yet'`. |
| `retestRun` | Start at `0`. |
| `coveragePercent` | Set to `'100%'` once all decision points are covered. |

### 4.2 tcRows — one row per test case

Each `FtTcRow` has six fields:

| Field | What to write |
|---|---|
| `noTc` | Sequential string: `'TC-FT-001'`, `'TC-FT-002'`, etc. Reset per component. |
| `description` | One plain-English sentence of what user behaviour or prop variant this case verifies. |
| `arrange` | The props passed, mock return values configured, and any provider setup before render. List mock return values explicitly. |
| `act` | The exact user interaction or render-only trigger: `userEvent.click(button)`, `"no interaction — render only"`, `userEvent.type(input, 'Deadlift')`. |
| `expectedOutput` | What must be visible in the DOM, or what mock must have been called with what arguments. Be specific: element role, text content, attribute value, call count. |
| `actualResult` | `'Passed'`, `'Failed — <short description>'`, or `'Skipped — <reason>'`. |

---

## 5. Enumerating Test Cases — Decision-Point Coverage

Use this framework: enumerate every **decision point** in the component — every place
where the rendered output or behaviour can differ based on props, state, or user
interaction — and ensure every branch has at least one test case.

### 5.1 Decision-point checklist per component level

**Atom** (no server actions, no local async state):
- [ ] Default render — all required props provided, optional props omitted
- [ ] Each significant optional prop individually (`variant`, `size`, `disabled`, `loading`, etc.)
- [ ] Every conditional render branch — every JSX `&&` or ternary in the component
- [ ] Callback props — `onClick`, `onChange`, `onSubmit` called with correct args
- [ ] Accessibility — correct `role`, `aria-label`, `aria-disabled` where applicable

**Molecule** (local state, validation, no server actions):
- [ ] Renders all constituent elements in initial state
- [ ] Each validation rule independently — one failing field at a time
- [ ] All fields valid — submit/change callback invoked with correct payload
- [ ] Disabled / loading state — inputs disabled, button shows loading indicator

**Organism** (local state + mocked server actions):
- [ ] Initial render — correct idle or loading state
- [ ] Happy path — server action resolves, success UI shown
- [ ] Server action rejects — error message shown, form re-enabled
- [ ] Each client-side validation rule before the server action is called
- [ ] After-error recovery — a subsequent valid submission succeeds after a failure

**Page** (real child organisms, all server actions mocked):
- [ ] Full page renders without crashing — all organisms mount correctly
- [ ] Navigation / routing — correct `router.push()` call on the expected trigger
- [ ] Data threaded correctly from page down to organisms (props, URL params)
- [ ] Cross-organism interactions the page owns (success in one organism triggers
  refresh in another)

### 5.2 RIGHT BICEP as a secondary check

After all decision points are covered, run through RIGHT BICEP to catch anything missed:

| Letter | Question | Example at the component layer |
|---|---|---|
| **R**ight | Are the results right? | Rendered text and attribute values exactly match the props passed in |
| **B**oundary | What are the boundary conditions? | Empty string prop, `0` count, very long text that should truncate, `undefined` optional prop |
| **I**nverse | Can you check an inverse relationship? | If `isLoading={true}` disables the button, `isLoading={false}` must re-enable it |
| **C**ross-check | Can you verify using another means? | After `userEvent.click`, assert both the DOM change *and* the mock call |
| **E**rror | Can you force all error paths? | Server action mock rejects, required prop omitted (if guarded), invalid input submitted |
| **P**erformance | Any perf constraints? | Not tested at this layer — note and defer if relevant |

---

## 6. Test File Structure

### 6.1 File location and naming

```
components/atoms/button/__tests__/button.test.tsx
components/molecules/form-field/__tests__/form-field.test.tsx
components/organisms/exercise-form/__tests__/exercise-form.test.tsx
app/exercises/__tests__/page.test.tsx
```

Pattern: `<component-name>.test.tsx` inside a `__tests__` folder co-located with the
component. Page tests live under the `app/` route folder they belong to.

### 6.2 Top-of-file setup

```typescript
import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createExercise} from '@/lib/actions/exercise-actions';
import {renderWithProviders} from '@/test-utils/render-with-providers';
import {ExerciseForm} from '../exercise-form';

// Mock every server action the component imports.
// Required for organism and page tests; omit entirely for atoms and molecules.
jest.mock('@/lib/actions/exercise-actions', () => ({
    createExercise: jest.fn(),
}));

const mockCreateExercise = createExercise as jest.MockedFunction<typeof createExercise>;

// Reset all mocks between tests so state never leaks across cases.
beforeEach(() => {
    jest.clearAllMocks();
});
```

Rules:
- Mock server action modules at the top of the file with `jest.mock(...)`.
- Assign a typed mock handle (`jest.MockedFunction<typeof …>`) immediately after —
  required to call `.mockResolvedValueOnce()` without TypeScript errors.
- `jest.clearAllMocks()` in `beforeEach` is mandatory — resets call counts, return
  values, and implementations between tests.
- Atoms and molecules with no server actions need none of the mocking setup above.

### 6.3 Provider wrapper helper

Any component that depends on a context provider (Theme, Auth, Router, Query Client,
etc.) must be rendered through a shared `renderWithProviders` helper — never inline
provider trees inside individual tests.

```typescript
// test-utils/render-with-providers.tsx
import {render, RenderOptions} from '@testing-library/react';
import {ThemeProvider} from '@/components/providers/theme-provider';

function AllProviders({children}: {children: React.ReactNode}) {
    return <ThemeProvider>{children}</ThemeProvider>;
}

export function renderWithProviders(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) {
    return render(ui, {wrapper: AllProviders, ...options});
}
```

Rules:
- All providers required by the component under test must be present in the wrapper.
  A missing provider is a broken test environment, not a meaningful test failure.
- `next/navigation` mocks (`useRouter`, `usePathname`, `useSearchParams`) go in
  `jest.setup.ts` or in the wrapper — not inline per test.
- Never add a provider the component does not need — keep the wrapper minimal.

### 6.4 describe / it structure

```typescript
describe('ComponentName', () => {

    describe('feature area or prop group', () => {

        it('componentName_scenario_expectedOutcome', async () => {
            // Arrange
            ...

            // Act
            ...

            // Assert
            ...
        });

    });

});
```

One outer `describe` block per component. Group related cases into inner `describe`
blocks by prop or feature area when there are more than five test cases.
All test cases for a component live in its single file.

---

## 7. AAA Pattern — Arrange / Act / Assert

Every `it` block must follow AAA strictly. Use blank lines to separate the three phases.
Add `// Arrange` comments — the blank-line separation is not sufficient

Rules:
- **Arrange**: Call `userEvent.setup()`, configure mock return values, render the
  component. Configure mock return values *before* rendering — some components fetch
  on mount and the mock must be ready before the first render cycle.
- **Act**: One logical user interaction sequence. For render-only tests the act phase
  is empty — omit it and run two phases only.
- **Assert**: First assert visible DOM output (`screen.getBy*`), then assert mock
  calls. Both are required for any test that triggers a server action. For render-only
  tests, asserting mock calls is not applicable.

### 7.1 Asserting server action calls

```typescript
// Assert the action was called with the right arguments
expect(mockCreateExercise).toHaveBeenCalledOnce();
expect(mockCreateExercise).toHaveBeenCalledWith({name: 'Deadlift', muscleGroup: 'BACK'});

// Assert it was NOT called (e.g. validation blocked submission)
expect(mockCreateExercise).not.toHaveBeenCalled();
```

Always assert call count alongside call arguments — `toHaveBeenCalledWith` alone passes
even if the mock was called multiple times with the same args.

### 7.2 Asserting error paths

```typescript
it('exerciseForm_serverActionRejects_showsErrorAlertAndReEnablesForm', async () => {
    const user = userEvent.setup();
    mockCreateExercise.mockRejectedValueOnce(new Error('Duplicate name'));
    renderWithProviders(<ExerciseForm />);

    await user.type(screen.getByLabelText('Name'), 'Bench Press');
    await user.click(screen.getByRole('button', {name: 'Save'}));

    await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent('Duplicate name'),
    );
    expect(screen.getByRole('button', {name: 'Save'})).toBeEnabled();
});
```

After an expected error, always assert:
1. The error message is visible in the DOM.
2. The form is re-enabled (submit button not disabled, inputs not readonly).

This confirms the component recovered correctly and the user can try again.

---

## 8. Test Naming Convention

Pattern: `componentName_scenario_expectedOutcome`

All three segments are camelCase. The name must read as a sentence when underscores
are read as "when" and "then":

> `exerciseForm_serverActionRejects_showsErrorAlertAndReEnablesForm`
> → "exerciseForm, when the server action rejects, then it shows an error alert and re-enables the form"

Rules:
- **componentName**: exact component export name, camelCase.
- **scenario**: the prop value, user action, or mock configuration that makes this
  case distinct. Be specific — `serverActionRejects` not `error`,
  `nameFieldEmpty` not `invalidInput`, `isLoadingTrue` not `loading`.
- **expectedOutcome**: what the user sees or what side-effect occurs. Prefer verb
  phrases: `showsSpinner`, `callsOnSubmitWithTrimmedValues`,
  `disablesSubmitButton`, `rendersEmptyState`.
- Never use vague words: `works`, `correct`, `valid`, `renders`, `test1`.

---

## 9. Cross-Cutting Rules

### 9.1 Always query by role or label, never by test ID

Prefer queries that reflect how a real user or assistive technology finds elements:

```typescript
// Preferred — semantic role
screen.getByRole('button', {name: 'Save'})
screen.getByRole('alert')
screen.getByLabelText('Email')

// Acceptable — visible text
screen.getByText('Exercise created successfully')

// Last resort — only when no semantic alternative exists
screen.getByTestId('custom-slider')
```

A test that uses `data-testid` on a button is masking a missing accessible label in
production. Fix the component before adding a test ID.

### 9.2 Never assert on implementation details

Do not assert on:
- React component state (`useState` values)
- CSS class names (unless the class name is the externally observable contract)
- Internal refs or DOM structure below the semantic element

Assert only on what a user can observe: text content, roles, attributes (`disabled`,
`aria-expanded`, `value`), and mock call records.

### 9.3 userEvent over fireEvent

Always use `userEvent.setup()` + `await user.*` for all interactions. `fireEvent` fires
a single synthetic DOM event and bypasses focus management, keyboard handling, and
pointer events. `userEvent` simulates the full browser interaction sequence.

```typescript
// Wrong
fireEvent.change(input, {target: {value: 'Deadlift'}});

// Correct
const user = userEvent.setup();
await user.type(input, 'Deadlift');
```

The only exception is testing a handler explicitly attached to a raw DOM event with no
higher-level `userEvent` equivalent (rare in practice).

### 9.4 waitFor placement

Use `waitFor` only to wait for async DOM changes triggered by user interaction or mock
resolution. Never wrap synchronous assertions in `waitFor`.

```typescript
// Wrong — synchronous assertion does not need waitFor
await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument());

// Correct — waiting for DOM update after async mock resolves
await waitFor(() =>
    expect(screen.getByText('Exercise created successfully')).toBeInTheDocument(),
);
```

Wrapping synchronous assertions in `waitFor` hides missing `await` calls elsewhere
and makes test failures harder to diagnose.

### 9.5 Mock return values in Arrange, not at the describe level

Configure `mockResolvedValueOnce` / `mockRejectedValueOnce` inside the `it` block,
in the Arrange phase, not in a shared `beforeEach`.

```typescript
// Wrong — shared mock state can leak between tests
beforeEach(() => {
    mockCreateExercise.mockResolvedValue({id: 'ex-1', name: 'Deadlift'});
});

// Correct — each test owns its mock configuration
it('...', async () => {
    mockCreateExercise.mockResolvedValueOnce({id: 'ex-1', name: 'Deadlift'});
    ...
});
```

Use `mockResolvedValueOnce` (not `mockResolvedValue`) so that a test that forgets to
configure a return value receives `undefined` and fails visibly rather than silently
inheriting a stale value from a prior test.

### 9.6 Page tests do not re-test organism internals

When writing a page test, assume the organisms it contains are already verified by
their own test files. A page test covers only:
- The page renders without crashing with all organisms present.
- Navigation (`router.push`) is triggered by the correct user actions.
- Props and URL params are threaded correctly from the page down to organisms.
- Cross-organism interactions owned by the page (e.g. a success in one organism
  triggers a refresh in another).

---

## 10. Descriptor ↔ Test File Correspondence

Every `tcRow` in the descriptor must have a corresponding `it()` block. The mapping
is by `noTc` order within the `describe` block.

When a test case is added after the initial pass (e.g. a gap is identified):
1. Append the `tcRow` at the end of the descriptor's `tcRows` array.
2. Regenerate the xlsx workbook.
3. Append the `it()` block at the end of the relevant `describe` block.
4. Add a `// --- new case ---` comment before it to make the addition visible in review.

---

## 11. Complete Example — Reference Implementation

The canonical implementation this guide was derived from will be the first organism
built under this process. Until then, use the `LoginForm` descriptor in
`generate-ft-forms.ts` as the reference.

Expected TC counts per level for a typical CRUD feature:

| Level | Component example | Typical TCs | Key coverage |
|---|---|---|---|
| Atom | `Button` | 5–8 | variant, disabled, loading, onClick, aria-label |
| Atom | `ErrorMessage` | 3–4 | renders message, hidden when undefined, role=alert |
| Molecule | `FormField` | 4–6 | label association, error display, required marker |
| Organism | `ExerciseForm` | 8–12 | render, each validation rule, success, rejection, recovery |
| Page | `ExercisesPage` | 4–6 | full render, routing, cross-organism prop flow |

---

## 12. Checklist Before Submitting

- [ ] Every decision point in the component has at least one test case.
- [ ] RIGHT BICEP has been applied as a secondary check.
- [ ] Every test that triggers a server action asserts both the DOM outcome *and* the mock call.
- [ ] All server actions are mocked via `jest.mock(...)` — no real network calls are made.
- [ ] All test names follow `componentName_scenario_expectedOutcome`.
- [ ] All `it()` blocks follow AAA with blank-line separation.
- [ ] Every `tcRow` in the descriptor has a corresponding `it()` block.
- [ ] The descriptor was filled in and the xlsx regenerated before the tests were written.
- [ ] After-error recovery is tested for every component that calls a server action.
- [ ] `userEvent.setup()` is used for all interactions — no raw `fireEvent` calls.
- [ ] `waitFor` is used only for genuinely async assertions.
- [ ] Mock return values are set with `mockResolvedValueOnce` inside the Arrange phase.
- [ ] Page tests cover only page-level concerns, not organism internals.