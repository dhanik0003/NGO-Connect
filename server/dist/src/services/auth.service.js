"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const app_error_1 = require("../utils/app-error");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const notification_service_1 = require("./notification.service");
const publicUserSelect = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    currentAddress: true,
    profileImageUrl: true,
    isActive: true,
    createdAt: true,
    createdNgos: {
        include: {
            domains: { include: { category: true } },
            regions: true,
        },
    },
    surveyProfile: {
        include: {
            ngo: {
                include: {
                    domains: {
                        include: {
                            category: true,
                        },
                    },
                },
            },
        },
    },
    volunteerProfile: {
        include: {
            ngo: {
                include: {
                    domains: {
                        include: {
                            category: true,
                        },
                    },
                },
            },
        },
    },
};
const persistRefreshToken = async (userId, refreshToken) => {
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await prisma_1.prisma.refreshToken.create({
        data: {
            userId,
            tokenHash: (0, password_1.hashToken)(refreshToken),
            expiresAt,
        },
    });
};
const buildAuthResponse = async (userId) => {
    const user = await prisma_1.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: publicUserSelect,
    });
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    await persistRefreshToken(user.id, refreshToken);
    return {
        user,
        accessToken,
        refreshToken,
    };
};
const ensureRegistrationIdentifiersAvailable = async (input) => {
    const duplicateUsers = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [
                { email: input.email },
                ...(input.phone ? [{ phone: input.phone }] : []),
            ],
        },
        select: {
            email: true,
            phone: true,
        },
    });
    if (duplicateUsers?.email === input.email) {
        throw new app_error_1.AppError("An account with this email already exists.", 409);
    }
    if (input.phone && duplicateUsers?.phone === input.phone) {
        throw new app_error_1.AppError("An account with this phone number already exists.", 409);
    }
    if (input.officialEmail) {
        const duplicateNgo = await prisma_1.prisma.ngo.findFirst({
            where: {
                officialEmail: input.officialEmail,
            },
            select: {
                id: true,
            },
        });
        if (duplicateNgo) {
            throw new app_error_1.AppError("An NGO with this email already exists.", 409);
        }
    }
};
exports.authService = {
    async registerUser(input) {
        await ensureRegistrationIdentifiersAvailable({
            email: input.email,
            phone: input.phone,
        });
        const user = await prisma_1.prisma.user.create({
            data: {
                fullName: input.fullName,
                email: input.email,
                phone: input.phone,
                passwordHash: await (0, password_1.hashPassword)(input.password),
                role: client_1.Role.USER,
                currentAddress: input.currentAddress,
                profileImageUrl: input.profileImageUrl,
            },
        });
        return buildAuthResponse(user.id);
    },
    async registerNgo(input) {
        const adminEmail = input.email;
        const officialEmail = input.officialEmail ?? input.email;
        await ensureRegistrationIdentifiersAvailable({
            email: adminEmail,
            phone: input.adminPhone,
            officialEmail,
        });
        const fallbackLatitude = input.latitude ?? 28.6139;
        const fallbackLongitude = input.longitude ?? 77.209;
        const operatingRegions = input.operatingRegions && input.operatingRegions.length > 0
            ? input.operatingRegions
            : [
                {
                    regionName: `${input.ngoName} Primary Region`,
                    latitude: fallbackLatitude,
                    longitude: fallbackLongitude,
                    coverageRadiusKm: input.serviceRadiusKm,
                },
            ];
        const categoryRecords = await prisma_1.prisma.category.findMany({
            where: { slug: { in: input.domainSlugs } },
        });
        if (categoryRecords.length !== input.domainSlugs.length) {
            throw new app_error_1.AppError("One or more NGO domains are invalid.", 400);
        }
        const created = await prisma_1.prisma.$transaction(async (tx) => {
            const admin = await tx.user.create({
                data: {
                    fullName: input.adminFullName,
                    email: adminEmail,
                    phone: input.adminPhone,
                    passwordHash: await (0, password_1.hashPassword)(input.password),
                    role: client_1.Role.NGO_ADMIN,
                },
            });
            const ngo = await tx.ngo.create({
                data: {
                    name: input.ngoName,
                    officialEmail,
                    phone: input.phone,
                    description: input.description,
                    headquartersAddress: input.headquartersAddress,
                    latitude: fallbackLatitude,
                    longitude: fallbackLongitude,
                    serviceRadiusKm: input.serviceRadiusKm,
                    verificationStatus: client_1.NgoVerificationStatus.APPROVED,
                    verificationDocumentUrl: input.verificationDocumentUrl,
                    createdByUserId: admin.id,
                    domains: {
                        create: categoryRecords.map((category) => ({
                            categoryId: category.id,
                        })),
                    },
                    regions: {
                        create: operatingRegions.map((region) => ({
                            regionName: region.regionName,
                            latitude: region.latitude,
                            longitude: region.longitude,
                            coverageRadiusKm: region.coverageRadiusKm,
                        })),
                    },
                },
            });
            await tx.auditLog.create({
                data: {
                    actorUserId: admin.id,
                    actorRole: client_1.Role.NGO_ADMIN,
                    action: "ngo_registered",
                    entityType: "ngo",
                    entityId: ngo.id,
                    metadataJson: {
                        domains: input.domainSlugs,
                    },
                },
            });
            return { admin, ngo };
        });
        return buildAuthResponse(created.admin.id);
    },
    async registerSurveyor(input) {
        await ensureRegistrationIdentifiersAvailable({
            email: input.email,
            phone: input.phone,
        });
        const ngo = await prisma_1.prisma.ngo.findUnique({
            where: { id: input.ngoId },
            select: {
                id: true,
                latitude: true,
                longitude: true,
            },
        });
        if (!ngo) {
            throw new app_error_1.AppError("NGO not found.", 404);
        }
        const user = await prisma_1.prisma.user.create({
            data: {
                fullName: input.fullName,
                email: input.email,
                phone: input.phone,
                passwordHash: await (0, password_1.hashPassword)(input.password),
                role: client_1.Role.SURVEYOR,
                currentAddress: input.assignedAddress,
                surveyProfile: {
                    create: {
                        ngoId: input.ngoId,
                        assignedRegionName: input.assignedAddress,
                        latitude: ngo.latitude,
                        longitude: ngo.longitude,
                        serviceRadiusKm: input.serviceRadiusKm,
                        idProofUrl: input.idProofUrl,
                    },
                },
            },
        });
        return buildAuthResponse(user.id);
    },
    async registerVolunteer(input) {
        await ensureRegistrationIdentifiersAvailable({
            email: input.email,
            phone: input.phone,
        });
        const ngo = await prisma_1.prisma.ngo.findUnique({
            where: { id: input.ngoId },
            select: { id: true },
        });
        if (!ngo) {
            throw new app_error_1.AppError("NGO not found.", 404);
        }
        const user = await prisma_1.prisma.user.create({
            data: {
                fullName: input.fullName,
                email: input.email,
                phone: input.phone,
                passwordHash: await (0, password_1.hashPassword)(input.password),
                role: client_1.Role.VOLUNTEER,
                volunteerProfile: {
                    create: {
                        ngoId: input.ngoId,
                        latitude: input.latitude,
                        longitude: input.longitude,
                        serviceRadiusKm: input.serviceRadiusKm,
                        skillsJson: input.skills,
                        availableFrom: input.availableFrom,
                        availableTo: input.availableTo,
                        vehicleType: input.vehicleType,
                        idProofUrl: input.idProofUrl,
                    },
                },
            },
        });
        return buildAuthResponse(user.id);
    },
    async login(email, password) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !(await (0, password_1.comparePassword)(password, user.passwordHash))) {
            throw new app_error_1.AppError("Invalid credentials.", 401);
        }
        if (!user.isActive) {
            throw new app_error_1.AppError("This account has been disabled.", 403);
        }
        return buildAuthResponse(user.id);
    },
    async refresh(refreshToken) {
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const stored = await prisma_1.prisma.refreshToken.findFirst({
            where: {
                userId: payload.userId,
                tokenHash: (0, password_1.hashToken)(refreshToken),
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (!stored) {
            throw new app_error_1.AppError("Refresh token is invalid.", 401);
        }
        await prisma_1.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });
        return buildAuthResponse(payload.userId);
    },
    async logout(refreshToken) {
        const tokenHash = (0, password_1.hashToken)(refreshToken);
        await prisma_1.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return { success: true };
    },
    async forgotPassword(email) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { success: true };
        }
        const rawToken = (0, password_1.createOpaqueToken)();
        const tokenHash = (0, password_1.hashToken)(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma_1.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });
        await notification_service_1.notificationService.create({
            recipientUserId: user.id,
            role: user.role,
            title: "Password reset requested",
            body: "Use the latest reset token to update your password. In hackathon mode, the token is returned once in the API response.",
            type: client_1.NotificationType.GENERAL,
        });
        return {
            success: true,
            resetTokenPreview: rawToken,
        };
    },
    async resetPassword(token, nextPassword) {
        const tokenHash = (0, password_1.hashToken)(token);
        const stored = await prisma_1.prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                expiresAt: { gt: new Date() },
                usedAt: null,
            },
        });
        if (!stored) {
            throw new app_error_1.AppError("Reset token is invalid or expired.", 400);
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: stored.userId },
                data: { passwordHash: await (0, password_1.hashPassword)(nextPassword) },
            });
            await tx.passwordResetToken.update({
                where: { id: stored.id },
                data: { usedAt: new Date() },
            });
        });
        return { success: true };
    },
    async getMe(userId) {
        return prisma_1.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: publicUserSelect,
        });
    },
    async updateProfile(userId, input) {
        if (input.phone) {
            const existing = await prisma_1.prisma.user.findFirst({
                where: {
                    phone: input.phone,
                    id: { not: userId },
                },
                select: { id: true },
            });
            if (existing) {
                throw new app_error_1.AppError("Another account already uses this phone number.", 409);
            }
        }
        return prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                fullName: input.fullName,
                phone: input.phone === undefined ? undefined : input.phone,
                currentAddress: input.currentAddress === undefined ? undefined : input.currentAddress,
                profileImageUrl: input.profileImageUrl,
            },
            select: publicUserSelect,
        });
    },
};
