import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {User} from '@/lib/domain/user';

type ProfilePersonalInfoProps = {
    user: User;
}

/**
 * Renders a card displaying the member's personal information.
 *
 * @param user - The user object containing personal details.
 * @returns A card with full name, email, phone, and date of birth.
 */
export const ProfilePersonalInformation = ({user}: ProfilePersonalInfoProps) => {
    return (
        <Card>
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                <p>
                    <span className="text-muted-foreground">Full name:</span>
                    <span className="font-medium">{user.fullName}</span>
                </p>
                <p>
                    <span className="text-muted-foreground">Email:</span>
                    {user.email}
                </p>
                <p>
                    <span className="text-muted-foreground">Phone:</span>
                    {user.phone}
                </p>
                <p>
                    <span className="text-muted-foreground">Date of birth: </span>
                    {new Date(user.dateOfBirth).toLocaleDateString()}
                </p>
            </CardContent>
        </Card>
    );
}