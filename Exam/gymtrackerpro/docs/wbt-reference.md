# White-Box Testing — GymTrackerPro Reference

## 1 · WBT Process (in order)

1. Read the function source code.
2. Draw the CFG → assign node IDs.
3. Compute Cyclomatic Complexity (three ways, they must agree).
4. Derive the basis set of independent paths (count = CC).
5. Select TCs achieving **full coverage** (MCC + predicate coverage).
6. Fill the `WbtDescriptor` and run `npm run generate-<layer>-wbt-forms`.
7. Write the corresponding Jest tests in the `__tests__/wbt/` folder.

---

## 2 · CFG Node Types and DOT Syntax

Every CFG must have **exactly one entry** and **exactly one exit** node.

| Node type | Shape | Entry port | Exit port(s) | DOT declaration |
|-----------|-------|-----------|--------------|-----------------|
| **START** | Small filled black circle | — | bottom | `label="" shape=circle width=0.25 style=filled fillcolor=black` |
| **EXIT** | Small filled black circle | top | — | `label="" shape=circle width=0.25 style=filled fillcolor=black` |
| **STATEMENT** (computation) | Rectangle | top only (`:n`) | bottom only (`:s`) | `shape=box` |
| **DECISION** (predicate) | Diamond | top (`:n`) | left `:w` = **True**, right `:e` = **False** | `shape=diamond` |
| **MERGE** | Tiny filled black circle | multiple | one bottom | `label="" shape=circle width=0.18 style=filled fillcolor=black` |

### DOT preamble (always include)
```dot
rankdir=TB;
splines=polyline;
node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];
```

`splines=polyline` produces straight-line segments with bends (no curves), handles loop back-edges better than `splines=ortho`, and avoids the ortho router's node-clipping bug.

### Edge rules
```dot
start      -> stmtA:n;              // start → statement top
stmtA:s    -> decision:n;           // statement bottom → decision top
decision:w -> stmtB:n [label="True"];  // True exits LEFT vertex of diamond
decision:e -> stmtC:n [label="False"];  // False exits RIGHT vertex of diamond

// MERGE: edges must enter from opposite sides — one :nw, one :ne
stmtB:s    -> merge1:nw;           // True path  enters merge from top-left
stmtC:s    -> merge1:ne;           // False path enters merge from top-right
merge1     -> stmtD:n;              // merge exits bottom → next statement top

stmtZ:s    -> exit;                 // last statement → exit
```

**Merge port rule**: always use `:nw` for the path coming from the True (left) branch and `:ne` for the path coming from the False (right) branch. This makes the two arrows visibly enter the merge circle from opposite sides rather than from the same direction.

### Loop back-edges — CRITICAL routing rule
The back-edge **must exit from the WEST (`:w`) port** of the last loop-body node, not from the south (`:s`). Using `:s` routes the edge straight up through the loop-condition diamond.

```dot
// CORRECT — exits west, uses the clear left channel, turns up, enters loopCond:n
inc:w -> loopCond:n [constraint=false];

// WRONG — routes straight up through the diamond node
inc:s -> loopCond:n [constraint=false];   // ← do NOT use this
```

The `constraint=false` flag tells graphviz to ignore this edge when computing rank positions (keeping the top-to-bottom layout). The `:w` exit directs the router into clear space on the left side of the True subtree, so it travels upward without intersecting any nodes before entering `:n`.

---

## 3 · Cyclomatic Complexity

Compute all three — they must give the same number:

| Formula | How |
|---------|-----|
| **CC₁ = regions** | Count enclosed regions in the planar graph + 1 for the outer region |
| **CC₂ = E − N + 2** | E = number of edges, N = number of nodes |
| **CC₃ = P + 1** | P = number of predicate (decision/diamond) nodes |

The CC value equals the **number of independent paths** in the basis set and the **upper bound** on test cases needed for full path coverage.

---

## 4 · Coverage Criteria (weakest → strongest)

```
SC ⊂ DC ⊂ DCC ⊂ MCC
              CC may not imply DC (exception: if(A&&B))
```

| Criterion | Abbreviation | Goal |
|-----------|-------------|------|
| Statement coverage | SC | Every statement executed ≥ once |
| Branch/Decision coverage | DC | Every branch (edge from decision node) taken ≥ once; DC ⊃ SC |
| Condition coverage | CC | Each individual condition in every decision takes T and F ≥ once |
| Decision/Condition coverage | DCC | DC + CC simultaneously |
| **Multiple Condition coverage** | **MCC** | All combinations of condition truth values in every decision; MCC ⊃ DCC |
| Predicate coverage | PC | Every path exercised under all possible condition combinations affecting it |

### Full coverage target (this project)
**MCC + Predicate Coverage** = design TCs that:
- cover every independent path (basis set),
- in each decision exercise **all** 2ⁿ combinations of n conditions,
- ensure every statement is executed.

For decisions with a **single condition** (most cases): 2 TCs per decision (T + F) suffice for both DC and MCC.
For decisions with **k conditions** joined by `&&`/`||`: 2ᵏ TCs needed for MCC.

---

## 5 · Independent Paths (Basis Set)

An independent path introduces at least one **new edge** not covered by any shorter path.

**Method:**
1. Count CC = P + 1.
2. Write path 1 as the "main" (typically the shortest/happy) path.
3. Each subsequent path diverges from a previous path at exactly one new decision.
4. Every edge must appear in at least one path.

**Notation:** list node IDs in order, e.g. `start → init → P1[F] → ret → exit`.

---

## 6 · Loop Testing (simple loop, max n iterations)

| Test case | What to test |
|-----------|-------------|
| `no` | Skip the loop entirely (0 passes) |
| `once` | Exactly 1 pass |
| `twice` | Exactly 2 passes |
| `nMinus1` | n−1 passes |
| `n` | Exactly n passes (typical) |
| `nPlus1` | n+1 passes (beyond boundary) |
| `mLessThanN` | m passes where 1 < m < n |

For **nested loops**: start at the innermost loop holding outer loops at minimum; work outward.

---

## 7 · Filling the WbtDescriptor

> Import path (from a specialized script):
> `import { writeWbt, WbtDescriptor } from './generate-wbt-forms';`
> Output base: `lib/<layer>/__tests__/wbt/`

```typescript
const descriptor: WbtDescriptor = {
  reqId:         'WBT-<LAYER>-<NN>',  // e.g. 'WBT-SVC-01'
  statement:     '<function signature and one-line behaviour>',
  data:          'Input: <param types>',
  precondition:  '<what must hold before the call>',
  results:       'Output: <return type>',
  postcondition: '<what must hold after the call>',

  // ── CFG ──────────────────────────────────────────────────────────────────
  cfgDot: `digraph CFG {
    rankdir=TB; splines=polyline;
    node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
    edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

    // START / EXIT (filled circles)
    start [label="" shape=circle width=0.25 style=filled fillcolor=black];
    exit  [label="" shape=circle width=0.25 style=filled fillcolor=black];

    // STATEMENT nodes
    s1 [label="<statement text>" shape=box];

    // DECISION nodes
    d1 [label="<condition>?" shape=diamond];

    // MERGE nodes (where paths reconverge)
    m1 [label="" shape=circle width=0.18 style=filled fillcolor=black];

    // Edges
    start  -> s1:n;
    s1:s   -> d1:n;
    d1:w   -> ...  [label="True"];
    d1:e   -> ...  [label="False"];
    // merge: True path from left enters :nw, False path from right enters :ne
    ...:s  -> m1:nw;
    ...:s  -> m1:ne;
    m1     -> next:n;
    // loop back: exit :w (west) to avoid routing through the diamond
    inc:w  -> d1:n [constraint=false];
    ret:s  -> exit;
  }`,

  cfgSourceCode: [
    'line 1 of source',
    'line 2 of source',
    // ...
  ],

  cyclomaticComplexity: {
    cc1Regions:        <N>,   // count of regions
    cc2EdgeNodePlus2:  <N>,   // E − N + 2
    cc3PredicatePlus1: <N>,   // P + 1
  },

  // Short label per predicate node, in the order used in conditionDecision[]
  predicates: ['condition text (D1)', 'condition text (D2)'],

  // One entry per independent path (count = CC)
  paths: [
    { id: '1', description: 'start → ... → exit  (brief scenario)' },
    { id: '2', description: 'start → ... → exit' },
  ],

  hasLoopCoverage: true,  // set false if no loops

  // ── Test cases ────────────────────────────────────────────────────────────
  // Full coverage = every path covered + all condition combinations (MCC)
  tcRows: [
    {
      noTc: '1',
      inputData: '<describe inputs>',
      expected:  '<describe expected output>',
      statementCoverage: true,          // does this TC add new statement coverage?
      conditionDecision: [
        // Per predicate: [coversTrue, coversFalse]
        // A TC covers True if it causes that predicate to evaluate to true.
        [false, true],   // D1: only False branch exercised by this TC
        [false, false],  // D2: not reached
      ],
      pathCoverage: [true, false, false], // which independent path this TC walks
      loopCoverage: { no: true },         // omit if hasLoopCoverage=false
    },
    // ... one row per TC
  ],

  remarks: [
    '1) <note about impossible paths, redundant TCs, etc.>',
  ],

  tcsFailed:       0,
  bugsFound:       0,
  bugsFixed:       'n/a',
  retested:        'not yet',
  retestRun:       0,
  coveragePercent: '100%',
};
```

### conditionDecision[][] rules
- Array length = `predicates.length`.
- Each element `[coversT, coversF]`: set `true` if this TC causes that predicate to evaluate to that outcome.
- A TC that never reaches predicate Dₙ → `[false, false]`.
- For MCC: across all TCs, every predicate must have both T and F covered.

### pathCoverage[] rules
- Array length = `paths.length`.
- Set `true` for the path(s) this TC walks.
- A TC may walk more than one path only if it exercises a loop (the same path repeated ≠ two different paths).
- Goal: every `paths[i]` has at least one TC with `pathCoverage[i] = true`.

---

## 8 · Jest Test Structure

### File locations
```
lib/<layer>/__tests__/wbt/<tested-file-name>/
    <tested-file-name>.test.ts      ← Jest tests
    <function>-wbt-form.xlsx        ← generated xlsx (same directory)
```

Examples by layer:
- Schema: `lib/schema/__tests__/wbt/user-schema/user-schema.test.ts`
- Repository: `lib/user-repository/__tests__/wbt/user-repository/user-repository.test.ts`
- Service: `lib/user-service/__tests__/wbt/user-service/user-service.test.ts`
- Utils: `lib/utils/__tests__/wbt/utils/utils.test.ts`

### Naming convention (Right-BICEP)
```
functionName_Path<N>_<scenario>_<expectedOutcome>
functionName_Loop_<variant>_<expectedOutcome>
```
Examples:
- `createMember_Path1_validInput_returnsMember`
- `createMember_Path2_emailAlreadyExists_throwsConflictError`
- `sumArray_Loop_skip_returnsZero`
- `sumArray_Loop_once_returnsSingleElement`

### Mock setup (UNIT tests — always mock dependencies)

**Service tests** — mock the repository interface:
```typescript
import { mock, mockReset } from 'jest-mock-extended';
import { UserRepositoryInterface } from '@/lib/user-repository/user-repository.interface';
import { UserService } from '@/lib/user-service/user-service';

const mockUserRepo = mock<UserRepositoryInterface>();

beforeEach(() => {
    mockReset(mockUserRepo);
    (UserService as any).instance = undefined;
});
```

**Repository tests** — mock PrismaClient directly:
```typescript
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { UserRepository } from '@/lib/user-repository/user-repository';

const mockPrisma = mockDeep<PrismaClient>();

beforeEach(() => {
    mockReset(mockPrisma);
    (UserRepository as any).instance = undefined;
});
```

**Schema tests** — no mocks needed (pure validation functions).

### Describe structure

One top-level `describe` per function under test. Inside, one sub-describe per coverage type:

```typescript
describe('functionName', () => {

    describe('Independent Paths', () => {

        it('functionName_Path1_<scenario>_<expectedOutcome>', async () => {
            // arrange
            mockRepo.findByEmail.mockResolvedValue(null);

            // act
            const result = await service.functionName(validInput);

            // assert
            expect(result).toEqual(expectedValue);
        });

        it('functionName_Path2_<scenario>_<expectedOutcome>', async () => {
            // arrange
            mockRepo.findByEmail.mockResolvedValue(existingUser);

            // act & assert
            await expect(service.functionName(input)).rejects.toThrow(ConflictError);
        });

        // For MCC: add extra TCs for each 2^k combination when a decision has k>1 conditions
    });

    describe('Loop Coverage', () => {
        // Only include this sub-describe if the function contains loops

        it('functionName_Loop_skip_<expectedOutcome>', async () => {
            // arrange — input that causes 0 loop iterations
            // act
            // assert
        });

        it('functionName_Loop_once_<expectedOutcome>', async () => { ... });
        it('functionName_Loop_twice_<expectedOutcome>', async () => { ... });
        it('functionName_Loop_n_<expectedOutcome>', async () => { ... });
    });

});
```

### Running tests and verifying coverage

After writing the tests, **always** run Jest and confirm 100% coverage before reporting the task done:

```bash
# Run all WBT tests for the file under test
npx jest --testPathPattern="__tests__/wbt/<tested-file-name>" --coverage

# Or run the full suite
npm test -- --coverage
```

The coverage report must show **100% Statements, Branches, Functions, and Lines** for the file under test. If any line is uncovered, add the missing TC (another independent path or MCC combination) and re-run until green.

Record the actual results in each TC row's `actualResult` field (default: `'Passed'`), and update `tcsFailed`, `bugsFound`, and `coveragePercent` in the descriptor before regenerating the xlsx.

### FIRST principles checklist
- **Fast** — no real I/O, no sleep; mock everything external.
- **Independent** — each `it()` sets up its own mocks; no shared mutable state between tests.
- **Repeatable** — `mockReset` + singleton reset in `beforeEach` ensure clean state.
- **Self-validating** — every test ends with an `expect` that clearly passes or fails.
- **Timely** — tests are written alongside (or before) the code under test.

### AAA pattern
Never include `// arrange`, `// act`, `// assert` comments inside any it() body. Structure each test with one blank line between arrange, act, and assert blocks. The act must use the exact variable declared in arrange as its input. For tests that assert on thrown errors, do not merge act+assert — keep them as separate blocks:


```typescript
it('example_Path1_validInput_returnsValue', () => {
    const inputValue: string = 'hello';

    const result = fn(inputValue);

    expect(result).toBe('hello');
});

it('example_Path2_invalidInput_throwsError', () => {
    const inputValue: string = '';

    const result = () => fn(inputValue);

    expect(result).toThrow(SomeError);
});

// async throwing variant
it('example_Path2_invalidInput_throwsError', async () => {
    const inputValue: string = '';

    const result = async () => await fn(inputValue);

    await expect(result()).rejects.toThrow(SomeError);
});
```

---

## 9 · Output File Locations

| Layer | Script | Output base path |
|-------|--------|-----------------|
| Schema | `npm run generate-schema-wbt-forms` | `lib/schema/__tests__/wbt/` |
| Repository | `npm run generate-repository-wbt-forms` | `lib/<repo-name>/__tests__/wbt/` |
| Service | `npm run generate-service-wbt-forms` | `lib/<service-name>/__tests__/wbt/` |
| Utils | `npm run generate-utils-wbt-forms` | `lib/utils/__tests__/wbt/` |

Run **all** at once: `npm run generate-wbt-forms`

---

## 10 · Common Mistakes to Avoid

| Mistake | Correct approach |
|---------|-----------------|
| Using `:sw` or `:se` ports on a diamond | Use `:w` (True/left vertex) and `:e` (False/right vertex) |
| Side edges on statement boxes | Statement boxes: `:n` in, `:s` out only |
| Curved edges | Always include `splines=polyline` in the DOT preamble |
| Merge edges both entering from the same side | Use `:nw` for the True/left path and `:ne` for the False/right path on the merge node |
| Loop back-edge routing through a node | Exit from `:w` (west) of the last loop-body node, not `:s` |
| Missing merge circle | Add a merge node wherever 2+ paths reconverge |
| CC₁ ≠ CC₂ ≠ CC₃ | Re-count edges, nodes, and regions — they must all agree |
| Fewer TCs than CC | You need at least CC test cases for full path coverage |
| `conditionDecision` length ≠ `predicates` length | They must have identical length |
| `pathCoverage` length ≠ `paths` length | They must have identical length |
| Loop TC without `hasLoopCoverage: true` | Set the flag or the loop columns won't appear |

## 11 · Remarks — What to Always Document

Every `remarks` array must explain the **why** behind decisions that are not immediately obvious from the TC table. Always include a remark for each of the following that applies:

### Statement coverage
Explain why only certain TCs have `statementCoverage: true`. The rule is incremental — only the first TC to execute a previously uncovered statement gets `true`.

> *"statementCoverage is marked X only for TC1–TC3 because each one is the first to reach a previously uncovered statement (init, add, ret respectively). TC4 re-executes already-covered statements and adds no new SC."*

### No Condition/Decision section
Whenever `predicates: []`, explain why the section is absent.

> *"No Condition/Decision Coverage section is generated because the function contains zero predicate nodes — there are no branches to cover."*

### No Loop Coverage section
Whenever `hasLoopCoverage: false`, explain why.

> *"The regex iterates internally inside the JS engine — there are no explicit loop nodes in the CFG; hasLoopCoverage is false and no Loop Coverage section is generated."*

### Extra TCs beyond CC
When you add more TCs than the CC number requires, justify each extra batch.

> *"TCs 4–7 are added for MCC completeness: each exercises a distinct 2ᵏ combination of conditions in D2 that would not be covered by the basis-set paths alone."*

### Impossible or unreachable paths
Note any paths that cannot be exercised and why.

> *"Path 3 (D1[T] → D2[T]) is impossible: the compiler guarantees X is never null when Y holds, so D2 is never reached on the True branch of D1."*

### TCs that subsume others
When one TC makes a previous TC redundant for a given coverage criterion, note it.

> *"TC4 subsumes TC2 and TC3 for Condition/Decision Coverage — it exercises all four combinations of P1×P2 on its own."*

### Loop boundary justification
When certain loop variants (`nMinus1`, `nPlus1`, `mLessThanN`) are omitted or collapsed, explain why.

> *"n−1 / n+1 / m<n variants are structurally identical to paths 2 or 3 with a longer array — they exercise no new edges and are not separate independent paths."*