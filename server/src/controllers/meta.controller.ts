import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { NgoVerificationStatus } from "@prisma/client";

export const metaController = {
  bootstrap: async (_req: Request, res: Response) => {
    const [categories, ngos] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.ngo.findMany({
        where: {
          verificationStatus: {
            notIn: [NgoVerificationStatus.REJECTED, NgoVerificationStatus.SUSPENDED],
          },
        },
        orderBy: { name: "asc" },
        include: {
          domains: {
            include: { category: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        categories,
        ngos: ngos.map((ngo) => ({
          id: ngo.id,
          name: ngo.name,
          serviceRadiusKm: ngo.serviceRadiusKm,
          verificationStatus: ngo.verificationStatus,
          domains: ngo.domains.map((domain) => ({
            id: domain.category.id,
            name: domain.category.name,
            slug: domain.category.slug,
          })),
        })),
      },
    });
  },
};
