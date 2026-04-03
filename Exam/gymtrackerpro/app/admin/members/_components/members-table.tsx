import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import type {MemberWithUser} from '@/lib/domain/user';

type MembersTableProps = {
    members: MemberWithUser[];
}

/**
 * Renders a table of gym members with name, email, phone, membership start date, status, and action links.
 *
 * Displays an empty state message when no members match the current filters.
 *
 * @param members - The list of members to display.
 * @returns A bordered table of members, each with view and edit links.
 */
export const MembersTable = ({members}: MembersTableProps) => (
    <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {members.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No members found
                        </TableCell>
                    </TableRow>
                ) : members.map((member) => (
                    <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.user.fullName}</TableCell>
                        <TableCell>{member.user.email}</TableCell>
                        <TableCell>{member.user.phone}</TableCell>
                        <TableCell>{new Date(member.membershipStart).toLocaleDateString()}</TableCell>
                        <TableCell>
                            <Badge variant={member.isActive ? 'default' : 'secondary'}>
                                {member.isActive ? 'Active' : 'Suspended'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button render={<Link href={`/admin/members/${member.id}`} />} nativeButton={false} variant="ghost" size="sm">
                                    View
                                </Button>
                                <Button render={<Link href={`/admin/members/${member.id}/edit`} />} nativeButton={false} variant="ghost" size="sm">
                                    Edit
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
);