/**
 * generate-service-wbt-forms.ts
 * Run: npm run generate-service-wbt-forms
 *
 * Add one WbtDescriptor per service function under test.
 * See the wbt-gymtrackerpro skill for the complete filling guide.
 */

import * as path from 'path';
import { writeWbt, WbtDescriptor } from './generate-wbt-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib');

// ── Descriptors ────────────────────────────────────────────────────────────────
// Add one WbtDescriptor constant per function under test, then register it in main().

// Example structure (uncomment and fill):
// const memberService_createMemberWbt: WbtDescriptor = { reqId: 'WBT-SVC-01', ... };

// ── Entry point ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log('Generating service WBT forms…');

    // const MEMBER_SVC = path.join(BASE, 'member-service', '__tests__', 'wbt');
    // await writeWbt(memberService_createMemberWbt, path.join(MEMBER_SVC, 'createMember-wbt-form.xlsx'));

    console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });