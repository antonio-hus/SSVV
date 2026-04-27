/**
 * generate-it-forms.ts
 * Run: npm run generate-it-forms
 *
 * Integration test form rendering pipeline.
 * Produces one Excel workbook per method under test.
 *
 * Sheets per workbook:
 *   Problem         →  statement, specification, results, remarks
 *   IT_Source_Graph →  tested source code panel + module dependency graph (optional)
 *   IT_TC_Coverage  →  test case table
 *   IT_Statistics   →  testing / debugging / re-testing summary
 */

import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '..');

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ItTcRow {
    noTc: string;
    arrange: string;
    act: string;
    expectedReturn: string;
    expectedDbState: string;
    actualResult?: string;
}

export interface ItDescriptor {
    reqId: string;
    statement: string;
    data: string;
    precondition: string;
    results: string;
    postcondition: string;
    tcRows: ItTcRow[];
    remarks?: string[];
    tcsFailed?: number;
    bugsFound?: number;
    bugsFixed?: number | string;
    retested?: string;
    retestRun?: number | string;
    retestPassed?: number | string;
    retestFailed?: number | string;
    coveragePercent?: number | string;
    /**
     * Graphviz DOT source for the module-dependency graph.
     * When supplied, the IT_Source_Graph sheet is rendered;
     * when omitted the sheet is skipped entirely.
     */
    moduleDot?: string;
    /**
     * Source lines of the method under test, shown as a monospace panel
     * to the left of the module-dependency graph.
     */
    sourceCode?: string[];
}

// ── SVG / PNG rendering helpers (shared with WBT pipeline) ────────────────────

function esc(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function parseSvgDims(svg: string): {w: number; h: number} {
    const vb = svg.match(/viewBox="[^"]*?(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"/);
    if (vb) return {w: parseFloat(vb[1]), h: parseFloat(vb[2])};
    const wm = svg.match(/\bwidth="([\d.]+)pt"/);
    const hm = svg.match(/\bheight="([\d.]+)pt"/);
    return {w: wm ? parseFloat(wm[1]) : 400, h: hm ? parseFloat(hm[1]) : 500};
}

function extractSvgInner(svg: string): string {
    return svg
        .replace(/<\?xml[\s\S]*?\?>\s*/g, '')
        .replace(/<!DOCTYPE[\s\S]*?>\s*/g, '')
        .replace(/<!--[\s\S]*?-->\s*/g, '')
        .replace(/<svg[^>]*>\s*/g, '')
        .replace(/\s*<\/svg>\s*$/g, '');
}

/**
 * Combines a source-code panel (left) with any SVG (right) into a single SVG.
 * Identical in contract to the WBT equivalent so the same pipeline can be reused.
 */
function buildCombinedSvg(graphSvg: string, sourceCode: string[]): string {
    const graph      = parseSvgDims(graphSvg);
    const graphInner = extractSvgInner(graphSvg);

    const LN_COL_W    = 24;
    const FONT_SIZE   = 9;
    const MIN_LINE_H  = 13;
    const HEADER_H    = 30;
    const BOTTOM_PAD  = 8;
    const CH_WIDTH_PT = 5.4;
    const MIN_PANEL_W = 160;

    const maxLineChars = Math.max(...sourceCode.map(l => l.length), 0);
    const neededTextW  = LN_COL_W + 4 + maxLineChars * CH_WIDTH_PT + 8;
    const SRC_PANEL_W  = Math.max(MIN_PANEL_W, Math.ceil(neededTextW));

    const srcNaturalH = HEADER_H + sourceCode.length * MIN_LINE_H + BOTTOM_PAD;
    const totalH      = Math.max(graph.h, srcNaturalH);

    const srcLines = sourceCode
        .map((line, i) => {
            const y = HEADER_H + i * MIN_LINE_H;
            return (
                `<text x="${LN_COL_W - 2}" y="${y}" text-anchor="end" ` +
                `font-size="${FONT_SIZE}" fill="#888" font-family="monospace">${i + 1}</text>` +
                `<text x="${LN_COL_W + 2}" y="${y}" xml:space="preserve" ` +
                `font-size="${FONT_SIZE}" fill="#222" font-family="monospace">${esc(line)}</text>`
            );
        })
        .join('\n');

    const totalW = SRC_PANEL_W + graph.w;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${totalW}pt" height="${totalH}pt"
     viewBox="0 0 ${totalW} ${totalH}">
  <!-- source-code panel -->
  <rect width="${SRC_PANEL_W}" height="${totalH}" fill="#f6f6f6"/>
  <rect width="${LN_COL_W}"    height="${totalH}" fill="#e2e2e2"/>
  <text x="${SRC_PANEL_W / 2}" y="13" text-anchor="middle"
        font-size="10" font-weight="bold" fill="#444" font-family="Helvetica">Source</text>
  ${srcLines}
  <!-- divider -->
  <line x1="${SRC_PANEL_W}" y1="0" x2="${SRC_PANEL_W}" y2="${totalH}"
        stroke="#b0b0b0" stroke-width="1"/>
  <!-- module-dependency graph -->
  <svg x="${SRC_PANEL_W}" y="0" width="${graph.w}" height="${totalH}"
       viewBox="0 0 ${graph.w} ${graph.h}">
    ${graphInner}
  </svg>
</svg>`;
}

function readPngDims(buf: Buffer): {w: number; h: number} {
    if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') {
        return {w: 800, h: 600};
    }
    return {w: buf.readUInt32BE(16), h: buf.readUInt32BE(20)};
}

async function renderDotToSvg(dotSource: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {instance} = require('@viz-js/viz');
    const viz = await instance();
    return viz.renderString(dotSource, {format: 'svg'});
}

async function svgToPngBuffer(svg: string): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {Resvg} = require('@resvg/resvg-js');
    const resvg = new Resvg(svg, {
        font: {loadSystemFonts: true},
        fitTo: {mode: 'zoom', value: 2},
    });
    return Buffer.from(resvg.render().asPng());
}

/** Resolves the module-dependency graph to a PNG buffer, or null if no DOT was supplied. */
async function resolveModuleGraphBuffer(
    d: ItDescriptor,
): Promise<{buffer: Buffer; extension: 'png'} | null> {
    if (!d.moduleDot) return null;
    const graphSvg   = await renderDotToSvg(d.moduleDot);
    const finalSvg   = d.sourceCode?.length
        ? buildCombinedSvg(graphSvg, d.sourceCode)
        : graphSvg;
    const buffer = await svgToPngBuffer(finalSvg);
    return {buffer, extension: 'png'};
}

// ── Excel style helpers ────────────────────────────────────────────────────────

const THIN = {style: 'thin' as const};
const BORDER: Partial<ExcelJS.Borders> = {top: THIN, left: THIN, bottom: THIN, right: THIN};
const FILL_SECTION: ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFBDD7EE'}};
const FILL_HEADER:  ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFD9E1F2'}};
const FILL_LABEL:   ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFEDEDED'}};
const FILL_PASS:    ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFE2EFDA'}};
const FILL_FAIL:    ExcelJS.Fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFFFC7CE'}};

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
    cell.font      = {color: {argb: 'FF375623'}};
    cell.fill      = FILL_PASS;
    cell.border    = BORDER;
    cell.alignment = {horizontal: 'center', vertical: 'middle'};
}

function styleFailed(cell: ExcelJS.Cell): void {
    cell.font      = {color: {argb: 'FF9C0006'}};
    cell.fill      = FILL_FAIL;
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

function addProblemSheet(workbook: ExcelJS.Workbook, descriptor: ItDescriptor): void {
    const worksheet = workbook.addWorksheet('Problem');

    let row = worksheet.addRow([`Statement: ${descriptor.statement}`, '']);
    worksheet.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).border    = BORDER;
    row.getCell(1).alignment = {wrapText: true, vertical: 'top'};

    worksheet.addRow(['', '']);

    row = worksheet.addRow(['Specification', '']);
    worksheet.mergeCells(`A${row.number}:B${row.number}`);
    styleSection(row.getCell(1));

    row = worksheet.addRow(['Data', descriptor.data]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

    row = worksheet.addRow(['Precondition', descriptor.precondition]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

    worksheet.addRow(['', '']);

    row = worksheet.addRow(['Results', '']);
    worksheet.mergeCells(`A${row.number}:B${row.number}`);
    styleSection(row.getCell(1));

    row = worksheet.addRow(['', descriptor.results]);
    styleData(row.getCell(1));
    styleData(row.getCell(2));

    row = worksheet.addRow(['Postcondition', descriptor.postcondition]);
    styleLabel(row.getCell(1));
    styleData(row.getCell(2));

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

    autoFitWorksheet(worksheet);
}

// ── Sheet: IT_Source_Graph ─────────────────────────────────────────────────────
//
// Rendered only when descriptor.moduleDot is provided.
// The combined PNG (source panel + module-dependency graph) fills the sheet.
//

async function addSourceGraphSheet(
    workbook: ExcelJS.Workbook,
    descriptor: ItDescriptor,
): Promise<void> {
    const img = await resolveModuleGraphBuffer(descriptor);
    if (!img) return; // sheet is omitted when no DOT is supplied

    const worksheet = workbook.addWorksheet('IT_Source_Graph');

    const ROW_H_PT   = 16;
    const PX_PER_COL = 64;

    const {w: pngW, h: pngH} = readPngDims(img.buffer);
    // The PNG was rendered at 2× zoom; scale back to logical size.
    const logicalW    = pngW / 2;
    const logicalH    = pngH / 2;
    const logicalH_pt = logicalH * 0.75;

    const imageRows  = Math.max(Math.ceil(logicalH_pt / ROW_H_PT), 20);
    const imageCols  = Math.max(14, Math.ceil(logicalW / PX_PER_COL) + 2);

    for (let r = 1; r <= imageRows; r++) worksheet.getRow(r).height = ROW_H_PT;
    for (let c = 1; c <= imageCols;  c++) worksheet.getColumn(c).width = 11;

    // @ts-expect-error — ExcelJS types omit buffer overload
    const imageId = workbook.addImage({buffer: img.buffer, extension: img.extension});
    worksheet.addImage(imageId, {
        tl:     {col: 0, row: 0},
        ext:    {width: logicalW, height: logicalH},
        editAs: 'oneCell',
    });
}

// ── Sheet: IT_TC_Coverage ──────────────────────────────────────────────────────

function addTcCoverageSheet(workbook: ExcelJS.Workbook, descriptor: ItDescriptor): void {
    const worksheet = workbook.addWorksheet('IT_TC_Coverage');

    const C_NOTC       = 2;
    const C_ARRANGE    = 3;
    const C_ACT        = 4;
    const C_EXP_RETURN = 5;
    const C_EXP_DB     = 6;
    const C_ACTUAL     = 7;
    const C_LAST       = C_ACTUAL;

    const blank = (): string[] => new Array(C_LAST).fill('');

    const headerRow = worksheet.addRow(blank());
    headerRow.getCell(C_NOTC).value       = 'No TC';
    headerRow.getCell(C_ARRANGE).value    = 'Arrange';
    headerRow.getCell(C_ACT).value        = 'Act';
    headerRow.getCell(C_EXP_RETURN).value = 'Expected Return Value';
    headerRow.getCell(C_EXP_DB).value     = 'Expected Database State';
    headerRow.getCell(C_ACTUAL).value     = 'Actual Result';
    for (let column = C_NOTC; column <= C_LAST; column++) styleHeader(headerRow.getCell(column));
    headerRow.height = 22;

    for (const tcRow of descriptor.tcRows) {
        const row = worksheet.addRow(blank());

        row.getCell(C_NOTC).value       = tcRow.noTc;
        row.getCell(C_ARRANGE).value    = tcRow.arrange;
        row.getCell(C_ACT).value        = tcRow.act;
        row.getCell(C_EXP_RETURN).value = tcRow.expectedReturn;
        row.getCell(C_EXP_DB).value     = tcRow.expectedDbState;

        styleData(row.getCell(C_NOTC));
        row.getCell(C_NOTC).alignment = {horizontal: 'center', vertical: 'middle'};
        styleData(row.getCell(C_ARRANGE));
        styleData(row.getCell(C_ACT));
        styleData(row.getCell(C_EXP_RETURN));
        styleData(row.getCell(C_EXP_DB));

        const actualResult = tcRow.actualResult ?? 'Passed';
        row.getCell(C_ACTUAL).value = actualResult;
        if (actualResult === 'Passed') {
            stylePassed(row.getCell(C_ACTUAL));
        } else {
            styleFailed(row.getCell(C_ACTUAL));
        }
    }

    autoFitWorksheet(worksheet);
}

// ── Sheet: IT_Statistics ───────────────────────────────────────────────────────

function addStatisticsSheet(workbook: ExcelJS.Workbook, descriptor: ItDescriptor): void {
    const worksheet = workbook.addWorksheet('IT_Statistics');

    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

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
    [4, 5, 6, 7, 10, 11, 12, 13].forEach(column => {
        sectionRow.getCell(column).fill   = FILL_SECTION;
        sectionRow.getCell(column).border = BORDER;
    });

    const headerRow = worksheet.addRow([
        '',
        'Req. ID',
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

    const totalRun  = descriptor.tcRows.length;
    const tcsFailed = descriptor.tcsFailed ?? 0;

    const dataRow = worksheet.addRow([
        '',
        descriptor.reqId,
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
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach(column =>
        styleData(dataRow.getCell(column)),
    );

    autoFitWorksheet(worksheet);
}

// ── Workbook assembly ──────────────────────────────────────────────────────────

async function buildWorkbook(descriptor: ItDescriptor): Promise<ExcelJS.Workbook> {
    const workbook   = new ExcelJS.Workbook();
    workbook.creator = 'generate-it-forms';
    workbook.created = new Date();

    addProblemSheet(workbook, descriptor);
    await addSourceGraphSheet(workbook, descriptor); // no-op when moduleDot is absent
    addTcCoverageSheet(workbook, descriptor);
    addStatisticsSheet(workbook, descriptor);

    return workbook;
}

export async function writeIt(descriptor: ItDescriptor, outputPath: string): Promise<void> {
    const directory = path.dirname(outputPath);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, {recursive: true});
    const workbook = await buildWorkbook(descriptor);
    await workbook.xlsx.writeFile(outputPath);
    console.log(`  ✓ ${path.relative(ROOT, outputPath)}`);
}