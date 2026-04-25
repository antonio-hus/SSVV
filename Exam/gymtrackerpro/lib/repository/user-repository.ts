import bcrypt from 'bcryptjs';
import {PrismaClient} from '@/prisma/generated/prisma/client';
import {AdminListOptions, AdminWithUser, MemberListOptions, MemberWithUser, User, UserWithProfile, Role} from '@/lib/domain/user';
import {CreateAdminInput, CreateMemberInput, UpdateAdminInput, UpdateMemberInput} from '@/lib/schema/user-schema';
import {PageResult} from '@/lib/domain/pagination';
import {ConflictError, NotFoundError, TransactionError} from '@/lib/domain/errors';
import {UserRepositoryInterface} from '@/lib/repository/user-repository-interface';
import {escapeLike} from '@/lib/utils';

/**
 * Prisma-backed implementation of {@link UserRepositoryInterface}.
 */
export class UserRepository implements UserRepositoryInterface {
    private static instance: UserRepository;
    private readonly database: PrismaClient;

    private constructor(database: PrismaClient) {
        this.database = database;
    }

    /**
     * Returns the singleton instance, creating it with the given client on first call.
     *
     * @param database - The Prisma client to use for database access.
     */
    static getInstance(database: PrismaClient): UserRepository {
        if (!UserRepository.instance) {
            UserRepository.instance = new UserRepository(database);
        }
        return UserRepository.instance;
    }

    /** @inheritdoc */
    async createMember(data: CreateMemberInput): Promise<MemberWithUser> {
        const existing = await this.database.user.findUnique({
            where: {email: data.email}
        });
        if (existing) {
            throw new ConflictError(`Email already in use: ${data.email}`);
        }

        const passwordHash = await bcrypt.hash(data.password, 12);

        try {
            const result = await this.database.user.create({
                data: {
                    email: data.email,
                    fullName: data.fullName,
                    phone: data.phone,
                    dateOfBirth: new Date(data.dateOfBirth),
                    passwordHash,
                    role: Role.MEMBER,
                    member: {
                        create: {membershipStart: new Date(data.membershipStart)},
                    },
                },
                include: {member: true},
            });

            const {member: memberRecord, ...userRecord} = result;
            return {...memberRecord!, user: userRecord as User};
        } catch (error) {
            throw new TransactionError(`Failed to create member: ${(error as Error).message}`);
        }
    }

    /** @inheritdoc */
    async createAdmin(data: CreateAdminInput): Promise<AdminWithUser> {
        const existing = await this.database.user.findUnique({
            where: {email: data.email}
        });
        if (existing) {
            throw new ConflictError(`Email already in use: ${data.email}`);
        }

        const passwordHash = await bcrypt.hash(data.password, 12);

        try {
            const result = await this.database.user.create({
                data: {
                    email: data.email,
                    fullName: data.fullName,
                    phone: data.phone,
                    dateOfBirth: new Date(data.dateOfBirth),
                    passwordHash,
                    role: Role.ADMIN,
                    admin: {create: {}},
                },
                include: {admin: true},
            });

            const {admin: adminRecord, ...userRecord} = result;
            return {...adminRecord!, user: userRecord as User};
        } catch (error) {
            throw new TransactionError(`Failed to create admin: ${(error as Error).message}`);
        }
    }

    /** @inheritdoc */
    async findById(id: string): Promise<UserWithProfile> {
        const user = await this.database.user.findUnique({
            where: {id},
            include: {member: true, admin: true},
        });
        if (!user) {
            throw new NotFoundError(`User not found: ${id}`);
        }

        return user;
    }

    /** @inheritdoc */
    async findMemberById(memberId: string): Promise<MemberWithUser> {
        const member = await this.database.member.findUnique({
            where: {id: memberId},
            include: {user: true},
        });
        if (!member) {
            throw new NotFoundError(`Member not found: ${memberId}`);
        }

        return member;
    }

    /** @inheritdoc */
    async findAdminById(adminId: string): Promise<AdminWithUser> {
        const admin = await this.database.admin.findUnique({
            where: {id: adminId},
            include: {user: true},
        });
        if (!admin) {
            throw new NotFoundError(`Admin not found: ${adminId}`);
        }

        return admin;
    }

    /** @inheritdoc */
    async findByEmail(email: string): Promise<UserWithProfile | null> {
        return this.database.user.findUnique({
            where: {email},
            include: {member: true, admin: true},
        });
    }

    /** @inheritdoc */
    async findMembers(options: MemberListOptions = {}): Promise<PageResult<MemberWithUser>> {
        const {search, page = 1, pageSize = 10} = options;
        const safePage = Math.max(1, page);

        const safeSearch = search ? escapeLike(search) : undefined;
        const where = safeSearch
            ? {
                user: {
                    OR: [
                        {fullName: {contains: safeSearch, mode: 'insensitive' as const}},
                        {email: {contains: safeSearch, mode: 'insensitive' as const}},
                    ],
                },
            }
            : undefined;

        const [items, total] = await this.database.$transaction([
            this.database.member.findMany({
                where,
                include: {user: true},
                skip: (safePage - 1) * pageSize,
                take: pageSize,
                orderBy: {user: {fullName: 'asc'}},
            }),
            this.database.member.count({where}),
        ]);

        return {items, total};
    }

    /** @inheritdoc */
    async findAdmins(options: AdminListOptions = {}): Promise<PageResult<AdminWithUser>> {
        const {search, page = 1, pageSize = 10} = options;
        const safePage = Math.max(1, page);

        const safeSearch = search ? escapeLike(search) : undefined;
        const where = safeSearch
            ? {
                user: {
                    OR: [
                        {fullName: {contains: safeSearch, mode: 'insensitive' as const}},
                        {email: {contains: safeSearch, mode: 'insensitive' as const}},
                    ],
                },
            }
            : undefined;

        const [items, total] = await this.database.$transaction([
            this.database.admin.findMany({
                where,
                include: {user: true},
                skip: (safePage - 1) * pageSize,
                take: pageSize,
                orderBy: {user: {fullName: 'asc'}},
            }),
            this.database.admin.count({where}),
        ]);

        return {items, total};
    }

    /** @inheritdoc */
    async updateMember(memberId: string, data: UpdateMemberInput): Promise<MemberWithUser> {
        const current = await this.database.member.findUnique({
            where: {id: memberId},
            include: {user: true},
        });
        if (!current) {
            throw new NotFoundError(`Member not found: ${memberId}`);
        }

        if (data.email && data.email !== current.user.email) {
            const conflict = await this.database.user.findUnique({
                where: {email: data.email}
            });
            if (conflict) {
                throw new ConflictError(`Email already in use: ${data.email}`);
            }
        }

        const passwordHash = data.password
            ? await bcrypt.hash(data.password, 12)
            : undefined;

        try {
            return await this.database.member.update({
                where: {id: memberId},
                data: {
                    ...(data.membershipStart
                        ? {membershipStart: new Date(data.membershipStart)}
                        : {}),
                    user: {
                        update: {
                            ...(data.email ? {email: data.email} : {}),
                            ...(data.fullName ? {fullName: data.fullName} : {}),
                            ...(data.phone ? {phone: data.phone} : {}),
                            ...(data.dateOfBirth ? {dateOfBirth: new Date(data.dateOfBirth)} : {}),
                            ...(passwordHash ? {passwordHash} : {}),
                        },
                    },
                },
                include: {user: true},
            });
        } catch (error) {
            throw new TransactionError(`Failed to update member: ${(error as Error).message}`);
        }
    }

    /** @inheritdoc */
    async setMemberActive(memberId: string, isActive: boolean): Promise<MemberWithUser> {
        const member = await this.database.member.findUnique({
            where: {id: memberId}
        });
        if (!member) {
            throw new NotFoundError(`Member not found: ${memberId}`);
        }

        return this.database.member.update({where: {id: memberId}, data: {isActive}, include: {user: true}});
    }

    /** @inheritdoc */
    async updateAdmin(adminId: string, data: UpdateAdminInput): Promise<AdminWithUser> {
        const current = await this.database.admin.findUnique({
            where: {id: adminId},
            include: {user: true},
        });
        if (!current) {
            throw new NotFoundError(`Admin not found: ${adminId}`);
        }

        if (data.email && data.email !== current.user.email) {
            const conflict = await this.database.user.findUnique({
                where: {email: data.email}
            });
            if (conflict) {
                throw new ConflictError(`Email already in use: ${data.email}`);
            }
        }

        const passwordHash = data.password
            ? await bcrypt.hash(data.password, 12)
            : undefined;

        try {
            return await this.database.admin.update({
                where: {id: adminId},
                data: {
                    user: {
                        update: {
                            ...(data.email ? {email: data.email} : {}),
                            ...(data.fullName ? {fullName: data.fullName} : {}),
                            ...(data.phone ? {phone: data.phone} : {}),
                            ...(data.dateOfBirth ? {dateOfBirth: new Date(data.dateOfBirth)} : {}),
                            ...(passwordHash ? {passwordHash} : {}),
                        },
                    },
                },
                include: {user: true},
            });
        } catch (error) {
            throw new TransactionError(`Failed to update admin: ${(error as Error).message}`);
        }
    }

    /** @inheritdoc */
    async delete(id: string): Promise<void> {
        const profile = await this.database.member.findUnique({where: {id}})
            ?? await this.database.admin.findUnique({where: {id}});

        if (!profile) {
            throw new NotFoundError(`Member or admin not found: ${id}`);
        }

        await this.database.user.delete({where: {id: profile.userId}});
    }
}
