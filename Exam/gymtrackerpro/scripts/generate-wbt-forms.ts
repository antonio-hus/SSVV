/**
 * generate-wbt-forms.ts
 * Run: npm run generate-wbt-forms
 *
 * CFG rendering pipeline:
 *   DOT string  →  @viz-js/viz (Graphviz WASM)  →  SVG
 *   SVG + source code panel  →  combined SVG  →  @resvg/resvg-js  →  PNG  →  Excel
 */

import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '..');

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WbtPath {
    id: string;
    description: string;
}

export interface WbtTcRow {
    noTc: string;
    inputData: string;
    expected: string;
    actualResult?: string;
    statementCoverage?: boolean;
    /** conditionDecision[predicateIndex] = [coversTrue, coversFalse] */
    conditionDecision?: [boolean, boolean][];
    /** pathCoverage[pathIndex] = true if this TC walks that path */
    pathCoverage?: boolean[];
    loopCoverage?: {
        no?: boolean;
        once?: boolean;
        twice?: boolean;
        nMinus1?: boolean;
        n?: boolean;
        nPlus1?: boolean;
        mLessThanN?: boolean;
    };
}

export interface WbtDescriptor {
    reqId: string;
    statement: string;
    data: string;
    precondition: string;
    results: string;
    postcondition: string;
    cfgDot?: string;
    cfgSourceCode?: string[];
    cfgImagePath?: string;
    cyclomaticComplexity: {
        cc1Regions: number;
        cc2EdgeNodePlus2: number;
        cc3PredicatePlus1: number;
    };
    predicates: string[];
    paths: WbtPath[];
    hasLoopCoverage?: boolean;
    tcRows: WbtTcRow[];
    remarks?: string[];
    tcsFailed?: number;
    bugsFound?: number;
    bugsFixed?: number | string;
    retested?: string;
    retestRun?: number | string;
    retestPassed?: number | string;
    retestFailed?: number | string;
    coveragePercent?: number | string;
}

// ── CFG image generation ───────────────────────────────────────────────────────

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseSvgDims(svg: string): { w: number; h: number } {
    const vb = svg.match(/viewBox="[^"]*?(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"/);
    if (vb) return { w: parseFloat(vb[1]), h: parseFloat(vb[2]) };
    const wm = svg.match(/\bwidth="([\d.]+)pt"/);
    const hm = svg.match(/\bheight="([\d.]+)pt"/);
    return { w: wm ? parseFloat(wm[1]) : 400, h: hm ? parseFloat(hm[1]) : 500 };
}

function extractSvgInner(svg: string): string {
    return svg
        .replace(/<\?xml[\s\S]*?\?>\s*/g, '')
        .replace(/<!DOCTYPE[\s\S]*?>\s*/g, '')
        .replace(/<!--[\s\S]*?-->\s*/g, '')
        .replace(/<svg[^>]*>\s*/g, '')
        .replace(/\s*<\/svg>\s*$/g, '');
}

function buildCombinedSvg(cfgSvg: string, sourceCode: string[]): string {
    const cfg     = parseSvgDims(cfgSvg);
    const cfgInner = extractSvgInner(cfgSvg);

    const LN_COL_W       = 24;
    const FONT_SIZE      = 9;
    const MIN_LINE_H     = 13;
    const HEADER_H       = 30;
    const BOTTOM_PAD     = 8;
    const CH_WIDTH_PT    = 5.4;
    const MIN_PANEL_W    = 160;

    const maxLineChars = Math.max(...sourceCode.map(l => l.length), 0);
    const neededTextW  = LN_COL_W + 4 + maxLineChars * CH_WIDTH_PT + 8;
    const SRC_PANEL_W  = Math.max(MIN_PANEL_W, Math.ceil(neededTextW));

    const srcNaturalH = HEADER_H + sourceCode.length * MIN_LINE_H + BOTTOM_PAD;
    const totalH      = Math.max(cfg.h, srcNaturalH);
    const lineH = MIN_LINE_H;

    const srcLines = sourceCode.map((line, i) => {
        const y = HEADER_H + i * lineH;
        return (
            `<text x="${LN_COL_W - 2}" y="${y}" text-anchor="end" ` +
            `font-size="${FONT_SIZE}" fill="#888" font-family="monospace">${i + 1}</text>` +
            `<text x="${LN_COL_W + 2}" y="${y}" xml:space="preserve" ` +
            `font-size="${FONT_SIZE}" fill="#222" font-family="monospace">${esc(line)}</text>`
        );
    }).join('\n');

    const totalW = SRC_PANEL_W + cfg.w;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${totalW}pt" height="${totalH}pt"
     viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${SRC_PANEL_W}" height="${totalH}" fill="#f6f6f6"/>
  <rect width="${LN_COL_W}" height="${totalH}" fill="#e2e2e2"/>
  <text x="${SRC_PANEL_W / 2}" y="13" text-anchor="middle"
        font-size="10" font-weight="bold" fill="#444" font-family="Helvetica">Source Code</text>
  ${srcLines}
  <line x1="${SRC_PANEL_W}" y1="0" x2="${SRC_PANEL_W}" y2="${totalH}"
        stroke="#b0b0b0" stroke-width="1"/>
  <svg x="${SRC_PANEL_W}" y="0" width="${cfg.w}" height="${totalH}"
       viewBox="0 0 ${cfg.w} ${cfg.h}">
    ${cfgInner}
  </svg>
</svg>`;
}

function readPngDims(buf: Buffer): { w: number; h: number } {
    if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') {
        return { w: 800, h: 600 };
    }
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

async function renderDotToSvg(dotSource: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { instance } = require('@viz-js/viz');
    const viz = await instance();
    return viz.renderString(dotSource, { format: 'svg' });
}

async function svgToPngBuffer(svg: string): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resvg } = require('@resvg/resvg-js');
    const resvg = new Resvg(svg, {
        font: { loadSystemFonts: true },
        fitTo: { mode: 'zoom', value: 2 },
    });
    return Buffer.from(resvg.render().asPng());
}

async function resolveCfgBuffer(d: WbtDescriptor): Promise<{ buffer: Buffer; extension: 'png' | 'jpeg' } | null> {
    if (d.cfgDot) {
        const cfgSvg   = await renderDotToSvg(d.cfgDot);
        const finalSvg = d.cfgSourceCode?.length ? buildCombinedSvg(cfgSvg, d.cfgSourceCode) : cfgSvg;
        const buffer = await svgToPngBuffer(finalSvg);
        return { buffer, extension: 'png' };
    }
    if (d.cfgImagePath) {
        const buffer    = fs.readFileSync(d.cfgImagePath);
        const extension = /\.(jpg|jpeg)$/i.test(d.cfgImagePath) ? 'jpeg' : 'png';
        return { buffer, extension };
    }
    return null;
}

// ── Excel style helpers ────────────────────────────────────────────────────────

const THIN = { style: 'thin' as const };
const BORDER: Partial<ExcelJS.Borders> = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const FILL_SECTION: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
const FILL_HEADER:  ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
const FILL_LABEL:   ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDEDED' } };
const FILL_PASS:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
const FILL_MARK:    ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

function styleSection(c: ExcelJS.Cell): void {
    c.font = { bold: true, color: { argb: 'FF1F3864' } };
    c.fill = FILL_SECTION; c.border = BORDER;
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}
function styleHeader(c: ExcelJS.Cell): void {
    c.font = { bold: true }; c.fill = FILL_HEADER; c.border = BORDER;
    c.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
}
function styleLabel(c: ExcelJS.Cell): void {
    c.font = { bold: true }; c.fill = FILL_LABEL; c.border = BORDER;
    c.alignment = { wrapText: true, vertical: 'top' };
}
function styleData(c: ExcelJS.Cell): void {
    c.border = BORDER; c.alignment = { wrapText: true, vertical: 'top' };
}
function stylePassed(c: ExcelJS.Cell): void {
    c.font = { color: { argb: 'FF375623' } }; c.fill = FILL_PASS; c.border = BORDER;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
}
function styleMark(c: ExcelJS.Cell): void {
    c.fill = FILL_MARK; c.border = BORDER;
    c.alignment = { horizontal: 'center', vertical: 'middle' };
}
function styleEmpty(c: ExcelJS.Cell): void {
    c.border = BORDER; c.alignment = { horizontal: 'center', vertical: 'middle' };
}

function autoFitWorksheet(ws: ExcelJS.Worksheet, skipCols: number[] = [], minWidth = 10, maxWidth = 80): void {
    ws.columns.forEach((col, i) => {
        const colNum = i + 1;
        if (skipCols.includes(colNum)) return;
        let maxLen = minWidth;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        col.eachCell({ includeEmpty: true }, cell => {
            if (cell.value && !cell.isMerged) {
                const content = cell.value.toString();
                const longestLine = content.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
                if (longestLine > maxLen) maxLen = longestLine;
            }
        });
        col.width = Math.min(maxLen + 4, maxWidth);
    });

    ws.eachRow(row => {
        let maxLines = 1;
        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
            if (cell.value) {
                const content = cell.value.toString();
                const lines = content.split('\n').length;
                
                // Get available width for the cell, considering merges
                const availableWidth = ws.getColumn(colNum).width || 10;
                
                // ExcelJS cell.master check for merged ranges
                if (cell.isMerged && cell.address !== cell.master.address) {
                   // This is a "slave" cell in a merge, skip it here.
                   return;
                }
                
                if (cell.isMerged) {
                    // It's the master of a merge. Find the range and sum widths.
                    const range = (ws as any)._merges?.[cell.address]; // Internal API but let's try a better way
                    // Finding the range from cell is non-trivial with public API
                    // Let's assume most merges are horizontal for this form and try to estimate
                }

                // Actually, let's keep it simple: if it's merged across multiple columns, 
                // it likely has plenty of horizontal space. 
                // Heuristic: if it's merged, we'll assume it doesn't need much wrapping.
                const charsPerLine = (cell.isMerged ? 120 : availableWidth) * 0.9; 
                const wrapped = Math.ceil(content.length / Math.max(charsPerLine, 1));
                const total = Math.max(lines, wrapped);
                if (total > maxLines) maxLines = total;
            }
        });
        const targetH = maxLines * 15 + 5;
        const currentH = row.height || 0;
        if (targetH > currentH) row.height = targetH;
    });
}

// ── Sheet: Problem ─────────────────────────────────────────────────────────────

function addProblemSheet(wb: ExcelJS.Workbook, d: WbtDescriptor): void {
    const ws = wb.addWorksheet('Problem');
    let row = ws.addRow([`Statement: ${d.statement}`, '']);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).border = BORDER;
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    ws.addRow(['', '']);
    row = ws.addRow(['Specification', '']);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    styleSection(row.getCell(1));
    row = ws.addRow(['Data', d.data]);
    styleLabel(row.getCell(1)); styleData(row.getCell(2));
    row = ws.addRow(['precondition', d.precondition]);
    styleLabel(row.getCell(1)); styleData(row.getCell(2));
    ws.addRow(['', '']);
    row = ws.addRow(['Results', '']);
    ws.mergeCells(`A${row.number}:B${row.number}`);
    styleSection(row.getCell(1));
    row = ws.addRow(['', d.results]);
    styleData(row.getCell(1)); styleData(row.getCell(2));
    row = ws.addRow(['postcondition', d.postcondition]);
    styleLabel(row.getCell(1)); styleData(row.getCell(2));
    autoFitWorksheet(ws);
}

// ── Sheet: Req_CFG_CC_Paths ────────────────────────────────────────────────────

async function addCfgSheet(wb: ExcelJS.Workbook, d: WbtDescriptor): Promise<void> {
    const ws = wb.addWorksheet('Req_CFG_CC_Paths');
    const COL_WIDTH = 11;
    const ROW_H_PT  = 16;
    const PX_PER_COL = 64;
    const cfgImg = await resolveCfgBuffer(d);
    let imageRows: number;
    let startColStats = 14;

    if (cfgImg) {
        const { w: pngW, h: pngH } = readPngDims(cfgImg.buffer);
        const logicalW = pngW / 2;
        const logicalH = pngH / 2;
        const logicalH_pt = logicalH * 0.75;
        imageRows = Math.max(Math.ceil(logicalH_pt / ROW_H_PT), d.paths.length + 13);
        startColStats = Math.max(14, Math.ceil(logicalW / PX_PER_COL) + 2);
        for (let r = 1; r <= imageRows; r++) ws.getRow(r).height = ROW_H_PT;
        for (let c = 1; c < startColStats; c++) ws.getColumn(c).width = COL_WIDTH;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const imgId = wb.addImage({ buffer: cfgImg.buffer, extension: cfgImg.extension });
        ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: logicalW, height: logicalH }, editAs: 'oneCell' });
    } else {
        imageRows = Math.max(22, d.paths.length + 13);
        for (let r = 1; r <= imageRows; r++) ws.getRow(r).height = ROW_H_PT;
        for (let c = 1; c < startColStats; c++) ws.getColumn(c).width = COL_WIDTH;
        const ph = ws.getCell(1, 1);
        ph.value = '[CFG — provide cfgDot or cfgImagePath in the descriptor]';
        ph.font = { italic: true, color: { argb: 'FF888888' } };
        ph.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
        ws.mergeCells(1, 1, imageRows, startColStats - 2);
        ph.border = BORDER;
    }

    ws.getColumn(startColStats - 1).width = 3;
    ws.getColumn(startColStats).width = 26;
    ws.getColumn(startColStats + 1).width = 65;

    const ccTitleRow = ws.getRow(1);
    ccTitleRow.height = 20;
    ws.mergeCells(1, startColStats, 1, startColStats + 1);
    const ccTitle = ccTitleRow.getCell(startColStats);
    ccTitle.value = 'Cyclomatic Complexity';
    styleSection(ccTitle);
    styleSection(ccTitleRow.getCell(startColStats + 1));

    const cc = d.cyclomaticComplexity;
    const ccEntries: [string, number][] = [
        ['CC₁  (regions)',        cc.cc1Regions],
        ['CC₂  (E − N + 2)',      cc.cc2EdgeNodePlus2],
        ['CC₃  (predicates + 1)', cc.cc3PredicatePlus1],
    ];
    ccEntries.forEach(([label, val], i) => {
        const r = ws.getRow(2 + i); r.height = 18;
        const lc = r.getCell(startColStats), vc = r.getCell(startColStats + 1);
        lc.value = label; vc.value = val;
        styleLabel(lc); styleData(vc);
        vc.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const PATH_ROW = 6;
    ws.mergeCells(PATH_ROW, startColStats, PATH_ROW, startColStats + 1);
    const phRow = ws.getRow(PATH_ROW); phRow.height = 20;
    const phCell = phRow.getCell(startColStats);
    phCell.value = 'Individual Paths';
    styleSection(phCell);
    styleSection(phRow.getCell(startColStats + 1));

    d.paths.forEach((p, i) => {
        const r = ws.getRow(PATH_ROW + 1 + i); r.height = 18;
        const idCell = r.getCell(startColStats), descCell = r.getCell(startColStats + 1);
        idCell.value = p.id; descCell.value = p.description;
        styleLabel(idCell);
        idCell.alignment = { horizontal: 'center', vertical: 'middle' };
        styleData(descCell);
    });

    const imageAreaCols = Array.from({ length: startColStats - 1 }, (_, i) => i + 1);
    autoFitWorksheet(ws, imageAreaCols);
}

// ── Sheet: Req_TC_coverage ─────────────────────────────────────────────────────

function addTcCoverageSheet(wb: ExcelJS.Workbook, d: WbtDescriptor): void {
    const ws = wb.addWorksheet('Req_TC_coverage');
    const nPred  = d.predicates.length;
    const nPaths = d.paths.length;
    const hasLoop = d.hasLoopCoverage ?? false;

    const C_NOTC      = 2;
    const C_INPUT     = 3;
    const C_EXPECTED  = 5;
    const C_ACTUAL    = 6;
    const C_STMT      = 7;
    const C_CD_START  = 8;
    const C_CD_END    = C_CD_START + nPred * 2 - 1;
    const C_PTH_START = C_CD_END + 1;
    const C_PTH_END   = C_PTH_START + nPaths - 1;
    const C_LOP_START = C_PTH_END + 1;
    const C_LOP_END   = hasLoop ? C_LOP_START + 6 : C_PTH_END;
    const C_LAST      = hasLoop ? C_LOP_END : C_PTH_END;

    const blank = (): string[] => new Array(C_LAST).fill('');

    const r1 = ws.addRow(blank());
    const setSection = (from: number, to: number, label: string) => {
        r1.getCell(from).value = label;
        styleSection(r1.getCell(from));
        if (to > from) {
            ws.mergeCells(r1.number, from, r1.number, to);
            for (let c = from + 1; c <= to; c++) {
                r1.getCell(c).fill = FILL_SECTION; r1.getCell(c).border = BORDER;
            }
        }
    };
    setSection(C_CD_START, C_CD_END, 'Condition / Decision Coverage');
    setSection(C_PTH_START, C_PTH_END, 'Path Coverage');
    if (hasLoop) setSection(C_LOP_START, C_LOP_END, 'Loop Coverage');

    const r2 = ws.addRow(blank());
    const mergeHdr = (from: number, to: number, label: string) => {
        r2.getCell(from).value = label;
        styleHeader(r2.getCell(from));
        if (to > from) {
            ws.mergeCells(r2.number, from, r2.number, to);
            for (let c = from + 1; c <= to; c++) styleHeader(r2.getCell(c));
        }
    };
    mergeHdr(C_INPUT, C_INPUT + 1, 'Input Data');
    mergeHdr(C_EXPECTED, C_ACTUAL, 'Output Data');
    r2.getCell(C_STMT).value = 'Statement'; styleHeader(r2.getCell(C_STMT));
    for (let p = 0; p < nPred; p++) mergeHdr(C_CD_START + p * 2, C_CD_START + p * 2 + 1, d.predicates[p]);
    for (let p = 0; p < nPaths; p++) { r2.getCell(C_PTH_START + p).value = d.paths[p].id; styleHeader(r2.getCell(C_PTH_START + p)); }
    if (hasLoop) for (let c = C_LOP_START; c <= C_LOP_END; c++) styleHeader(r2.getCell(c));

    const r3 = ws.addRow(blank());
    r3.getCell(C_NOTC).value = 'No TC';           styleHeader(r3.getCell(C_NOTC));
    styleHeader(r3.getCell(C_INPUT)); styleHeader(r3.getCell(C_INPUT + 1));
    r3.getCell(C_EXPECTED).value = 'Expected';    styleHeader(r3.getCell(C_EXPECTED));
    r3.getCell(C_ACTUAL).value   = 'Actual Result'; styleHeader(r3.getCell(C_ACTUAL));
    r3.getCell(C_STMT).value     = 'Coverage';    styleHeader(r3.getCell(C_STMT));
    for (let p = 0; p < nPred; p++) {
        const col = C_CD_START + p * 2;
        r3.getCell(col).value = 'T'; styleHeader(r3.getCell(col));
        r3.getCell(col + 1).value = 'F'; styleHeader(r3.getCell(col + 1));
    }
    for (let p = 0; p < nPaths; p++) styleHeader(r3.getCell(C_PTH_START + p));
    if (hasLoop) {
        ['no', '1×', '2×', 'n−1', 'n', 'n+1', 'm<n'].forEach((lbl, i) => {
            r3.getCell(C_LOP_START + i).value = lbl;
            styleHeader(r3.getCell(C_LOP_START + i));
        });
    }

    for (const tc of d.tcRows) {
        const r = ws.addRow(blank());
        r.getCell(C_NOTC).value = tc.noTc;
        styleData(r.getCell(C_NOTC));
        r.getCell(C_NOTC).alignment = { horizontal: 'center', vertical: 'middle' };
        r.getCell(C_INPUT).value = tc.inputData;
        styleData(r.getCell(C_INPUT));
        ws.mergeCells(r.number, C_INPUT, r.number, C_INPUT + 1);
        r.getCell(C_EXPECTED).value = tc.expected;
        styleData(r.getCell(C_EXPECTED));
        const ar = tc.actualResult ?? 'Passed';
        r.getCell(C_ACTUAL).value = ar;
        if (ar === 'Passed') stylePassed(r.getCell(C_ACTUAL)); else styleData(r.getCell(C_ACTUAL));
        const sc = r.getCell(C_STMT);
        if (tc.statementCoverage) { sc.value = 'X'; styleMark(sc); } else styleEmpty(sc);
        for (let p = 0; p < nPred; p++) {
            const col = C_CD_START + p * 2;
            const [covT, covF] = tc.conditionDecision?.[p] ?? [false, false];
            const tc_ = r.getCell(col); const fc_ = r.getCell(col + 1);
            if (covT) { tc_.value = 'X'; styleMark(tc_); } else styleEmpty(tc_);
            if (covF) { fc_.value = 'X'; styleMark(fc_); } else styleEmpty(fc_);
        }
        for (let p = 0; p < nPaths; p++) {
            const covers = tc.pathCoverage?.[p] ?? false;
            const cell = r.getCell(C_PTH_START + p);
            if (covers) { cell.value = 'X'; styleMark(cell); } else styleEmpty(cell);
        }
        if (hasLoop) {
            const lc = tc.loopCoverage;
            [lc?.no, lc?.once, lc?.twice, lc?.nMinus1, lc?.n, lc?.nPlus1, lc?.mLessThanN].forEach((v, i) => {
                const cell = r.getCell(C_LOP_START + i);
                if (v) { cell.value = 'X'; styleMark(cell); } else styleEmpty(cell);
            });
        }
    }

    ws.addRow([]);
    const rmkHdr = ws.addRow(blank());
    rmkHdr.getCell(C_NOTC).value = 'Remarks';
    styleLabel(rmkHdr.getCell(C_NOTC));
    ws.mergeCells(rmkHdr.number, C_NOTC, rmkHdr.number, C_LAST);
    for (let c = C_NOTC + 1; c <= C_LAST; c++) rmkHdr.getCell(c).fill = FILL_LABEL;
    for (const remark of (d.remarks ?? [])) {
        const r = ws.addRow(blank());
        r.getCell(C_INPUT).value = remark;
        styleData(r.getCell(C_INPUT));
        ws.mergeCells(r.number, C_INPUT, r.number, C_LAST);
    }
    autoFitWorksheet(ws);
}

// ── Sheet: Req_Statistics ──────────────────────────────────────────────────────

function addStatsSheet(wb: ExcelJS.Workbook, d: WbtDescriptor): void {
    const ws = wb.addWorksheet('Req_Statistics');
    ws.addRow([]); ws.addRow([]); ws.addRow([]);
    const sRow = ws.addRow(['', '', 'Testing', '', '', '', '', 'Debugging', 'Re-testing', '', '', '', '']);
    ws.mergeCells(`C${sRow.number}:G${sRow.number}`);
    ws.mergeCells(`I${sRow.number}:M${sRow.number}`);
    sRow.getCell(1).border = BORDER; sRow.getCell(2).border = BORDER;
    styleSection(sRow.getCell(3)); styleSection(sRow.getCell(8)); styleSection(sRow.getCell(9));
    [4, 5, 6, 7, 10, 11, 12, 13].forEach(c => { sRow.getCell(c).fill = FILL_SECTION; sRow.getCell(c).border = BORDER; });
    const hRow = ws.addRow([
        '', 'Req. ID', 'TCs run', 'TCs passed', 'TCs failed', '% Coverage', 'No of BUGS',
        'Bugs Fixed', 'Re-tested', 'TCs run', 'TCs passed', 'TCs failed', '% Coverage',
    ]);
    hRow.eachCell(c => styleHeader(c));
    const totalRun  = d.tcRows.length;
    const tcsFailed = d.tcsFailed ?? 0;
    const dRow = ws.addRow([
        '', d.reqId, totalRun, totalRun - tcsFailed, tcsFailed, d.coveragePercent ?? 'n/a', d.bugsFound ?? 0,
        d.bugsFixed ?? 'n/a', d.retested ?? 'not yet', d.retestRun ?? 0, d.retestPassed ?? '-', d.retestFailed ?? '-', '-',
    ]);
    styleLabel(dRow.getCell(2));
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].forEach(c => styleData(dRow.getCell(c)));
    autoFitWorksheet(ws);
}

// ── Workbook assembly ──────────────────────────────────────────────────────────

async function buildWorkbook(d: WbtDescriptor): Promise<ExcelJS.Workbook> {
    const wb = new ExcelJS.Workbook();
    addProblemSheet(wb, d);
    await addCfgSheet(wb, d);
    addTcCoverageSheet(wb, d);
    addStatsSheet(wb, d);
    return wb;
}

export async function writeWbt(descriptor: WbtDescriptor, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const wb = await buildWorkbook(descriptor);
    await wb.xlsx.writeFile(outputPath);
    console.log(`  ✓ ${path.relative(ROOT, outputPath)}`);
}

// ── Example descriptor ─────────────────────────────────────────────────────────

const exampleDescriptor: WbtDescriptor = {
    reqId: 'WBT-01',
    statement: 'sumPositive(int[] arr) — iterates over arr and accumulates positive elements.',
    data: 'Input: int[] arr',
    precondition: 'arr is valid.',
    results: 'Output: int',
    postcondition: 'Return sum of positives.',
    cyclomaticComplexity: { cc1Regions: 1, cc2EdgeNodePlus2: 1, cc3PredicatePlus1: 1 },
    predicates: [],
    paths: [{ id: '1', description: 'path 1' }],
    tcRows: [{ noTc: '1', inputData: '[]', expected: '0', statementCoverage: true, pathCoverage: [true] }],
};

async function main(): Promise<void> {
    const BASE = path.join(ROOT, 'lib', 'schema', '__tests__', 'wbt');
    console.log('Generating WBT forms…');
    await writeWbt(exampleDescriptor, path.join(BASE, 'WBT_sumPositive.xlsx'));
    console.log('Done.');
}

if (require.main === module) {
    main().catch(err => { console.error(err); process.exit(1); });
}
