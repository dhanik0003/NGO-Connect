"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaController = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
exports.metaController = {
    bootstrap: async (_req, res) => {
        const [categories, ngos] = await Promise.all([
            prisma_1.prisma.category.findMany({
                where: { isActive: true },
                orderBy: { name: "asc" },
            }),
            prisma_1.prisma.ngo.findMany({
                where: {
                    verificationStatus: {
                        notIn: [client_1.NgoVerificationStatus.REJECTED, client_1.NgoVerificationStatus.SUSPENDED],
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
