/**
 * generate-ft-forms.ts
 * Run: npm run generate-ft-forms
 *
 * Frontend / component test documentation pipeline.
 * Produces one Excel workbook per component under test.
 *
 * Sheets per workbook:
 *   Problem         →  component statement, props spec, render output, remarks
 *   FT_TC_Coverage  →  test case table (with description column)
 *   FT_Statistics   →  testing / debugging / re-testing summary
 */

import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '..');

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FtTcRow {
    /** E.g. "TC-FT-001" */
    noTc: string;
    /** Human-readable summary of what this test case verifies. */
    description: string;
    /**
     * Arrange: component props, mocked hooks/modules, context providers,
     * router state, or any other setup required before rendering.
     */
    arrange: string;
    /**
     * Act: the user event, render trigger, or assertion target
     * (e.g. "fireEvent.click(button)", "renders without interaction", "resize to 375px").
     */
    act: string;
    /**
     * Expected output: the rendered DOM state, returned value, or observable
     * side-effect that must hold after the act step.
     */
    expectedOutput: string;
    /**
     * "Passed" | "Failed" | custom note.
     * Defaults to "Passed" when omitted.
     */
    actualResult?: string;
}

export interface FtDescriptor {
    /** Short component identifier used in the workbook filename. */
    componentName: string;
    /** Requirement / user-story ID this component satisfies. */
    reqId: string;
    /** One-sentence statement of what the component does. */
    statement: string;
    /**
     * Props specification: list accepted props, their types, defaults,
     * and whether they are required.
     */
    props: string;
    /**
     * Preconditions: required context providers (Theme, Auth, Router…),
     * global mocks (next/router, next/image, fetch…), or env variables
     * that must be in place before rendering.
     */
    precondition: string;
    /**
     * Expected render output: high-level description of what the component
     * renders in its default / happy-path state.
     */
    renderOutput: string;
    /**
     * Postcondition: side-effects produced after interaction
     * (callbacks called, store mutations, navigation triggered, etc.).
     * Use "None" when the component is purely presentational.
     */
    postcondition: string;
    tcRows: FtTcRow[];
    remarks?: string[];

    // ── Statistics fields ────────────────────────────────────────────────────
    /** Number of test cases that failed. Defaults to 0. */
    tcsFailed?: number;
    /** Number of bugs / defects found during testing. */
    bugsFound?: number;
    /** Number of bugs fixed (or "n/a"). */
    bugsFixed?: number | string;
    /** Whether the component was re-tested after fixes ("Yes" | "No" | "not yet"). */
    retested?: string;
    /** Number of test cases re-run. */
    retestRun?: number | string;
    /** Number of re-test cases that passed. */
    retestPassed?: number | string;
    /** Number of re-test cases that failed. */
    retestFailed?: number | string;
    /** Statement / branch coverage percentage (or "n/a"). */
    coveragePercent?: number | string;
    /**
     * Testing tool used (defaults to "Jest + React Testing Library").
     * Override if you use Playwright, Cypress component, Storybook, etc.
     */
    testingTool?: string;
}

// ── Excel style helpers ────────────────────────────────────────────────────────

const THIN = {style: 'thin' as const};
const BORDER: Partial<ExcelJS.Borders> = {top: THIN, left: THIN, bottom: THIN, right: THIN};

const FILL_SECTION: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFBDD7EE'}};
const FILL_HEADER:  ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFD9E1F2'}};
const FILL_LABEL:   ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFEDEDED'}};
const FILL_PASS:    ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFE2EFDA'}};
const FILL_FAIL:    ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFFFC7CE'}};
const FILL_SKIP:    ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFFFF2CC'}};

function styleSection(cell: ExcelJS.Cell): void {
    cell.font      = {bold: true, color: {argb: 'FF1F3864'}};
    cell.fill      = FILL_SECTION;
    cell.border    = BORDER;
    cell.alignment = {horizontal: 'center', vertical: 'middle', wrapText: true};
}

function styleHeader(cell: ExcelJS.Cell): void {
    cell.font      = {bold: true};
    cell.fill      = FILL_HEADER;
    cell.border    = BORDER;
    cell.alignment = {wrapText: true, vertical: 'middle', horizontal: 'center'};
}

function styleLabel(cell: ExcelJS.Cell): void {
    cell.font      = {bold: true};
    cell.fill      = FILL_LABEL;
    cell.border    = BORDER;
    cell.alignment = {wrapText: true, vertical: 'top'};
}

function styleData(cell: ExcelJS.Cell): void {
    cell.border    = BORDER;
    cell.alignment = {wrapText: true, vertical: 'top'};
}

function stylePassed(cell: ExcelJS.Cell): void {
    cell.font      = {bold: true, color: {argb: 'FF375623'}};
    cell.fill      = FILL_PASS;
    cell.border    = BORDER;
    cell.alignment = {horizontal: 'center', vertical: 'middle'};
}

function styleFailed(cell: ExcelJS.Cell): void {
    cell.font      = {bold: true, color: {argb: 'FF9C0006'}};
    cell.fill      = FILL_FAIL;
    cell.border    = BORDER;
    cell.alignment = {horizontal: 'center', vertical: 'middle'};
}

function styleSkipped(cell: ExcelJS.Cell): void {
    cell.font      = {bold: true, color: {argb: 'FF7F6000'}};
    cell.fill      = FILL_SKIP;
    cell.border    = BORDER;
    cell.alignment = {horizontal: 'center', vertical: 'middle'};
}

function autoFitWorksheet(
    worksheet: ExcelJS.Worksheet,
    skipColumns: number[] = [],
    minWidth = 10,
    maxWidth = 80,
): void {
    worksheet.columns.forEach((column, index) => {
        const columnNumber = index + 1;
        if (skipColumns.includes(columnNumber)) return;
        let maximumLength = minWidth;
        // @ts-expect-error — ExcelJS internal iteration
        column.eachCell({includeEmpty: true}, (cell: ExcelJS.Cell) => {
            if (cell.value && !cell.isMerged) {
                const longestLine = cell.value
                    .toString()
                    .split('\n')
                    .reduce((max: number, line: string) => Math.max(max, line.length), 0);
                if (longestLine > maximumLength) maximumLength = longestLine;
            }
        });
        column.width = Math.min(maximumLength + 4, maxWidth);
    });

    worksheet.eachRow(row => {
        let maximumLines = 1;
        row.eachCell({includeEmpty: true}, (cell, columnNumber) => {
            if (cell.value) {
                const content        = cell.value.toString();
                const lineCount      = content.split('\n').length;
                const availableWidth = worksheet.getColumn(columnNumber).width ?? 10;
                const charsPerLine   = (cell.isMerged ? 120 : availableWidth) * 0.9;
                const wrapped        = Math.ceil(content.length / Math.max(charsPerLine, 1));
                const totalLines     = Math.max(lineCount, wrapped);
                if (totalLines > maximumLines) maximumLines = totalLines;
            }
        });
        const targetHeight  = maximumLines * 15 + 5;
        const currentHeight = row.height ?? 0;
        if (targetHeight > currentHeight) row.height = targetHeight;
    });
}

// ── Sheet: Problem ─────────────────────────────────────────────────────────────
//
// Captures the component's specification: what it is, what props it accepts,
// what it renders in the happy path, and what postconditions it must satisfy.
//

function addProblemSheet(workbook: ExcelJS.Workbook, descriptor: FtDescriptor): void {
    const worksheet = workbook.addWorksheet('Problem');

    // ── Statement ──────────────────────────────────────────────────────────────
    let row = worksheet.addRow([
        `Component: ${descriptor.componentName} — ${descriptor.statement}`,
        '',
    ]);
    worksheet.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).border    = BORDER;
    row.getCell(1).font      = {bold: true, size: 11};
    row.getCell(1).alignment = {wrapText: true, vertical: 'top'};
    row.height = 28;

    worksheet.addRow(['', '']);

    // ── Specification ──────────────────────────────────────────────────────────
    row = worksheet.addRow(['Specification', '']);
    worksheet.mergeCells(`A${row.number}:B${row.number}`);
    styleSection(row.getCell(1));

    row = worksheet.addRow(['Requirement ID', descriptor.reqId]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

    row = worksheet.addRow(['Testing Tool', descriptor.testingTool ?? 'Jest + React Testing Library']);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

    row = worksheet.addRow(['Props', descriptor.props]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

    row = worksheet.addRow(['Precondition', descriptor.precondition]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

    worksheet.addRow(['', '']);

    // ── Results ────────────────────────────────────────────────────────────────
    row = worksheet.addRow(['Results', '']);
    worksheet.mergeCells(`A${row.number}:B${row.number}`);
    styleSection(row.getCell(1));

    row = worksheet.addRow(['Render Output', descriptor.renderOutput]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

    row = worksheet.addRow(['Postcondition', descriptor.postcondition]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

    // ── Remarks ────────────────────────────────────────────────────────────────
    if (descriptor.remarks && descriptor.remarks.length > 0) {
        worksheet.addRow(['', '']);

        row = worksheet.addRow(['Remarks', '']);
        worksheet.mergeCells(`A${row.number}:B${row.number}`);
        styleSection(row.getCell(1));

        for (const remark of descriptor.remarks) {
            row = worksheet.addRow(['', remark]);
            styleData(row.getCell(1));
            styleData(row.getCell(2));
        }
    }

    worksheet.getColumn(1).width = 22;
    autoFitWorksheet(worksheet, [1]);
}

// ── Sheet: FT_TC_Coverage ──────────────────────────────────────────────────────
//
// One row per test case.  The "Description" column is new compared to the IT
// form — it captures the plain-English intent of the test so the table is
// self-documenting without needing to read the Jest source.
//

function addTcCoverageSheet(workbook: ExcelJS.Workbook, descriptor: FtDescriptor): void {
    const worksheet = workbook.addWorksheet('FT_TC_Coverage');

    // Column indices (1-based; column A is intentionally left blank as a margin)
    const C_NOTC        = 2;
    const C_DESCRIPTION = 3;
    const C_ARRANGE     = 4;
    const C_ACT         = 5;
    const C_EXPECTED    = 6;
    const C_ACTUAL      = 7;
    const C_LAST        = C_ACTUAL;

    const blank = (): string[] => new Array(C_LAST).fill('');

    // ── Column header row ──────────────────────────────────────────────────────
    const headerRow = worksheet.addRow(blank());
    headerRow.getCell(C_NOTC).value        = 'No TC';
    headerRow.getCell(C_DESCRIPTION).value = 'Description';
    headerRow.getCell(C_ARRANGE).value     = 'Arrange';
    headerRow.getCell(C_ACT).value         = 'Act';
    headerRow.getCell(C_EXPECTED).value    = 'Expected Output';
    headerRow.getCell(C_ACTUAL).value      = 'Actual Result';

    for (let col = C_NOTC; col <= C_LAST; col++) styleHeader(headerRow.getCell(col));
    headerRow.height = 22;

    // ── Data rows ──────────────────────────────────────────────────────────────
    for (const tcRow of descriptor.tcRows) {
        const row = worksheet.addRow(blank());

        row.getCell(C_NOTC).value        = tcRow.noTc;
        row.getCell(C_DESCRIPTION).value = tcRow.description;
        row.getCell(C_ARRANGE).value     = tcRow.arrange;
        row.getCell(C_ACT).value         = tcRow.act;
        row.getCell(C_EXPECTED).value    = tcRow.expectedOutput;

        styleData(row.getCell(C_NOTC));
        row.getCell(C_NOTC).alignment = {horizontal: 'center', vertical: 'middle'};
        styleData(row.getCell(C_DESCRIPTION));
        styleData(row.getCell(C_ARRANGE));
        styleData(row.getCell(C_ACT));
        styleData(row.getCell(C_EXPECTED));

        const result = tcRow.actualResult ?? 'Passed';
        row.getCell(C_ACTUAL).value = result;

        const lower = result.toLowerCase();
        if (lower === 'passed') {
            stylePassed(row.getCell(C_ACTUAL));
        } else if (lower.startsWith('skip')) {
            styleSkipped(row.getCell(C_ACTUAL));
        } else {
            styleFailed(row.getCell(C_ACTUAL));
        }
    }

    autoFitWorksheet(worksheet);
}

// ── Sheet: FT_Statistics ───────────────────────────────────────────────────────

function addStatisticsSheet(workbook: ExcelJS.Workbook, descriptor: FtDescriptor): void {
    const worksheet = workbook.addWorksheet('FT_Statistics');

    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

    // ── Section header row ─────────────────────────────────────────────────────
    const sectionRow = worksheet.addRow([
        '', '', 'Testing', '', '', '', '', 'Debugging', 'Re-testing', '', '', '', '',
    ]);
    worksheet.mergeCells(`C${sectionRow.number}:G${sectionRow.number}`);
    worksheet.mergeCells(`I${sectionRow.number}:M${sectionRow.number}`);
    sectionRow.getCell(1).border = BORDER;
    sectionRow.getCell(2).border = BORDER;
    styleSection(sectionRow.getCell(3));
    styleSection(sectionRow.getCell(8));
    styleSection(sectionRow.getCell(9));
    [4, 5, 6, 7, 10, 11, 12, 13].forEach(col => {
        sectionRow.getCell(col).fill   = FILL_SECTION;
        sectionRow.getCell(col).border = BORDER;
    });

    // ── Column header row ──────────────────────────────────────────────────────
    const headerRow = worksheet.addRow([
        '',
        'Component',
        'TCs run',
        'TCs passed',
        'TCs failed',
        '% Coverage',
        'No of BUGS',
        'Bugs Fixed',
        'Re-tested',
        'TCs run',
        'TCs passed',
        'TCs failed',
        '% Coverage',
    ]);
    headerRow.eachCell(cell => styleHeader(cell));

    // ── Data row ───────────────────────────────────────────────────────────────
    const totalRun  = descriptor.tcRows.length;
    const tcsFailed = descriptor.tcsFailed ?? 0;

    const dataRow = worksheet.addRow([
        '',
        descriptor.componentName,
        totalRun,
        totalRun - tcsFailed,
        tcsFailed,
        descriptor.coveragePercent ?? 'n/a',
        descriptor.bugsFound ?? 0,
        descriptor.bugsFixed ?? 'n/a',
        descriptor.retested ?? 'not yet',
        descriptor.retestRun ?? 0,
        descriptor.retestPassed ?? '-',
        descriptor.retestFailed ?? '-',
        '-',
    ]);
    styleLabel(dataRow.getCell(2));
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach(col =>
        styleData(dataRow.getCell(col)),
    );

    // ── Req ID footer ──────────────────────────────────────────────────────────
    worksheet.addRow([]);

    const reqRow = worksheet.addRow(['', 'Req. ID', descriptor.reqId]);
    styleLabel(reqRow.getCell(2));
    styleData(reqRow.getCell(3));

    autoFitWorksheet(worksheet);
}

// ── Workbook assembly ──────────────────────────────────────────────────────────

function buildWorkbook(descriptor: FtDescriptor): ExcelJS.Workbook {
    const workbook   = new ExcelJS.Workbook();
    workbook.creator = 'generate-ft-forms';
    workbook.created = new Date();

    addProblemSheet(workbook, descriptor);
    addTcCoverageSheet(workbook, descriptor);
    addStatisticsSheet(workbook, descriptor);

    return workbook;
}

export async function writeFt(descriptor: FtDescriptor, outputPath: string): Promise<void> {
    const directory = path.dirname(outputPath);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, {recursive: true});
    const workbook = buildWorkbook(descriptor);
    await workbook.xlsx.writeFile(outputPath);
    console.log(`  ✓ ${path.relative(ROOT, outputPath)}`);
}

// ── Example usage (entry point) ────────────────────────────────────────────────
//
// Replace the descriptors below with your real component data, then run:
//   npm run generate-ft-forms
//

async function main(): Promise<void> {
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});