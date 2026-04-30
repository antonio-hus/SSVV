/**
 * member-profile-ft-forms.ts
 *
 * FT form descriptors for the member profile route.
 * Run: npx tsx scripts/frontend/member-profile-ft-forms.ts
 */

import * as path from 'path';
import {writeFt, FtDescriptor, FtTcRow} from '@/scripts/generate-ft-forms';

const routeDir = path.resolve(__dirname, '..', '..', 'app', 'member', 'profile');

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
        outFile: path.join(routeDir, '_components', '__tests__', 'ft', 'profile-personal-information', 'profile-personal-information-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'ProfilePersonalInformation',
            reqId: 'FT-46',
            statement: 'ProfilePersonalInformation - renders a read-only card with the member user full name, email, phone, and date of birth.',
            props: 'user: User - required user object containing personal account details.',
            precondition: 'Mock generated Prisma Role enum for jsdom compatibility. No providers or server actions required.',
            renderOutput: 'Personal Information card with Full name, Email, Phone, and Date of birth rows.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/member/profile --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders card title and all supplied user fields.', 'render(<ProfilePersonalInformation user={user} />)', 'No interaction - render only.', 'Personal Information, labels, full name, email, phone, and formatted date of birth are visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '_components', '__tests__', 'ft', 'profile-membership', 'profile-membership-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'ProfileMembership',
            reqId: 'FT-47',
            statement: 'ProfileMembership - renders membership start date and active/suspended status for the member.',
            props: 'membershipStart: string | Date - membership start date; isActive: boolean - controls displayed status.',
            precondition: 'No providers or server actions required.',
            renderOutput: 'Membership card with Member since row and Status badge.',
            postcondition: 'None - presentational component only.',
            remarks: ['Run: npx jest app/member/profile --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders membership start date.', 'render(<ProfileMembership membershipStart={date} isActive />)', 'No interaction - render only.', 'Membership, Member since, and formatted start date are visible.'),
                tc('TC-02', 'Displays Active when isActive is true.', 'render(<ProfileMembership membershipStart="2025-01-15" isActive={true} />)', 'No interaction - render only.', 'Text "Active" is visible.'),
                tc('TC-03', 'Displays Suspended when isActive is false.', 'render(<ProfileMembership membershipStart="2025-01-15" isActive={false} />)', 'No interaction - render only.', 'Text "Suspended" is visible.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '_components', '__tests__', 'ft', 'profile-change-password-form', 'profile-change-password-form-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'ProfileChangePasswordForm',
            reqId: 'FT-48',
            statement: 'ProfileChangePasswordForm - validates a new password, calls updateMember for the current member, resets the field on success, and shows validation/server errors.',
            props: 'memberId: string - member ID passed to updateMember.',
            precondition: 'Mock updateMember as jest.fn(). Mock generated Prisma Role enum.',
            renderOutput: 'New Password password input and Update Password submit button, plus success/error alerts after submission.',
            postcondition: 'updateMember(memberId, {password}) is called once for valid passwords; field resets only on success.',
            remarks: [
                'Run: npx jest profile-change-password-form.test.tsx --selectProjects jsdom',
            ],
            tcRows: [
                tc('TC-01', 'Renders empty password field and enabled submit button.', 'render(<ProfileChangePasswordForm memberId="mem-1" />)', 'No interaction - render only.', 'New Password input is empty and type password; Update Password button enabled.'),
                tc('TC-02', 'Rejects an empty password and does not call update.', 'Leave New Password empty.', 'userEvent.click(Update Password)', 'Validation failed and minimum length error visible; updateMember not called.'),
                tc('TC-03', 'Rejects a password above the maximum length and does not call update.', 'Type a 65-character password that otherwise satisfies complexity.', 'userEvent.click(Update Password)', 'Maximum length error visible; updateMember not called.'),
                tc('TC-04', 'Rejects a password without uppercase and does not call update.', 'Type lowercase#123.', 'userEvent.click(Update Password)', 'Uppercase-character error visible; updateMember not called.'),
                tc('TC-05', 'Rejects a password without a number and does not call update.', 'Type NoNumber#.', 'userEvent.click(Update Password)', 'Number requirement error visible; updateMember not called.'),
                tc('TC-06', 'Rejects a password without a special character and does not call update.', 'Type NoSpecial123.', 'userEvent.click(Update Password)', 'Special-character error visible; updateMember not called.'),
                tc('TC-07', 'Calls updateMember and resets field on successful valid password update.', 'updateMember resolves success; type Strong#123.', 'userEvent.click(Update Password)', 'Success alert visible; updateMember called with memberId/password; field value resets to empty.'),
                tc('TC-08', 'Shows server error and keeps field value when update fails.', 'updateMember resolves failed result; type Strong#123.', 'userEvent.click(Update Password)', 'Error visible; button enabled; updateMember called once; input still contains Strong#123.'),
                tc('TC-09', 'Shows server-returned password field error.', 'updateMember resolves failed validation with password error.', 'userEvent.click(Update Password)', 'Validation failed and password field error visible; updateMember called once.'),
                tc('TC-10', 'Disables submit control while update is pending.', 'updateMember returns an unresolved promise after a valid password.', 'userEvent.click(Update Password)', 'Updating… button is disabled and Update Password text is absent until the promise resolves.'),
            ],
        },
    },
    {
        outFile: path.join(routeDir, '__tests__', 'ft', 'page', 'page-ft-form.xlsx'),
        descriptor: {
            ...commonStats,
            componentName: 'MemberProfilePage',
            reqId: 'FT-49',
            statement: 'MemberProfilePage - fetches the current member profile and renders personal information, membership status, and password update form.',
            props: 'None - the page reads the current session server-side.',
            precondition: 'Mock getSession, getMember, and updateMember. Mock generated Prisma Role enum.',
            renderOutput: 'My Profile header, ProfilePersonalInformation, ProfileMembership, Change Password heading, and ProfileChangePasswordForm when member fetch succeeds.',
            postcondition: 'getMember(session.memberId) is called only when memberId exists; failed member fetch renders the returned error message.',
            remarks: ['Run: npx jest app/member/profile --selectProjects jsdom'],
            tcRows: [
                tc('TC-01', 'Renders nothing and does not fetch member when session.memberId is missing.', 'getSession resolves memberId null.', 'render(await MemberProfilePage())', 'container.firstChild is null; getMember not called.'),
                tc('TC-02', 'Shows error message when getMember fails.', 'getSession resolves mem-1; getMember resolves failed result.', 'render page.', 'Member not found visible; getMember called with mem-1.'),
                tc('TC-03', 'Renders header, personal info, membership, and password form when getMember succeeds.', 'getMember resolves active member.', 'render page.', 'My Profile, account description, Personal Information, member name, Membership, Active, Change Password, and New Password are visible; updateMember not called.'),
                tc('TC-04', 'Renders Suspended membership status for inactive member.', 'getMember resolves member with isActive false.', 'render page.', 'Text "Suspended" is visible.'),
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
