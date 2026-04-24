/**
 * generate-repository-wbt-forms.ts
 * Run: npm run generate-repository-wbt-forms
 *
 * Add one WbtDescriptor per repository function under test.
 * See the wbt-gymtrackerpro skill for the complete filling guide.
 */

import * as path from 'path';
import { writeWbt, WbtDescriptor } from './generate-wbt-forms';

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(ROOT, 'lib');

// ── Descriptors ────────────────────────────────────────────────────────────────
// Add one WbtDescriptor constant per function under test, then register it in main().

// Example structure (uncomment and fill):
// const userRepo_createMemberWbt: WbtDescriptor = { reqId: 'WBT-REPO-01', ... };

// ── Entry point ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    console.log('Generating repository WBT forms…');

    // const USER_REPO = path.join(BASE, 'user-repository', '__tests__', 'wbt');
    // await writeWbt(userRepo_createMemberWbt, path.join(USER_REPO, 'createMember-wbt-form.xlsx'));

    console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });