import type {Admin, Member, User} from '@/prisma/generated/prisma/client';
export type {User} from '@/prisma/generated/prisma/client';
export type {Member} from '@/prisma/generated/prisma/client';
export type {Admin} from '@/prisma/generated/prisma/client';
export type {Role as RoleType} from '@/prisma/generated/prisma/enums';
export {Role} from '@/prisma/generated/prisma/enums';

/** User record with the role-specific profile included. */
export type UserWithProfile = User & {member: Member | null; admin: Admin | null};

/** Member record with the parent user included. */
export type MemberWithUser = Member & {user: User};

/** Admin record with the parent user included. */
export type AdminWithUser = Admin & {user: User};

/** Options for filtering and paginating the member list. */
export type MemberListOptions = {
    search?: string;
    page?: number;
    pageSize?: number;
};

/** Options for filtering and paginating the admin list. */
export type AdminListOptions = {
    search?: string;
    page?: number;
    pageSize?: number;
};

