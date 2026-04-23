"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const constants_1 = require("../src/config/constants");
const password_1 = require("../src/utils/password");
const prisma = new client_1.PrismaClient();
const basePassword = "Demo@12345";
const ngoDefinitions = [
    {
        name: "PawCare Alliance",
        officialEmail: "hello@pawcare.org",
        phone: "+919100000201",
        description: "Rapid rescue network for injured and abandoned animals across central NCR.",
        headquartersAddress: "Connaught Place, New Delhi",
        latitude: 28.6315,
        longitude: 77.2167,
        serviceRadiusKm: 22,
        verificationStatus: client_1.NgoVerificationStatus.APPROVED,
        domains: ["animal-care"],
        regions: [{ regionName: "Central Delhi", latitude: 28.6352, longitude: 77.2199, coverageRadiusKm: 20 }],
        admin: { fullName: "Aditi Rao", email: "aditi.rao@pawcare.org", phone: "+919100001201" },
    },
    {
        name: "Sehat Line Foundation",
        officialEmail: "care@sehatline.org",
        phone: "+919100000202",
        description: "Health and emergency response NGO focused on urgent community care and medicine access.",
        headquartersAddress: "DLF Phase 2, Gurugram",
        latitude: 28.4898,
        longitude: 77.089,
        serviceRadiusKm: 25,
        verificationStatus: client_1.NgoVerificationStatus.APPROVED,
        domains: ["healthcare", "elder-care"],
        regions: [{ regionName: "Gurugram Core", latitude: 28.4744, longitude: 77.0727, coverageRadiusKm: 22 }],
        admin: { fullName: "Dr. Niharika Sen", email: "niharika@sehatline.org", phone: "+919100001202" },
    },
    {
        name: "Udaan Learning Collective",
        officialEmail: "team@udaancollective.org",
        phone: "+919100000203",
        description: "Education access, child support, school-restoration and field-learning collective.",
        headquartersAddress: "Sector 62, Noida",
        latitude: 28.6289,
        longitude: 77.3646,
        serviceRadiusKm: 24,
        verificationStatus: client_1.NgoVerificationStatus.APPROVED,
        domains: ["education", "child-welfare"],
        regions: [{ regionName: "Noida North", latitude: 28.6212, longitude: 77.3678, coverageRadiusKm: 20 }],
        admin: { fullName: "Rahul Bakshi", email: "rahul@udaancollective.org", phone: "+919100001203" },
    },
    {
        name: "Silver Circle Support",
        officialEmail: "reach@silvercircle.org",
        phone: "+919100000204",
        description: "Senior welfare response team for medical aid, companionship and rescue checks.",
        headquartersAddress: "Lajpat Nagar, New Delhi",
        latitude: 28.5677,
        longitude: 77.2432,
        serviceRadiusKm: 18,
        verificationStatus: client_1.NgoVerificationStatus.APPROVED,
        domains: ["elder-care", "healthcare"],
        regions: [{ regionName: "South Delhi Care Belt", latitude: 28.5629, longitude: 77.2436, coverageRadiusKm: 16 }],
        admin: { fullName: "Meera Sharma", email: "meera@silvercircle.org", phone: "+919100001204" },
    },
    {
        name: "Nari Shield Network",
        officialEmail: "contact@narishield.org",
        phone: "+919100000205",
        description: "Safety, crisis response and referral network for women and vulnerable children.",
        headquartersAddress: "Indirapuram, Ghaziabad",
        latitude: 28.6445,
        longitude: 77.3691,
        serviceRadiusKm: 26,
        verificationStatus: client_1.NgoVerificationStatus.APPROVED,
        domains: ["women-safety", "child-welfare"],
        regions: [{ regionName: "Ghaziabad East", latitude: 28.6408, longitude: 77.3659, coverageRadiusKm: 22 }],
        admin: { fullName: "Sana Siddiqui", email: "sana@narishield.org", phone: "+919100001205" },
    },
    {
        name: "Green Pulse Mission",
        officialEmail: "ops@greenpulse.org",
        phone: "+919100000206",
        description: "Environment and sanitation intervention team for pollution, waste and cleanup response.",
        headquartersAddress: "Sector 21C, Faridabad",
        latitude: 28.4089,
        longitude: 77.3178,
        serviceRadiusKm: 28,
        verificationStatus: client_1.NgoVerificationStatus.APPROVED,
        domains: ["environment", "sanitation"],
        regions: [{ regionName: "Faridabad Urban Belt", latitude: 28.4105, longitude: 77.3148, coverageRadiusKm: 24 }],
        admin: { fullName: "Vikram Narula", email: "vikram@greenpulse.org", phone: "+919100001206" },
    },
    {
        name: "Community Kitchens Trust",
        officialEmail: "support@communitykitchens.org",
        phone: "+919100000207",
        description: "Local ration, kitchen and hunger-relief network serving dense urban neighborhoods.",
        headquartersAddress: "Mayur Vihar, New Delhi",
        latitude: 28.6076,
        longitude: 77.2944,
        serviceRadiusKm: 20,
        verificationStatus: client_1.NgoVerificationStatus.APPROVED,
        domains: ["food-support"],
        regions: [{ regionName: "East Delhi Food Corridor", latitude: 28.6061, longitude: 77.2965, coverageRadiusKm: 18 }],
        admin: { fullName: "Neha Chawla", email: "neha@communitykitchens.org", phone: "+919100001207" },
    },
    {
        name: "Rapid Relief Corps",
        officialEmail: "dispatch@rapidrelief.org",
        phone: "+919100000208",
        description: "Multi-agency rapid response unit for floods, fires, evacuations and relief logistics.",
        headquartersAddress: "Dwarka, New Delhi",
        latitude: 28.5921,
        longitude: 77.046,
        serviceRadiusKm: 35,
        verificationStatus: client_1.NgoVerificationStatus.APPROVED,
        domains: ["disaster-relief", "food-support"],
        regions: [{ regionName: "NCR Relief Zone", latitude: 28.5966, longitude: 77.0389, coverageRadiusKm: 32 }],
        admin: { fullName: "Arjun Khanna", email: "arjun@rapidrelief.org", phone: "+919100001208" },
    },
];
const surveyorNames = [
    "Karan Malhotra",
    "Ananya Ghosh",
    "Ritesh Yadav",
    "Fatima Khan",
    "Apoorva Jain",
    "Tanya Bedi",
    "Raghav Anand",
    "Kushal Rana",
    "Nikita Bose",
    "Vivek Kumar",
    "Suhani Talwar",
    "Manav Sethi",
    "Ishita Dutta",
    "Yusuf Khan",
    "Prerna Kaul",
];
const volunteerNames = [
    "Asha Verma", "Rohan Mehta", "Priya Singh", "Karan Joshi", "Sakshi Jain", "Mohit Batra",
    "Anmol Gupta", "Diya Nair", "Kabir Ahuja", "Tanvi Kapoor", "Dev Malik", "Ira Paul",
    "Naman Arora", "Pooja Das", "Harshit Rawat", "Simran Oberoi", "Aman Khan", "Mitali Roy",
    "Aarav Seth", "Riya Bhat", "Shreya Menon", "Varun Kohli", "Kavya Rathi", "Yashika Sood",
    "Rudra Singh", "Navya Iyer", "Parth Solanki", "Mehak Gulati", "Dhairya Singh", "Zoya Mirza",
];
const citizenNames = Array.from({ length: 40 }, (_, index) => `Citizen Reporter ${index + 1}`);
const categoryTemplateMap = {
    "animal-care": {
        titles: ["Injured stray dog near market", "Cow with open wound on roadside", "Puppies abandoned without shelter"],
        descriptions: [
            "A visibly injured street animal is unable to move and needs rescue support.",
            "Local residents report the animal has been in distress for hours and needs treatment.",
        ],
    },
    healthcare: {
        titles: ["Elderly man needs urgent medicine", "Community fever cluster reported", "Injured worker needs first response"],
        descriptions: [
            "Medical aid is required and delay may worsen the condition.",
            "People nearby report no immediate support team is available on site.",
        ],
    },
    education: {
        titles: ["Children without school materials", "Classroom roof leak disrupting school", "Girls need transport to learning center"],
        descriptions: [
            "The issue is affecting regular attendance and educational continuity.",
            "The local community asked for NGO support to prevent drop-offs.",
        ],
    },
    "elder-care": {
        titles: ["Senior citizen abandoned at bus stop", "Bedridden elder needs welfare check", "Elderly woman lacks food and medicine"],
        descriptions: [
            "Neighbors say the person is vulnerable and cannot manage independently.",
            "The case needs quick welfare intervention and on-ground verification.",
        ],
    },
    "women-safety": {
        titles: ["Harassment hotspot reported near school", "Woman requests emergency safe transport", "Unsafe alley needs immediate intervention"],
        descriptions: [
            "The report indicates a high vulnerability and community safety concern.",
            "Support is needed with urgency and escalation risk is high if ignored.",
        ],
    },
    environment: {
        titles: ["Industrial dumping near drain", "Tree loss reported after illegal cutting", "Polluted lake stretch needs cleanup"],
        descriptions: [
            "Residents report visible environmental damage and growing local impact.",
            "The area will worsen without timely intervention and cleanup planning.",
        ],
    },
    "food-support": {
        titles: ["Meal shortage at night shelter", "Families need ration support", "Children missing nutrition support this week"],
        descriptions: [
            "The affected group does not have stable access to food right now.",
            "Local supply has broken down and volunteer distribution is needed.",
        ],
    },
    "disaster-relief": {
        titles: ["Garbage fire spreading near homes", "Floodwater trapping residents", "Wall collapse risk after heavy rain"],
        descriptions: [
            "There is immediate danger and the situation may escalate if response is delayed.",
            "People in the area report safety risks and urgent relief requirements.",
        ],
    },
    sanitation: {
        titles: ["Overflowing sewage near colony gate", "Garbage buildup causing public health risk", "Drain blockage flooding lane"],
        descriptions: [
            "The sanitation issue is affecting multiple households and needs cleanup support.",
            "People nearby say children and elders are already impacted by the conditions.",
        ],
    },
    "child-welfare": {
        titles: ["Children found without supervision", "Minor needs shelter support", "Child labor concern raised by residents"],
        descriptions: [
            "The report indicates a vulnerable child who may need immediate welfare attention.",
            "Further delay could raise safety and protection concerns.",
        ],
    },
};
const skillMap = {
    "animal-care": ["Animal Rescue", "Driving", "First Aid"],
    healthcare: ["Medical", "First Aid", "Counseling"],
    education: ["Teaching", "Mentoring", "Community Outreach"],
    "elder-care": ["Care Support", "First Aid", "Driving"],
    "women-safety": ["Crisis Response", "Counseling", "Legal Referral"],
    environment: ["Cleanup", "Logistics", "Community Outreach"],
    "food-support": ["Distribution", "Cooking", "Logistics"],
    "disaster-relief": ["Rapid Response", "Driving", "Logistics"],
    sanitation: ["Cleanup", "Logistics", "Community Outreach"],
    "child-welfare": ["Counseling", "Mentoring", "Community Outreach"],
};
const reportLifecycle = (status) => {
    switch (status) {
        case client_1.MasterReportStatus.VERIFIED_CLOSED:
            return [
                client_1.MasterReportStatus.SUBMITTED,
                client_1.MasterReportStatus.CLASSIFIED,
                client_1.MasterReportStatus.ROUTED_TO_NGO,
                client_1.MasterReportStatus.ACCEPTED_BY_NGO,
                client_1.MasterReportStatus.VOLUNTEER_ASSIGNED,
                client_1.MasterReportStatus.IN_PROGRESS,
                client_1.MasterReportStatus.COMPLETED_PENDING_VERIFICATION,
                client_1.MasterReportStatus.VERIFIED_CLOSED,
            ];
        case client_1.MasterReportStatus.COMPLETED_PENDING_VERIFICATION:
            return [
                client_1.MasterReportStatus.SUBMITTED,
                client_1.MasterReportStatus.CLASSIFIED,
                client_1.MasterReportStatus.ROUTED_TO_NGO,
                client_1.MasterReportStatus.ACCEPTED_BY_NGO,
                client_1.MasterReportStatus.VOLUNTEER_ASSIGNED,
                client_1.MasterReportStatus.IN_PROGRESS,
                client_1.MasterReportStatus.COMPLETED_PENDING_VERIFICATION,
            ];
        case client_1.MasterReportStatus.IN_PROGRESS:
            return [
                client_1.MasterReportStatus.SUBMITTED,
                client_1.MasterReportStatus.CLASSIFIED,
                client_1.MasterReportStatus.ROUTED_TO_NGO,
                client_1.MasterReportStatus.ACCEPTED_BY_NGO,
                client_1.MasterReportStatus.VOLUNTEER_ASSIGNED,
                client_1.MasterReportStatus.IN_PROGRESS,
            ];
        case client_1.MasterReportStatus.VOLUNTEER_ASSIGNED:
            return [
                client_1.MasterReportStatus.SUBMITTED,
                client_1.MasterReportStatus.CLASSIFIED,
                client_1.MasterReportStatus.ROUTED_TO_NGO,
                client_1.MasterReportStatus.ACCEPTED_BY_NGO,
                client_1.MasterReportStatus.VOLUNTEER_ASSIGNED,
            ];
        case client_1.MasterReportStatus.ACCEPTED_BY_NGO:
            return [
                client_1.MasterReportStatus.SUBMITTED,
                client_1.MasterReportStatus.CLASSIFIED,
                client_1.MasterReportStatus.ROUTED_TO_NGO,
                client_1.MasterReportStatus.ACCEPTED_BY_NGO,
            ];
        case client_1.MasterReportStatus.REJECTED_BY_NGO:
            return [
                client_1.MasterReportStatus.SUBMITTED,
                client_1.MasterReportStatus.CLASSIFIED,
                client_1.MasterReportStatus.ROUTED_TO_NGO,
                client_1.MasterReportStatus.REJECTED_BY_NGO,
            ];
        case client_1.MasterReportStatus.REASSIGNMENT_PENDING:
            return [
                client_1.MasterReportStatus.SUBMITTED,
                client_1.MasterReportStatus.CLASSIFIED,
                client_1.MasterReportStatus.ROUTED_TO_NGO,
                client_1.MasterReportStatus.ACCEPTED_BY_NGO,
                client_1.MasterReportStatus.REASSIGNMENT_PENDING,
            ];
        case client_1.MasterReportStatus.CLASSIFIED:
            return [client_1.MasterReportStatus.SUBMITTED, client_1.MasterReportStatus.CLASSIFIED];
        case client_1.MasterReportStatus.UNDER_REVIEW:
            return [client_1.MasterReportStatus.SUBMITTED, client_1.MasterReportStatus.UNDER_REVIEW];
        case client_1.MasterReportStatus.ESCALATED:
            return [client_1.MasterReportStatus.SUBMITTED, client_1.MasterReportStatus.CLASSIFIED, client_1.MasterReportStatus.ESCALATED];
        case client_1.MasterReportStatus.DUPLICATE_FLAGGED:
            return [client_1.MasterReportStatus.SUBMITTED, client_1.MasterReportStatus.CLASSIFIED, client_1.MasterReportStatus.DUPLICATE_FLAGGED];
        case client_1.MasterReportStatus.DUPLICATE_MERGED:
            return [client_1.MasterReportStatus.SUBMITTED, client_1.MasterReportStatus.CLASSIFIED, client_1.MasterReportStatus.DUPLICATE_MERGED];
        case client_1.MasterReportStatus.INVALID:
            return [client_1.MasterReportStatus.SUBMITTED, client_1.MasterReportStatus.INVALID];
        default:
            return [client_1.MasterReportStatus.SUBMITTED];
    }
};
const taskLifecycle = (status) => {
    switch (status) {
        case client_1.NgoTaskStatus.VERIFIED_CLOSED:
            return [
                client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
                client_1.NgoTaskStatus.ACCEPTED,
                client_1.NgoTaskStatus.ASSIGNED,
                client_1.NgoTaskStatus.IN_PROGRESS,
                client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
                client_1.NgoTaskStatus.VERIFIED_CLOSED,
            ];
        case client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION:
            return [
                client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
                client_1.NgoTaskStatus.ACCEPTED,
                client_1.NgoTaskStatus.ASSIGNED,
                client_1.NgoTaskStatus.IN_PROGRESS,
                client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION,
            ];
        case client_1.NgoTaskStatus.IN_PROGRESS:
            return [
                client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE,
                client_1.NgoTaskStatus.ACCEPTED,
                client_1.NgoTaskStatus.ASSIGNED,
                client_1.NgoTaskStatus.IN_PROGRESS,
            ];
        case client_1.NgoTaskStatus.ASSIGNED:
            return [client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE, client_1.NgoTaskStatus.ACCEPTED, client_1.NgoTaskStatus.ASSIGNED];
        case client_1.NgoTaskStatus.ACCEPTED:
            return [client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE, client_1.NgoTaskStatus.ACCEPTED];
        case client_1.NgoTaskStatus.REJECTED:
            return [client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE, client_1.NgoTaskStatus.REJECTED];
        case client_1.NgoTaskStatus.REASSIGNMENT_NEEDED:
            return [client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE, client_1.NgoTaskStatus.ACCEPTED, client_1.NgoTaskStatus.ASSIGNED, client_1.NgoTaskStatus.REASSIGNMENT_NEEDED];
        case client_1.NgoTaskStatus.ESCALATED:
            return [client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE, client_1.NgoTaskStatus.ACCEPTED, client_1.NgoTaskStatus.ESCALATED];
        default:
            return [client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE];
    }
};
const createHistories = async (input) => {
    const reportStages = reportLifecycle(input.reportStatus);
    for (let index = 0; index < reportStages.length; index += 1) {
        const stage = reportStages[index];
        const previous = index > 0 ? reportStages[index - 1] : null;
        const actor = stage === client_1.MasterReportStatus.SUBMITTED
            ? input.reporterUserId
            : stage === client_1.MasterReportStatus.ACCEPTED_BY_NGO || stage === client_1.MasterReportStatus.REJECTED_BY_NGO
                ? input.ngoAdminUserId
                : stage === client_1.MasterReportStatus.VOLUNTEER_ASSIGNED
                    ? input.ngoAdminUserId
                    : stage === client_1.MasterReportStatus.IN_PROGRESS || stage === client_1.MasterReportStatus.COMPLETED_PENDING_VERIFICATION || stage === client_1.MasterReportStatus.VERIFIED_CLOSED
                        ? input.volunteerUserId ?? input.ngoAdminUserId
                        : input.ngoAdminUserId ?? input.reporterUserId;
        await prisma.reportStatusHistory.create({
            data: {
                reportId: input.reportId,
                oldStatus: previous ?? undefined,
                newStatus: stage,
                changedByUserId: actor,
                note: `Seeded lifecycle step: ${stage}.`,
            },
        });
    }
    if (input.taskId && input.taskStatus) {
        const taskStages = taskLifecycle(input.taskStatus);
        for (let index = 0; index < taskStages.length; index += 1) {
            const stage = taskStages[index];
            const previous = index > 0 ? taskStages[index - 1] : null;
            const actor = stage === client_1.NgoTaskStatus.PENDING_NGO_ACCEPTANCE || stage === client_1.NgoTaskStatus.ACCEPTED || stage === client_1.NgoTaskStatus.ASSIGNED
                ? input.ngoAdminUserId
                : input.volunteerUserId ?? input.ngoAdminUserId;
            await prisma.taskStatusHistory.create({
                data: {
                    taskId: input.taskId,
                    oldStatus: previous ?? undefined,
                    newStatus: stage,
                    changedByUserId: actor,
                    note: `Seeded lifecycle step: ${stage}.`,
                },
            });
        }
    }
};
async function main() {
    const passwordHash = await (0, password_1.hashPassword)(basePassword);
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
    const categories = [];
    for (const category of constants_1.CATEGORY_SEEDS) {
        const created = await prisma.category.create({
            data: category,
        });
        categories.push(created);
    }
    const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
    const superAdmin = await prisma.user.create({
        data: {
            fullName: "Relief Grid Super Admin",
            email: "admin@reliefgrid.org",
            phone: "+919100000001",
            passwordHash,
            role: client_1.Role.SUPER_ADMIN,
            currentAddress: "Relief Grid HQ, New Delhi",
        },
    });
    const ngos = [];
    for (const definition of ngoDefinitions) {
        const admin = await prisma.user.create({
            data: {
                fullName: definition.admin.fullName,
                email: definition.admin.email,
                phone: definition.admin.phone,
                passwordHash,
                role: client_1.Role.NGO_ADMIN,
            },
        });
        const ngo = await prisma.ngo.create({
            data: {
                name: definition.name,
                officialEmail: definition.officialEmail,
                phone: definition.phone,
                description: definition.description,
                headquartersAddress: definition.headquartersAddress,
                latitude: definition.latitude,
                longitude: definition.longitude,
                serviceRadiusKm: definition.serviceRadiusKm,
                verificationStatus: definition.verificationStatus,
                createdByUserId: admin.id,
                domains: {
                    create: definition.domains.map((slug) => ({
                        categoryId: categoriesBySlug.get(slug).id,
                    })),
                },
                regions: {
                    create: definition.regions.map((region) => ({ ...region })),
                },
            },
        });
        ngos.push({
            id: ngo.id,
            createdByUserId: admin.id,
            name: ngo.name,
            latitude: ngo.latitude,
            longitude: ngo.longitude,
            domains: [...definition.domains],
        });
    }
    const surveyors = [];
    for (let index = 0; index < 15; index += 1) {
        const ngo = ngos[index % ngos.length];
        const latitude = ngo.latitude + (index % 5) * 0.008;
        const longitude = ngo.longitude + (index % 4) * 0.008;
        const user = await prisma.user.create({
            data: {
                fullName: surveyorNames[index],
                email: `surveyor${index + 1}@reliefgrid.demo`,
                phone: `+91920000${(100 + index).toString().padStart(3, "0")}`,
                passwordHash,
                role: client_1.Role.SURVEYOR,
            },
        });
        const profile = await prisma.surveyorProfile.create({
            data: {
                userId: user.id,
                ngoId: ngo.id,
                assignedRegionName: `${ngo.name} Field Zone ${index + 1}`,
                latitude,
                longitude,
                serviceRadiusKm: 12 + (index % 3) * 3,
            },
        });
        surveyors.push({
            id: profile.id,
            userId: user.id,
            ngoId: ngo.id,
            latitude,
            longitude,
            domainSlug: ngo.domains[0],
        });
    }
    const volunteers = [];
    for (let index = 0; index < 30; index += 1) {
        const ngo = ngos[index % ngos.length];
        const primaryDomain = ngo.domains[index % ngo.domains.length];
        const user = await prisma.user.create({
            data: {
                fullName: volunteerNames[index],
                email: `volunteer${index + 1}@reliefgrid.demo`,
                phone: `+91930000${(100 + index).toString().padStart(3, "0")}`,
                passwordHash,
                role: client_1.Role.VOLUNTEER,
            },
        });
        const profile = await prisma.volunteerProfile.create({
            data: {
                userId: user.id,
                ngoId: ngo.id,
                latitude: ngo.latitude + (index % 6) * 0.006,
                longitude: ngo.longitude + (index % 5) * 0.006,
                serviceRadiusKm: 10 + (index % 4) * 4,
                availabilityStatus: index % 5 === 0 ? client_1.AvailabilityStatus.BUSY : client_1.AvailabilityStatus.AVAILABLE,
                skillsJson: skillMap[primaryDomain],
                currentWorkload: index % 3,
                vehicleType: index % 2 === 0 ? "bike" : "car",
                rating: 4.2 + (index % 4) * 0.15,
                tasksCompleted: 4 + index,
                acceptanceRate: 76 + (index % 5) * 4,
            },
        });
        volunteers.push({
            id: profile.id,
            userId: user.id,
            ngoId: ngo.id,
            latitude: profile.latitude,
            longitude: profile.longitude,
            skills: skillMap[primaryDomain],
        });
    }
    const citizens = [];
    for (let index = 0; index < 40; index += 1) {
        const user = await prisma.user.create({
            data: {
                fullName: citizenNames[index],
                email: `citizen${index + 1}@reliefgrid.demo`,
                phone: `+91940000${(100 + index).toString().padStart(3, "0")}`,
                passwordHash,
                role: client_1.Role.USER,
                currentAddress: `Block ${index + 1}, Demo Sector, NCR`,
            },
        });
        citizens.push({ id: user.id, fullName: user.fullName });
    }
    const findNgoForCategory = (slug) => ngos.find((ngo) => ngo.domains.includes(slug)) ?? ngos[0];
    const volunteersByNgo = new Map(ngos.map((ngo) => [ngo.id, volunteers.filter((volunteer) => volunteer.ngoId === ngo.id)]));
    const surveyorsByNgo = new Map(ngos.map((ngo) => [ngo.id, surveyors.filter((surveyor) => surveyor.ngoId === ngo.id)]));
    const createdReports = [];
    for (let index = 0; index < 77; index += 1) {
        const category = categories[index % categories.length];
        const ngo = findNgoForCategory(category.slug);
        const volunteer = volunteersByNgo.get(ngo.id)?.[index % Math.max(volunteersByNgo.get(ngo.id)?.length ?? 1, 1)];
        const surveyor = surveyorsByNgo.get(ngo.id)?.[index % Math.max(surveyorsByNgo.get(ngo.id)?.length ?? 1, 1)];
        const template = categoryTemplateMap[category.slug];
        const title = template.titles[index % template.titles.length];
        const description = `${template.descriptions[index % template.descriptions.length]} Case ${index + 1}.`;
        const latitude = ngo.latitude + ((index % 7) - 3) * 0.01;
        const longitude = ngo.longitude + ((index % 5) - 2) * 0.01;
        const reporterIsSurveyor = index % 6 === 0 && surveyor;
        const reporterUserId = reporterIsSurveyor ? surveyor.userId : citizens[index % citizens.length].id;
        const reporterRole = reporterIsSurveyor ? client_1.ReporterRole.SURVEYOR : client_1.ReporterRole.USER;
        const sourceChannel = reporterIsSurveyor ? client_1.SourceChannel.SURVEYOR_APP : client_1.SourceChannel.USER_APP;
        const sourceSurveyorId = reporterIsSurveyor ? surveyor.id : undefined;
        const sourceNgoId = reporterIsSurveyor ? ngo.id : undefined;
        let reportStatus = client_1.MasterReportStatus.SUBMITTED;
        let taskStatus;
        let escalationReason;
        if (index < 12) {
            reportStatus = client_1.MasterReportStatus.VERIFIED_CLOSED;
            taskStatus = client_1.NgoTaskStatus.VERIFIED_CLOSED;
        }
        else if (index < 18) {
            reportStatus = client_1.MasterReportStatus.COMPLETED_PENDING_VERIFICATION;
            taskStatus = client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION;
        }
        else if (index < 28) {
            reportStatus = client_1.MasterReportStatus.IN_PROGRESS;
            taskStatus = client_1.NgoTaskStatus.IN_PROGRESS;
        }
        else if (index < 38) {
            reportStatus = client_1.MasterReportStatus.VOLUNTEER_ASSIGNED;
            taskStatus = client_1.NgoTaskStatus.ASSIGNED;
        }
        else if (index < 44) {
            reportStatus = client_1.MasterReportStatus.ACCEPTED_BY_NGO;
            taskStatus = client_1.NgoTaskStatus.ACCEPTED;
        }
        else if (index < 50) {
            reportStatus = client_1.MasterReportStatus.CLASSIFIED;
        }
        else if (index < 55) {
            reportStatus = client_1.MasterReportStatus.ESCALATED;
            taskStatus = client_1.NgoTaskStatus.ESCALATED;
            escalationReason = "Seeded escalation for demo review.";
        }
        else if (index < 60) {
            reportStatus = client_1.MasterReportStatus.REJECTED_BY_NGO;
            taskStatus = client_1.NgoTaskStatus.REJECTED;
        }
        else if (index < 64) {
            reportStatus = client_1.MasterReportStatus.REASSIGNMENT_PENDING;
            taskStatus = client_1.NgoTaskStatus.REASSIGNMENT_NEEDED;
        }
        else if (index < 70) {
            reportStatus = client_1.MasterReportStatus.UNDER_REVIEW;
        }
        const priorityScore = reportStatus === client_1.MasterReportStatus.VERIFIED_CLOSED || reportStatus === client_1.MasterReportStatus.IN_PROGRESS
            ? 84
            : reportStatus === client_1.MasterReportStatus.ESCALATED
                ? 90
                : 58;
        const priorityLabel = priorityScore >= 85
            ? client_1.PriorityLabel.CRITICAL
            : priorityScore >= 70
                ? client_1.PriorityLabel.HIGH
                : priorityScore >= 45
                    ? client_1.PriorityLabel.MEDIUM
                    : client_1.PriorityLabel.LOW;
        const report = await prisma.masterReport.create({
            data: {
                title: `${title} ${index + 1}`,
                description,
                reporterUserId,
                reporterRole,
                sourceChannel,
                sourceNgoId,
                sourceSurveyorId,
                originalCategoryId: category.id,
                aiPredictedCategoryId: category.id,
                aiConfidence: 82,
                aiReasoning: `Seeded AI classification for ${category.name}.`,
                priorityScore,
                priorityLabel,
                latitude,
                longitude,
                address: `${ngo.name} coverage zone, case point ${index + 1}`,
                mediaUrl: `/uploads/demo-report-${index + 1}.jpg`,
                mediaType: "image/jpeg",
                routedNgoId: taskStatus ? ngo.id : undefined,
                status: reportStatus,
            },
        });
        await prisma.aiDecision.createMany({
            data: [
                {
                    reportId: report.id,
                    decisionType: client_1.AiDecisionType.DOMAIN_CLASSIFICATION,
                    inputPayloadJson: { title, description },
                    outputPayloadJson: { predictedSlug: category.slug, confidence: 82 },
                    confidenceScore: 82,
                },
                {
                    reportId: report.id,
                    decisionType: client_1.AiDecisionType.PRIORITY_SCORING,
                    inputPayloadJson: { title, description },
                    outputPayloadJson: { priorityScore, priorityLabel },
                    confidenceScore: priorityScore,
                },
            ],
        });
        let taskId;
        if (taskStatus) {
            const task = await prisma.ngoTask.create({
                data: {
                    ngoId: ngo.id,
                    sourceType: client_1.SourceType.MASTER_REPORT,
                    reportedByUserId: report.reporterUserId,
                    title: report.title,
                    description: report.description,
                    categoryId: category.id,
                    priorityLabel,
                    priorityScore,
                    latitude,
                    longitude,
                    address: report.address,
                    status: taskStatus,
                    assignedVolunteerId: volunteer?.id,
                    assignedByUserId: ngo.createdByUserId,
                    ngoDecision: taskStatus === client_1.NgoTaskStatus.REJECTED ? client_1.NgoDecision.REJECTED : client_1.NgoDecision.ACCEPTED,
                    acceptedAt: new Date(),
                    rejectionReason: taskStatus === client_1.NgoTaskStatus.REJECTED ? "Outside effective field capacity for the time slot." : undefined,
                },
            });
            taskId = task.id;
            await prisma.masterReport.update({
                where: { id: report.id },
                data: {
                    linkedNgoTaskId: task.id,
                },
            });
            if (volunteer) {
                await prisma.volunteerAssignment.create({
                    data: {
                        taskId: task.id,
                        volunteerId: volunteer.id,
                        assignmentStatus: taskStatus === client_1.NgoTaskStatus.VERIFIED_CLOSED
                            ? client_1.AssignmentStatus.VERIFIED_CLOSED
                            : taskStatus === client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION
                                ? client_1.AssignmentStatus.COMPLETED_PENDING_VERIFICATION
                                : taskStatus === client_1.NgoTaskStatus.IN_PROGRESS
                                    ? client_1.AssignmentStatus.IN_PROGRESS
                                    : taskStatus === client_1.NgoTaskStatus.REASSIGNMENT_NEEDED || taskStatus === client_1.NgoTaskStatus.REJECTED
                                        ? client_1.AssignmentStatus.REASSIGNED
                                        : client_1.AssignmentStatus.ACCEPTED,
                        aiMatchScore: 78 + (index % 12),
                        assignedByUserId: ngo.createdByUserId,
                        respondedAt: new Date(),
                    },
                });
            }
            if (taskStatus === client_1.NgoTaskStatus.COMPLETED_PENDING_VERIFICATION ||
                taskStatus === client_1.NgoTaskStatus.VERIFIED_CLOSED ||
                taskStatus === client_1.NgoTaskStatus.ESCALATED) {
                await prisma.taskEvidence.create({
                    data: {
                        taskId: task.id,
                        volunteerId: volunteer?.id ?? volunteersByNgo.get(ngo.id)[0].id,
                        mediaUrl: `/uploads/demo-evidence-${index + 1}.jpg`,
                        mediaType: "image/jpeg",
                        note: "Seeded completion evidence.",
                        verificationStatus: taskStatus === client_1.NgoTaskStatus.VERIFIED_CLOSED
                            ? client_1.EvidenceVerificationStatus.VERIFIED
                            : client_1.EvidenceVerificationStatus.PENDING,
                        reviewedAt: taskStatus === client_1.NgoTaskStatus.VERIFIED_CLOSED ? new Date() : undefined,
                        reviewedByUserId: taskStatus === client_1.NgoTaskStatus.VERIFIED_CLOSED ? ngo.createdByUserId : undefined,
                    },
                });
            }
            await prisma.aiDecision.create({
                data: {
                    taskId: task.id,
                    decisionType: client_1.AiDecisionType.VOLUNTEER_MATCH,
                    inputPayloadJson: { taskTitle: task.title },
                    outputPayloadJson: {
                        volunteerId: volunteer?.id,
                        ngoId: ngo.id,
                        score: 78 + (index % 12),
                    },
                    confidenceScore: 78 + (index % 12),
                },
            });
        }
        if (escalationReason) {
            await prisma.escalation.create({
                data: {
                    reportId: report.id,
                    taskId,
                    raisedByUserId: superAdmin.id,
                    reason: escalationReason,
                    status: client_1.EscalationStatus.OPEN,
                },
            });
        }
        await createHistories({
            reportId: report.id,
            reportStatus,
            taskId,
            taskStatus,
            reporterUserId,
            ngoAdminUserId: ngo.createdByUserId,
            volunteerUserId: volunteer?.userId,
        });
        createdReports.push(report.id);
    }
    const duplicateCategory = categoriesBySlug.get("disaster-relief");
    const duplicateNgo = findNgoForCategory("disaster-relief");
    const duplicateVolunteer = volunteersByNgo.get(duplicateNgo.id)[0];
    const duplicateSurveyor = surveyorsByNgo.get(duplicateNgo.id)[0];
    const canonicalReport = await prisma.masterReport.create({
        data: {
            title: "Garbage fire spreading near homes",
            description: "Residents report smoke, flames and children nearby. Immediate disaster support is needed.",
            reporterUserId: citizens[0].id,
            reporterRole: client_1.ReporterRole.USER,
            sourceChannel: client_1.SourceChannel.USER_APP,
            originalCategoryId: duplicateCategory.id,
            aiPredictedCategoryId: duplicateCategory.id,
            aiConfidence: 91,
            aiReasoning: "Seeded duplicate scenario canonical report.",
            priorityScore: 92,
            priorityLabel: client_1.PriorityLabel.CRITICAL,
            latitude: duplicateNgo.latitude + 0.012,
            longitude: duplicateNgo.longitude + 0.008,
            address: "Demo duplicate cluster lane, NCR",
            mediaUrl: "/uploads/demo-duplicate-canonical.jpg",
            mediaType: "image/jpeg",
            routedNgoId: duplicateNgo.id,
            status: client_1.MasterReportStatus.IN_PROGRESS,
        },
    });
    const duplicateTask = await prisma.ngoTask.create({
        data: {
            ngoId: duplicateNgo.id,
            sourceType: client_1.SourceType.MASTER_REPORT,
            reportedByUserId: canonicalReport.reporterUserId,
            title: canonicalReport.title,
            description: canonicalReport.description,
            categoryId: duplicateCategory.id,
            priorityLabel: client_1.PriorityLabel.CRITICAL,
            priorityScore: 92,
            latitude: canonicalReport.latitude,
            longitude: canonicalReport.longitude,
            address: canonicalReport.address,
            status: client_1.NgoTaskStatus.IN_PROGRESS,
            assignedVolunteerId: duplicateVolunteer.id,
            assignedByUserId: duplicateNgo.createdByUserId,
            ngoDecision: client_1.NgoDecision.ACCEPTED,
            acceptedAt: new Date(),
        },
    });
    await prisma.masterReport.update({
        where: { id: canonicalReport.id },
        data: { linkedNgoTaskId: duplicateTask.id },
    });
    await prisma.volunteerAssignment.create({
        data: {
            taskId: duplicateTask.id,
            volunteerId: duplicateVolunteer.id,
            assignmentStatus: client_1.AssignmentStatus.IN_PROGRESS,
            aiMatchScore: 93,
            assignedByUserId: duplicateNgo.createdByUserId,
            respondedAt: new Date(),
        },
    });
    const duplicateGroup = await prisma.duplicateGroup.create({
        data: {
            canonicalReportId: canonicalReport.id,
        },
    });
    const mergedDuplicateA = await prisma.masterReport.create({
        data: {
            title: "Smoke and fire from garbage pile",
            description: "Another nearby caller reports the same garbage fire and heavy smoke.",
            reporterUserId: citizens[1].id,
            reporterRole: client_1.ReporterRole.USER,
            sourceChannel: client_1.SourceChannel.USER_APP,
            originalCategoryId: duplicateCategory.id,
            aiPredictedCategoryId: duplicateCategory.id,
            aiConfidence: 88,
            aiReasoning: "Seeded duplicate scenario member.",
            priorityScore: 89,
            priorityLabel: client_1.PriorityLabel.CRITICAL,
            latitude: canonicalReport.latitude + 0.002,
            longitude: canonicalReport.longitude + 0.001,
            address: canonicalReport.address,
            duplicateGroupId: duplicateGroup.id,
            status: client_1.MasterReportStatus.DUPLICATE_MERGED,
        },
    });
    const mergedDuplicateB = await prisma.masterReport.create({
        data: {
            title: "Surveyor reports garbage fire near houses",
            description: "Field surveyor confirms the same fire event in the same lane and alerts central routing.",
            reporterUserId: duplicateSurveyor.userId,
            reporterRole: client_1.ReporterRole.SURVEYOR,
            sourceChannel: client_1.SourceChannel.SURVEYOR_APP,
            sourceSurveyorId: duplicateSurveyor.id,
            sourceNgoId: duplicateNgo.id,
            originalCategoryId: duplicateCategory.id,
            aiPredictedCategoryId: duplicateCategory.id,
            aiConfidence: 90,
            aiReasoning: "Seeded duplicate scenario member from surveyor.",
            priorityScore: 91,
            priorityLabel: client_1.PriorityLabel.CRITICAL,
            latitude: canonicalReport.latitude + 0.001,
            longitude: canonicalReport.longitude + 0.002,
            address: canonicalReport.address,
            duplicateGroupId: duplicateGroup.id,
            status: client_1.MasterReportStatus.DUPLICATE_MERGED,
        },
    });
    await createHistories({
        reportId: canonicalReport.id,
        reportStatus: client_1.MasterReportStatus.IN_PROGRESS,
        taskId: duplicateTask.id,
        taskStatus: client_1.NgoTaskStatus.IN_PROGRESS,
        reporterUserId: canonicalReport.reporterUserId,
        ngoAdminUserId: duplicateNgo.createdByUserId,
        volunteerUserId: duplicateVolunteer.userId,
    });
    await createHistories({
        reportId: mergedDuplicateA.id,
        reportStatus: client_1.MasterReportStatus.DUPLICATE_MERGED,
        reporterUserId: mergedDuplicateA.reporterUserId,
        ngoAdminUserId: duplicateNgo.createdByUserId,
    });
    await createHistories({
        reportId: mergedDuplicateB.id,
        reportStatus: client_1.MasterReportStatus.DUPLICATE_MERGED,
        reporterUserId: mergedDuplicateB.reporterUserId,
        ngoAdminUserId: duplicateNgo.createdByUserId,
    });
    const notificationRecipients = [
        superAdmin,
        ...(await prisma.user.findMany({ where: { role: client_1.Role.NGO_ADMIN }, take: 5 })),
        ...(await prisma.user.findMany({ where: { role: client_1.Role.USER }, take: 5 })),
    ];
    for (let index = 0; index < notificationRecipients.length; index += 1) {
        const recipient = notificationRecipients[index];
        await prisma.notification.create({
            data: {
                recipientUserId: recipient.id,
                role: recipient.role,
                title: index % 2 === 0 ? "New routed issue" : "Verification update",
                body: index % 2 === 0
                    ? "A new issue has entered your active workflow queue."
                    : "A task update is waiting for review in your dashboard.",
                type: index % 2 === 0 ? client_1.NotificationType.REPORT_ROUTED : client_1.NotificationType.TASK_STATUS,
            },
        });
    }
    // eslint-disable-next-line no-console
    console.log("Seed complete.");
    // eslint-disable-next-line no-console
    console.log(`Super Admin: admin@reliefgrid.org / ${basePassword}`);
    // eslint-disable-next-line no-console
    console.log("Additional demo accounts: surveyor1@reliefgrid.demo, volunteer1@reliefgrid.demo, citizen1@reliefgrid.demo");
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
