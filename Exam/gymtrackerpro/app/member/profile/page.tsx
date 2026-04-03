import {PageHeader} from '@/components/page-header';
import {Separator} from '@/components/ui/separator';
import {ProfilePersonalInformation} from './_components/profile-personal-information';
import {ProfileMembership} from './_components/profile-membership';
import {ProfileChangePasswordForm} from './_components/profile-change-password-form';
import {getSession} from '@/lib/session';
import {getMember} from '@/lib/controller/user-controller';

/**
 * Member profile page.
 * Fetches the current session and member details server-side, then delegates
 * rendering to focused sub-components for personal info, membership, and password change.
 *
 * @returns A profile view with account details and a password update form, or an error message on failure.
 */
export default async function MemberProfilePage() {
    const session = await getSession();
    if (!session.memberId) {
        return null;
    }

    const result = await getMember(session.memberId);
    if (!result.success) {
        return <p className="text-destructive">{result.message}</p>;
    }

    const {user, membershipStart, isActive} = result.data;

    return (
        <div>
            <PageHeader title="My Profile" description="Your account information"/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <ProfilePersonalInformation user={user}/>
                <ProfileMembership membershipStart={membershipStart} isActive={isActive}/>
            </div>

            <Separator className="mb-6"/>

            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <ProfileChangePasswordForm memberId={session.memberId}/>
        </div>
    );
}