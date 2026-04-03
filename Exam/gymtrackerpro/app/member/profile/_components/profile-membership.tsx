import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

type ProfileMembershipProps = {
    membershipStart: string | Date;
    isActive: boolean;
}

/**
 * Renders a card displaying the member's membership status and start date.
 *
 * @param membershipStart - The date the membership began.
 * @param isActive - Whether the membership is currently active.
 * @returns A card with membership start date and a colour-coded status indicator.
 */
export const ProfileMembership = ({membershipStart, isActive}: ProfileMembershipProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Membership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p>
                    <span className="text-muted-foreground">Member since: </span>
                    {new Date(membershipStart).toLocaleDateString()}
                </p>
                <p>
                    <span className="text-muted-foreground">Status: </span>
                    <span className={isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {isActive ? 'Active' : 'Suspended'}
                </span>
                </p>
            </CardContent>
        </Card>
    );
}