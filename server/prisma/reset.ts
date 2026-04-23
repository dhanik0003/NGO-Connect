import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { CATEGORY_SEEDS } from "../src/config/constants";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.volunteerAssignment.deleteMany();
  await prisma.taskEvidence.deleteMany();
  await prisma.taskStatusHistory.deleteMany();
  await prisma.reportStatusHistory.deleteMany();
  await prisma.aiDecision.deleteMany();
  await prisma.escalation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ngoTask.deleteMany();
  await prisma.masterReport.deleteMany();
  await prisma.duplicateGroup.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.surveyorProfile.deleteMany();
  await prisma.ngoRegion.deleteMany();
  await prisma.ngoDomain.deleteMany();
  await prisma.ngo.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.routingConfig.deleteMany();

  await prisma.routingConfig.create({
    data: {
      directSameDomainSameRegion: true,
      allowOutsideRegionException: true,
      uncertainClassificationBelow: 65,
      emergencyPriorityThreshold: 85,
      autoRouteConfidenceThreshold: 72,
      duplicateGeoRadiusKm: 1.5,
      duplicateLookbackHours: 72,
    },
  });

  await prisma.category.createMany({
    data: CATEGORY_SEEDS.map((category) => ({
      name: category.name,
      slug: category.slug,
      description: category.description,
      colorHex: category.colorHex,
      iconKey: category.iconKey,
      isActive: true,
    })),
  });

  // eslint-disable-next-line no-console
  console.log("Application database reset complete.");
  // eslint-disable-next-line no-console
  console.log("Preserved setup: categories and routing configuration.");
  // eslint-disable-next-line no-console
  console.log("Removed: all users, NGOs, surveyors, volunteers, reports, tasks, notifications, tokens, and history.");
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
