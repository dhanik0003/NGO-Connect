import { NgoVerificationStatus, NotificationType, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";
import { comparePassword, createOpaqueToken, hashPassword, hashToken } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { notificationService } from "./notification.service";

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
} as const;

const persistRefreshToken = async (userId: string, refreshToken: string) => {
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });
};

const buildAuthResponse = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: publicUserSelect,
  });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await persistRefreshToken(user.id, refreshToken);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const ensureRegistrationIdentifiersAvailable = async (input: {
  email: string;
  phone?: string;
  officialEmail?: string;
}) => {
  const duplicateUsers = await prisma.user.findFirst({
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
    throw new AppError("An account with this email already exists.", 409);
  }

  if (input.phone && duplicateUsers?.phone === input.phone) {
    throw new AppError("An account with this phone number already exists.", 409);
  }

  if (input.officialEmail) {
    const duplicateNgo = await prisma.ngo.findFirst({
      where: {
        officialEmail: input.officialEmail,
      },
      select: {
        id: true,
      },
    });

    if (duplicateNgo) {
      throw new AppError("An NGO with this email already exists.", 409);
    }
  }
};

export const authService = {
  async registerUser(input: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    currentAddress: string;
    profileImageUrl?: string;
  }) {
    await ensureRegistrationIdentifiersAvailable({
      email: input.email,
      phone: input.phone,
    });

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        role: Role.USER,
        currentAddress: input.currentAddress,
        profileImageUrl: input.profileImageUrl,
      },
    });

    return buildAuthResponse(user.id);
  },

  async registerNgo(input: {
    ngoName: string;
    email: string;
    officialEmail?: string;
    phone: string;
    password: string;
    description?: string;
    headquartersAddress: string;
    latitude?: number;
    longitude?: number;
    serviceRadiusKm: number;
    domainSlugs: string[];
    operatingRegions?: Array<{
      regionName: string;
      latitude: number;
      longitude: number;
      coverageRadiusKm: number;
    }>;
    adminFullName: string;
    adminPhone?: string;
    verificationDocumentUrl?: string;
  }) {
    const adminEmail = input.email;
    const officialEmail = input.officialEmail ?? input.email;
    await ensureRegistrationIdentifiersAvailable({
      email: adminEmail,
      phone: input.adminPhone,
      officialEmail,
    });
    const fallbackLatitude = input.latitude ?? 28.6139;
    const fallbackLongitude = input.longitude ?? 77.209;
    const operatingRegions =
      input.operatingRegions && input.operatingRegions.length > 0
        ? input.operatingRegions
        : [
            {
              regionName: `${input.ngoName} Primary Region`,
              latitude: fallbackLatitude,
              longitude: fallbackLongitude,
              coverageRadiusKm: input.serviceRadiusKm,
            },
          ];
    const categoryRecords = await prisma.category.findMany({
      where: { slug: { in: input.domainSlugs } },
    });

    if (categoryRecords.length !== input.domainSlugs.length) {
      throw new AppError("One or more NGO domains are invalid.", 400);
    }

    const created = await prisma.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: {
          fullName: input.adminFullName,
          email: adminEmail,
          phone: input.adminPhone,
          passwordHash: await hashPassword(input.password),
          role: Role.NGO_ADMIN,
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
          verificationStatus: NgoVerificationStatus.APPROVED,
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
          actorRole: Role.NGO_ADMIN,
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

  async registerSurveyor(input: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    ngoId: string;
    assignedAddress: string;
    serviceRadiusKm: number;
    idProofUrl?: string;
  }) {
    await ensureRegistrationIdentifiersAvailable({
      email: input.email,
      phone: input.phone,
    });

    const ngo = await prisma.ngo.findUnique({
      where: { id: input.ngoId },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!ngo) {
      throw new AppError("NGO not found.", 404);
    }

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        role: Role.SURVEYOR,
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

  async registerVolunteer(input: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    ngoId: string;
    latitude: number;
    longitude: number;
    serviceRadiusKm: number;
    skills: string[];
    availableFrom?: Date;
    availableTo?: Date;
    vehicleType?: string;
    idProofUrl?: string;
  }) {
    await ensureRegistrationIdentifiersAvailable({
      email: input.email,
      phone: input.phone,
    });

    const ngo = await prisma.ngo.findUnique({
      where: { id: input.ngoId },
      select: { id: true },
    });

    if (!ngo) {
      throw new AppError("NGO not found.", 404);
    }

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        role: Role.VOLUNTEER,
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

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new AppError("Invalid credentials.", 401);
    }

    if (!user.isActive) {
      throw new AppError("This account has been disabled.", 403);
    }

    return buildAuthResponse(user.id);
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.userId,
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!stored) {
      throw new AppError("Refresh token is invalid.", 401);
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return buildAuthResponse(payload.userId);
  },

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: true };
    }

    const rawToken = createOpaqueToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await notificationService.create({
      recipientUserId: user.id,
      role: user.role,
      title: "Password reset requested",
      body: "Use the latest reset token to update your password. In hackathon mode, the token is returned once in the API response.",
      type: NotificationType.GENERAL,
    });

    return {
      success: true,
      resetTokenPreview: rawToken,
    };
  },

  async resetPassword(token: string, nextPassword: string) {
    const tokenHash = hashToken(token);
    const stored = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!stored) {
      throw new AppError("Reset token is invalid or expired.", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: stored.userId },
        data: { passwordHash: await hashPassword(nextPassword) },
      });

      await tx.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      });
    });

    return { success: true };
  },

  async getMe(userId: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: publicUserSelect,
    });
  },

  async updateProfile(
    userId: string,
    input: {
      fullName?: string;
      phone?: string | null;
      currentAddress?: string | null;
      profileImageUrl?: string;
    },
  ) {
    if (input.phone) {
      const existing = await prisma.user.findFirst({
        where: {
          phone: input.phone,
          id: { not: userId },
        },
        select: { id: true },
      });

      if (existing) {
        throw new AppError("Another account already uses this phone number.", 409);
      }
    }

    return prisma.user.update({
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
