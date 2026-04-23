import { PriorityLabel } from "@prisma/client";
import { z } from "zod";
import { env } from "../config/env";
import { CATEGORY_SEEDS } from "../config/constants";
import {
  classifyDomain as heuristicClassifyDomain,
  detectDuplicate as heuristicDetectDuplicate,
  scoreNgoCandidates as heuristicScoreNgoCandidates,
  scorePriority as heuristicScorePriority,
  scoreVolunteerCandidates as heuristicScoreVolunteerCandidates,
  type ClassifyInput,
  type DuplicateCandidate,
  type NgoMatchCandidate,
  type PriorityInput,
  type VolunteerMatchCandidate,
} from "./heuristics";
import { promptTemplates } from "./prompt-templates";

type Provider = "gemini" | "heuristic";

type DomainClassificationResult = ReturnType<typeof heuristicClassifyDomain> & {
  provider: Provider;
  fallbackUsed?: boolean;
};

type PriorityScoreResult = ReturnType<typeof heuristicScorePriority> & {
  provider: Provider;
  fallbackUsed?: boolean;
};

type NgoMatchResult = ReturnType<typeof heuristicScoreNgoCandidates>[number] & {
  provider: Provider;
  fallbackUsed?: boolean;
};

type VolunteerMatchResult = ReturnType<typeof heuristicScoreVolunteerCandidates>[number] & {
  provider: Provider;
  fallbackUsed?: boolean;
};

type DuplicateResult = Omit<ReturnType<typeof heuristicDetectDuplicate>, "matchedReportId"> & {
  matchedReportId: string | null;
  provider: Provider;
  fallbackUsed?: boolean;
};

const domainSlugSchema = z.enum(CATEGORY_SEEDS.map((category) => category.slug) as [string, ...string[]]);
const priorityLabelSchema = z.nativeEnum(PriorityLabel);

const geminiDomainSchema = z.object({
  predictedSlug: domainSlugSchema,
  confidence: z.coerce.number().min(0).max(100),
  reasoning: z.string().trim().min(1).max(500),
});

const geminiPrioritySchema = z.object({
  score: z.coerce.number().min(0).max(100),
  label: z.union([priorityLabelSchema, z.string().trim().min(1)]),
  reasoning: z.string().trim().min(1).max(500),
});

const geminiNgoRankingSchema = z.object({
  rankings: z.array(
    z.object({
      ngoId: z.string().min(1),
      score: z.coerce.number().min(0).max(100),
      reasoning: z.string().trim().min(1).max(500),
    }),
  ),
});

const geminiVolunteerRankingSchema = z.object({
  rankings: z.array(
    z.object({
      volunteerId: z.string().min(1),
      score: z.coerce.number().min(0).max(100),
      reasoning: z.string().trim().min(1).max(500),
    }),
  ),
});

const geminiDuplicateSchema = z.object({
  isDuplicate: z.coerce.boolean(),
  matchedReportId: z.string().nullable().optional(),
  confidence: z.coerce.number().min(0).max(100),
  reasoning: z.string().trim().min(1).max(500),
});

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

const normalizePriorityLabel = (value: string | PriorityLabel): PriorityLabel => {
  const normalized = String(value).trim().toUpperCase();

  if (normalized === PriorityLabel.CRITICAL) {
    return PriorityLabel.CRITICAL;
  }
  if (normalized === PriorityLabel.HIGH) {
    return PriorityLabel.HIGH;
  }
  if (normalized === PriorityLabel.MEDIUM) {
    return PriorityLabel.MEDIUM;
  }

  return PriorityLabel.LOW;
};

const derivePriorityLabel = (score: number) => {
  if (score >= 85) {
    return PriorityLabel.CRITICAL;
  }
  if (score >= 70) {
    return PriorityLabel.HIGH;
  }
  if (score >= 45) {
    return PriorityLabel.MEDIUM;
  }

  return PriorityLabel.LOW;
};

const isGeminiConfigured = () => Boolean(env.GEMINI_API_KEY);

const warnGeminiFailure = (reason: unknown) => {
  if (env.NODE_ENV === "test") {
    return;
  }

  const message = reason instanceof Error ? reason.message : String(reason);
  // eslint-disable-next-line no-console
  console.warn(`[ai] Gemini fallback activated: ${message}`);
};

const extractJsonText = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Gemini returned an empty response.");
  }

  const text = (payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  }).candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    throw new Error("Gemini did not return any text content.");
  }

  return text;
};

const parseStructuredJson = <T>(text: string, schema: z.ZodSchema<T>) => {
  try {
    return schema.parse(JSON.parse(text));
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return schema.parse(JSON.parse(text.slice(start, end + 1)));
    }

    throw new Error("Unable to parse Gemini JSON output.");
  }
};

const callGeminiJson = async <T>(systemInstruction: string, payload: unknown, schema: z.ZodSchema<T>) => {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${env.GEMINI_API_BASE_URL}/models/${env.GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
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
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Gemini request failed with ${response.status}: ${errorText || response.statusText}`);
    }

    const json = (await response.json()) as unknown;
    return parseStructuredJson(extractJsonText(json), schema);
  } finally {
    clearTimeout(timeout);
  }
};

const withProvider = <T extends Record<string, unknown>>(value: T, provider: Provider, fallbackUsed = false) => ({
  ...value,
  provider,
  ...(fallbackUsed ? { fallbackUsed } : {}),
});

export const aiService = {
  getStatus() {
    return {
      provider: isGeminiConfigured() ? "gemini" : "heuristic",
      fallbackProvider: "heuristic",
      configured: isGeminiConfigured(),
      model: env.GEMINI_MODEL,
    };
  },

  async classifyDomain(input: ClassifyInput): Promise<DomainClassificationResult> {
    const fallback = heuristicClassifyDomain(input);

    if (!isGeminiConfigured()) {
      return withProvider(fallback, "heuristic");
    }

    try {
      const response = await callGeminiJson(
        promptTemplates.domainClassification,
        {
          title: input.title,
          description: input.description,
          selectedCategorySlug: input.selectedCategorySlug ?? null,
          allowedDomains: CATEGORY_SEEDS.map((category) => ({
            slug: category.slug,
            name: category.name,
            description: category.description,
          })),
        },
        geminiDomainSchema,
      );

      if (response.confidence < 60) {
        return withProvider(fallback, "heuristic", true);
      }

      const predictedCategory =
        CATEGORY_SEEDS.find((category) => category.slug === response.predictedSlug) ?? CATEGORY_SEEDS[0];

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
    } catch (error) {
      warnGeminiFailure(error);
      return withProvider(fallback, "heuristic", true);
    }
  },

  async scorePriority(input: PriorityInput): Promise<PriorityScoreResult> {
    const fallback = heuristicScorePriority(input);

    if (!isGeminiConfigured()) {
      return withProvider(fallback, "heuristic");
    }

    try {
      const response = await callGeminiJson(
        promptTemplates.urgencyScoring,
        {
          title: input.title,
          description: input.description,
          labels: Object.values(PriorityLabel),
        },
        geminiPrioritySchema,
      );

      const score = clamp(Math.round(response.score), 0, 100);
      const label = normalizePriorityLabel(response.label);

      return {
        score,
        label: label || derivePriorityLabel(score),
        reasoning: response.reasoning,
        provider: "gemini",
      };
    } catch (error) {
      warnGeminiFailure(error);
      return withProvider(fallback, "heuristic", true);
    }
  },

  async matchNgo(
    report: { latitude: number; longitude: number; categorySlug?: string | null; title?: string; description?: string },
    candidates: NgoMatchCandidate[],
  ): Promise<NgoMatchResult[]> {
    const fallback = heuristicScoreNgoCandidates(report, candidates).map((entry) =>
      withProvider(entry, "heuristic"),
    );

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
      const response = await callGeminiJson(
        promptTemplates.ngoMatching,
        {
          report,
          candidates: topCandidates,
        },
        geminiNgoRankingSchema,
      );

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
            provider: "gemini" as const,
          };
        })
        .sort((left, right) => right.score - left.score);
    } catch (error) {
      warnGeminiFailure(error);
      return fallback.map((entry) => ({ ...entry, fallbackUsed: true }));
    }
  },

  async matchVolunteer(
    task: { latitude: number; longitude: number; title: string; description: string; categoryName?: string | null },
    candidates: VolunteerMatchCandidate[],
  ): Promise<VolunteerMatchResult[]> {
    const fallback = heuristicScoreVolunteerCandidates(task, candidates).map((entry) =>
      withProvider(entry, "heuristic"),
    );

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
      const response = await callGeminiJson(
        promptTemplates.volunteerMatching,
        {
          task,
          candidates: topCandidates,
        },
        geminiVolunteerRankingSchema,
      );

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
            provider: "gemini" as const,
          };
        })
        .sort((left, right) => right.score - left.score);
    } catch (error) {
      warnGeminiFailure(error);
      return fallback.map((entry) => ({ ...entry, fallbackUsed: true }));
    }
  },

  async detectDuplicate(
    subject: DuplicateCandidate,
    candidates: DuplicateCandidate[],
    settings: { radiusKm: number; lookbackHours: number },
  ): Promise<DuplicateResult> {
    const fallback = heuristicDetectDuplicate(subject, candidates, settings);

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
      const response = await callGeminiJson(
        promptTemplates.duplicateDetection,
        {
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
        },
        geminiDuplicateSchema,
      );

      const validMatchedReportId =
        response.matchedReportId && candidates.some((candidate) => candidate.id === response.matchedReportId)
          ? response.matchedReportId
          : fallback.matchedReportId;
      const finalIsDuplicate = fallback.isDuplicate || response.isDuplicate;
      const matchedReportId: string | null = finalIsDuplicate
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
    } catch (error) {
      warnGeminiFailure(error);
      return withProvider(fallback, "heuristic", true);
    }
  },
};
