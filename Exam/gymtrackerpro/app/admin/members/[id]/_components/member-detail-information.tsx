import {Badge} from '@/components/ui/badge';
import {Card, CardContent} from '@/components/ui/card';
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
            </div>
            <CardContent className="p-0">
                <dl className="divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Email</dt>
                        <dd className="text-sm font-medium text-right truncate">{member.user.email}</dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Phone</dt>
                        <dd className="text-sm font-medium text-right">{member.user.phone}</dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Date of birth</dt>
                        <dd className="text-sm font-medium text-right">{new Date(member.user.dateOfBirth).toLocaleDateString()}</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
        <Card className="overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Membership</p>
            </div>
            <CardContent className="p-0">
                <dl className="divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Member since</dt>
                        <dd className="text-sm font-medium text-right">{new Date(member.membershipStart).toLocaleDateString()}</dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Status</dt>
                        <dd>
                            <Badge variant={member.isActive ? 'default' : 'secondary'}>
                                {member.isActive ? 'Active' : 'Suspended'}
                            </Badge>
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    </div>
);
