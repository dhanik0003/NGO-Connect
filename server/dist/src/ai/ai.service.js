"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const env_1 = require("../config/env");
const constants_1 = require("../config/constants");
const heuristics_1 = require("./heuristics");
const prompt_templates_1 = require("./prompt-templates");
const domainSlugSchema = zod_1.z.enum(constants_1.CATEGORY_SEEDS.map((category) => category.slug));
const priorityLabelSchema = zod_1.z.nativeEnum(client_1.PriorityLabel);
const geminiDomainSchema = zod_1.z.object({
    predictedSlug: domainSlugSchema,
    confidence: zod_1.z.coerce.number().min(0).max(100),
    reasoning: zod_1.z.string().trim().min(1).max(500),
});
const geminiPrioritySchema = zod_1.z.object({
    score: zod_1.z.coerce.number().min(0).max(100),
    label: zod_1.z.union([priorityLabelSchema, zod_1.z.string().trim().min(1)]),
    reasoning: zod_1.z.string().trim().min(1).max(500),
});
const geminiNgoRankingSchema = zod_1.z.object({
    rankings: zod_1.z.array(zod_1.z.object({
        ngoId: zod_1.z.string().min(1),
        score: zod_1.z.coerce.number().min(0).max(100),
        reasoning: zod_1.z.string().trim().min(1).max(500),
    })),
});
const geminiVolunteerRankingSchema = zod_1.z.object({
    rankings: zod_1.z.array(zod_1.z.object({
        volunteerId: zod_1.z.string().min(1),
        score: zod_1.z.coerce.number().min(0).max(100),
        reasoning: zod_1.z.string().trim().min(1).max(500),
    })),
});
const geminiDuplicateSchema = zod_1.z.object({
    isDuplicate: zod_1.z.coerce.boolean(),
    matchedReportId: zod_1.z.string().nullable().optional(),
    confidence: zod_1.z.coerce.number().min(0).max(100),
    reasoning: zod_1.z.string().trim().min(1).max(500),
});
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const normalizePriorityLabel = (value) => {
    const normalized = String(value).trim().toUpperCase();
    if (normalized === client_1.PriorityLabel.CRITICAL) {
        return client_1.PriorityLabel.CRITICAL;
    }
    if (normalized === client_1.PriorityLabel.HIGH) {
        return client_1.PriorityLabel.HIGH;
    }
    if (normalized === client_1.PriorityLabel.MEDIUM) {
        return client_1.PriorityLabel.MEDIUM;
    }
    return client_1.PriorityLabel.LOW;
};
const derivePriorityLabel = (score) => {
    if (score >= 85) {
        return client_1.PriorityLabel.CRITICAL;
    }
    if (score >= 70) {
        return client_1.PriorityLabel.HIGH;
    }
    if (score >= 45) {
        return client_1.PriorityLabel.MEDIUM;
    }
    return client_1.PriorityLabel.LOW;
};
const isGeminiConfigured = () => Boolean(env_1.env.GEMINI_API_KEY);
const warnGeminiFailure = (reason) => {
    if (env_1.env.NODE_ENV === "test") {
        return;
    }
    const message = reason instanceof Error ? reason.message : String(reason);
    // eslint-disable-next-line no-console
    console.warn(`[ai] Gemini fallback activated: ${message}`);
};
const extractJsonText = (payload) => {
    if (!payload || typeof payload !== "object") {
        throw new Error("Gemini returned an empty response.");
    }
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) {
        throw new Error("Gemini did not return any text content.");
    }
    return text;
};
const parseStructuredJson = (text, schema) => {
    try {
        return schema.parse(JSON.parse(text));
    }
    catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return schema.parse(JSON.parse(text.slice(start, end + 1)));
        }
        throw new Error("Unable to parse Gemini JSON output.");
    }
};
const callGeminiJson = async (systemInstruction, payload, schema) => {
    if (!env_1.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured.");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env_1.env.AI_REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(`${env_1.env.GEMINI_API_BASE_URL}/models/${env_1.env.GEMINI_MODEL}:generateContent`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env_1.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemInstruction }],
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: JSON.stringify(payload, null, 2) }],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json",
                },
            }),
            signal: controller.signal,
        });
        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            throw new Error(`Gemini request failed with ${response.status}: ${errorText || response.statusText}`);
        }
        const json = (await response.json());
        return parseStructuredJson(extractJsonText(json), schema);
    }
    finally {
        clearTimeout(timeout);
    }
};
const withProvider = (value, provider, fallbackUsed = false) => ({
    ...value,
    provider,
    ...(fallbackUsed ? { fallbackUsed } : {}),
});
exports.aiService = {
    getStatus() {
        return {
            provider: isGeminiConfigured() ? "gemini" : "heuristic",
            fallbackProvider: "heuristic",
            configured: isGeminiConfigured(),
            model: env_1.env.GEMINI_MODEL,
        };
    },
    async classifyDomain(input) {
        const fallback = (0, heuristics_1.classifyDomain)(input);
        if (!isGeminiConfigured()) {
            return withProvider(fallback, "heuristic");
        }
        try {
            const response = await callGeminiJson(prompt_templates_1.promptTemplates.domainClassification, {
                title: input.title,
                description: input.description,
                selectedCategorySlug: input.selectedCategorySlug ?? null,
                allowedDomains: constants_1.CATEGORY_SEEDS.map((category) => ({
                    slug: category.slug,
                    name: category.name,
                    description: category.description,
                })),
            }, geminiDomainSchema);
            if (response.confidence < 60) {
                return withProvider(fallback, "heuristic", true);
            }
            const predictedCategory = constants_1.CATEGORY_SEEDS.find((category) => category.slug === response.predictedSlug) ?? constants_1.CATEGORY_SEEDS[0];
            return {
                predictedSlug: predictedCategory.slug,
                predictedName: predictedCategory.name,
                confidence: Math.round(response.confidence),
                reasoning: response.reasoning,
                ranked: [
                    { slug: predictedCategory.slug, name: predictedCategory.name, score: Math.round(response.confidence) },
                    ...fallback.ranked.filter((entry) => entry.slug !== predictedCategory.slug),
                ],
                provider: "gemini",
            };
        }
        catch (error) {
            warnGeminiFailure(error);
            return withProvider(fallback, "heuristic", true);
        }
    },
    async scorePriority(input) {
        const fallback = (0, heuristics_1.scorePriority)(input);
        if (!isGeminiConfigured()) {
            return withProvider(fallback, "heuristic");
        }
        try {
            const response = await callGeminiJson(prompt_templates_1.promptTemplates.urgencyScoring, {
                title: input.title,
                description: input.description,
                labels: Object.values(client_1.PriorityLabel),
            }, geminiPrioritySchema);
            const score = clamp(Math.round(response.score), 0, 100);
            const label = normalizePriorityLabel(response.label);
            return {
                score,
                label: label || derivePriorityLabel(score),
                reasoning: response.reasoning,
                provider: "gemini",
            };
        }
        catch (error) {
            warnGeminiFailure(error);
            return withProvider(fallback, "heuristic", true);
        }
    },
    async matchNgo(report, candidates) {
        const fallback = (0, heuristics_1.scoreNgoCandidates)(report, candidates).map((entry) => withProvider(entry, "heuristic"));
        if (!isGeminiConfigured() || fallback.length === 0) {
            return fallback;
        }
        const topCandidates = fallback
            .slice(0, Math.min(8, fallback.length))
            .map((entry) => {
            const candidate = candidates.find((item) => item.id === entry.ngoId);
            return {
                ngoId: entry.ngoId,
                name: entry.name,
                heuristicScore: entry.score,
                distanceKm: Number(entry.distanceKm.toFixed(2)),
                supportedCategorySlugs: candidate?.supportedCategorySlugs ?? [],
                serviceRadiusKm: candidate?.serviceRadiusKm ?? 0,
                verificationStatus: candidate?.verificationStatus ?? "UNKNOWN",
                regionCoverageCount: candidate?.regions.length ?? 0,
                pendingTaskCount: candidate?.pendingTaskCount ?? 0,
                availableVolunteerCount: candidate?.availableVolunteerCount ?? 0,
            };
        });
        try {
            const response = await callGeminiJson(prompt_templates_1.promptTemplates.ngoMatching, {
                report,
                candidates: topCandidates,
            }, geminiNgoRankingSchema);
            const rankedIds = new Set(topCandidates.map((candidate) => candidate.ngoId));
            const aiRankings = response.rankings.filter((entry) => rankedIds.has(entry.ngoId));
            const aiMap = new Map(aiRankings.map((entry) => [entry.ngoId, entry]));
            return fallback
                .map((entry) => {
                const aiEntry = aiMap.get(entry.ngoId);
                if (!aiEntry) {
                    return withProvider(entry, "heuristic", true);
                }
                return {
                    ...entry,
                    score: clamp(Math.round(aiEntry.score), 0, 100),
                    reasoning: aiEntry.reasoning,
                    provider: "gemini",
                };
            })
                .sort((left, right) => right.score - left.score);
        }
        catch (error) {
            warnGeminiFailure(error);
            return fallback.map((entry) => ({ ...entry, fallbackUsed: true }));
        }
    },
    async matchVolunteer(task, candidates) {
        const fallback = (0, heuristics_1.scoreVolunteerCandidates)(task, candidates).map((entry) => withProvider(entry, "heuristic"));
        if (!isGeminiConfigured() || fallback.length === 0) {
            return fallback;
        }
        const topCandidates = fallback
            .slice(0, Math.min(10, fallback.length))
            .map((entry) => {
            const candidate = candidates.find((item) => item.id === entry.volunteerId);
            return {
                volunteerId: entry.volunteerId,
                name: entry.name,
                heuristicScore: entry.score,
                distanceKm: Number(entry.distanceKm.toFixed(2)),
                serviceRadiusKm: candidate?.serviceRadiusKm ?? 0,
                availabilityStatus: candidate?.availabilityStatus ?? "UNKNOWN",
                currentWorkload: candidate?.currentWorkload ?? 0,
                acceptanceRate: candidate?.acceptanceRate ?? 0,
                rating: candidate?.rating ?? 0,
                vehicleType: candidate?.vehicleType ?? null,
                skills: candidate?.skills ?? [],
            };
        });
        try {
            const response = await callGeminiJson(prompt_templates_1.promptTemplates.volunteerMatching, {
                task,
                candidates: topCandidates,
            }, geminiVolunteerRankingSchema);
            const rankedIds = new Set(topCandidates.map((candidate) => candidate.volunteerId));
            const aiRankings = response.rankings.filter((entry) => rankedIds.has(entry.volunteerId));
            const aiMap = new Map(aiRankings.map((entry) => [entry.volunteerId, entry]));
            return fallback
                .map((entry) => {
                const aiEntry = aiMap.get(entry.volunteerId);
                if (!aiEntry) {
                    return withProvider(entry, "heuristic", true);
                }
                return {
                    ...entry,
                    score: clamp(Math.round(aiEntry.score), 0, 100),
                    reasoning: aiEntry.reasoning,
                    provider: "gemini",
                };
            })
                .sort((left, right) => right.score - left.score);
        }
        catch (error) {
            warnGeminiFailure(error);
            return fallback.map((entry) => ({ ...entry, fallbackUsed: true }));
        }
    },
    async detectDuplicate(subject, candidates, settings) {
        const fallback = (0, heuristics_1.detectDuplicate)(subject, candidates, settings);
        if (!isGeminiConfigured() || candidates.length === 0) {
            return withProvider(fallback, "heuristic");
        }
        const suggestedCandidates = fallback.ranked
            .slice(0, Math.min(5, fallback.ranked.length))
            .map((entry) => {
            const candidate = candidates.find((item) => item.id === entry.candidateId);
            return {
                reportId: entry.candidateId,
                distanceKm: Number(entry.distanceKm.toFixed(2)),
                heuristicSimilarityScore: Number(entry.similarityScore.toFixed(2)),
                title: candidate?.title ?? "",
                description: candidate?.description ?? "",
                categorySlug: candidate?.categorySlug ?? null,
                createdAt: candidate?.createdAt?.toISOString() ?? null,
            };
        });
        try {
            const response = await callGeminiJson(prompt_templates_1.promptTemplates.duplicateDetection, {
                subject: {
                    title: subject.title,
                    description: subject.description,
                    latitude: subject.latitude,
                    longitude: subject.longitude,
                    categorySlug: subject.categorySlug ?? null,
                    createdAt: subject.createdAt.toISOString(),
                },
                candidates: suggestedCandidates,
                settings,
            }, geminiDuplicateSchema);
            const validMatchedReportId = response.matchedReportId && candidates.some((candidate) => candidate.id === response.matchedReportId)
                ? response.matchedReportId
                : fallback.matchedReportId;
            const finalIsDuplicate = fallback.isDuplicate || response.isDuplicate;
            const matchedReportId = finalIsDuplicate
                ? validMatchedReportId ?? fallback.ranked[0]?.candidateId ?? null
                : null;
            return {
                isDuplicate: finalIsDuplicate,
                matchedReportId,
                confidence: clamp(Math.round(Math.max(response.confidence, fallback.confidence)), 0, 100),
                reasoning: `${response.reasoning}${fallback.isDuplicate ? ` | Heuristic check: ${fallback.reasoning}` : ""}`,
                ranked: fallback.ranked,
                provider: "gemini",
            };
        }
        catch (error) {
            warnGeminiFailure(error);
            return withProvider(fallback, "heuristic", true);
        }
    },
};
