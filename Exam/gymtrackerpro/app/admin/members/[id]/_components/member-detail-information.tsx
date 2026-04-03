import {Badge} from '@/components/ui/badge';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {MemberWithUser} from '@/lib/domain/user';

type MemberDetailInfoProps = {
    member: MemberWithUser;
}

/**
 * Renders contact information and membership status cards for a single member.
 *
 * @param member - The member whose details are displayed.
 * @returns A two-card grid showing contact info and membership status.
 */
export const MemberDetailInformation = ({member}: MemberDetailInfoProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
            <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p>
                    <span className="text-muted-foreground">Email:</span>
                    {member.user.email}
                </p>
                <p>
                    <span className="text-muted-foreground">Phone:</span>
                    {member.user.phone}
                </p>
                <p>
                    <span className="text-muted-foreground">Date of birth: </span>
                    {new Date(member.user.dateOfBirth).toLocaleDateString()}
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-base">Membership</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p>
                    <span className="text-muted-foreground">Since: </span>
                    {new Date(member.membershipStart).toLocaleDateString()}
                </p>
                <p>
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant={member.isActive ? 'default' : 'secondary'}>
                        {member.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                </p>
            </CardContent>
        </Card>
    </div>
);