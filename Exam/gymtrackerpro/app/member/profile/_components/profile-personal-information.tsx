import {Card, CardContent} from '@/components/ui/card';
import type {User} from '@/lib/domain/user';

type ProfilePersonalInfoProps = {
    user: User;
}

/**
 * Renders a card displaying the member's personal information.
 * Uses a grouped row layout with labels left, values right.
 *
 * @param user - The user object containing personal details.
 * @returns A card with full name, email, phone, and date of birth.
 */
export const ProfilePersonalInformation = ({user}: ProfilePersonalInfoProps) => {
    return (
        <Card className="overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</p>
            </div>
            <CardContent className="p-0">
                <dl className="divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Full name</dt>
                        <dd className="text-sm font-medium text-right truncate">{user.fullName}</dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Email</dt>
                        <dd className="text-sm font-medium text-right truncate">{user.email}</dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Phone</dt>
                        <dd className="text-sm font-medium text-right">{user.phone}</dd>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <dt className="text-sm text-muted-foreground shrink-0">Date of birth</dt>
                        <dd className="text-sm font-medium text-right">{new Date(user.dateOfBirth).toLocaleDateString()}</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}