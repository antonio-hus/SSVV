import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';

type ProfileMembershipProps = {
    membershipStart: string | Date;
    isActive: boolean;
}

/**
 * Renders a card displaying the member's membership status and start date.
 *
 * @param membershipStart - The date the membership began.
 * @param isActive - Whether the membership is currently active.
 * @returns A card with membership start date and status.
 */
export const ProfileMembership = ({membershipStart, isActive}: ProfileMembershipProps) => {
    return (
        <Card className="overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Membership</p>
            </div>
            <CardContent className="p-0">
                <dl className="divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Member since</dt>
                        <dd className="text-sm font-medium text-right">{new Date(membershipStart).toLocaleDateString()}</dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Status</dt>
                        <dd>
                            <Badge variant={isActive ? 'default' : 'secondary'}>
                                {isActive ? 'Active' : 'Suspended'}
                            </Badge>
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
