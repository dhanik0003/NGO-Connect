"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreVolunteerCandidates = exports.scoreNgoCandidates = exports.detectDuplicate = exports.scorePriority = exports.classifyDomain = void 0;
const client_1 = require("@prisma/client");
const constants_1 = require("../config/constants");
const distance_1 = require("../utils/distance");
const keywordMap = {
    "animal-care": ["dog", "cow", "animal", "puppy", "injured animal", "rescue", "shelter", "stray"],
    healthcare: ["medical", "injury", "hospital", "bleeding", "medicine", "ambulance", "fever", "clinic"],
    education: ["school", "teacher", "student", "books", "classroom", "tuition", "uniform", "exam"],
    "elder-care": ["elder", "senior", "old age", "abandoned elder", "wheelchair", "geriatric", "grandparent"],
    "women-safety": ["woman", "girl", "harassment", "abuse", "unsafe", "trafficking", "domestic violence", "assault"],
    environment: ["tree", "pollution", "lake", "air quality", "forest", "plastic", "clean up", "green cover"],
    "food-support": ["food", "meal", "ration", "hunger", "malnutrition", "kitchen", "feeding", "nutrition"],
    "disaster-relief": ["flood", "fire", "earthquake", "landslide", "storm", "cyclone", "collapse", "evacuation"],
    sanitation: ["garbage", "sewage", "drain", "water contamination", "toilet", "waste", "sanitation", "hygiene"],
    "child-welfare": ["child", "kid", "minor", "orphan", "child labor", "missing child", "school-age", "abuse"],
};
const tokenize = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
const jaccardSimilarity = (source, target) => {
    const a = new Set(tokenize(source));
    const b = new Set(tokenize(target));
    const intersection = [...a].filter((token) => b.has(token)).length;
    const union = new Set([...a, ...b]).size;
    return union === 0 ? 0 : intersection / union;
};
const classifyDomain = ({ title, description, selectedCategorySlug }) => {
    const text = `${title} ${description}`.toLowerCase();
    const scores = constants_1.CATEGORY_SEEDS.map((category) => {
        const keywordHits = keywordMap[category.slug]?.reduce((total, keyword) => {
            return total + (text.includes(keyword) ? 1 : 0);
        }, 0) ?? 0;
        const selectedBoost = selectedCategorySlug === category.slug ? 2 : 0;
        const score = keywordHits * 18 + selectedBoost * 10;
        return {
            slug: category.slug,
            name: category.name,
            score,
        };
    }).sort((left, right) => right.score - left.score);
    const top = scores[0];
    const confidence = Math.max(35, Math.min(96, top.score + (selectedCategorySlug === top.slug ? 18 : 0)));
    const fallback = constants_1.CATEGORY_SEEDS.find((item) => item.slug === selectedCategorySlug) ?? constants_1.CATEGORY_SEEDS[0];
    const isSelectedCategoryFallback = Boolean(selectedCategorySlug) && (!top || top.score <= 0);
    return {
        predictedSlug: top?.score > 0 ? top.slug : fallback.slug,
        predictedName: top?.score > 0 ? top.name : fallback.name,
        confidence: top?.score > 0 ? confidence : isSelectedCategoryFallback ? 82 : 42,
        reasoning: top?.score > 0
            ? `Matched domain signals around ${top.name.toLowerCase()} from report language.`
            : isSelectedCategoryFallback
                ? "Low signal text, so the reporter-selected category was used as a routing fallback."
                : "Low signal text, so the selected category was used as a fallback.",
        ranked: scores,
    };
};
exports.classifyDomain = classifyDomain;
const scorePriority = ({ title, description }) => {
    const text = `${title} ${description}`.toLowerCase();
    let score = 15;
    const reasons = [];
    const rules = [
        { pattern: /\b(flood|fire|collapse|landslide|earthquake|explosion|storm)\b/, points: 28, reason: "active disaster risk" },
        { pattern: /\b(bleeding|unconscious|critical|severe|urgent|emergency|life threatening)\b/, points: 26, reason: "immediate life or injury risk" },
        { pattern: /\b(woman|girl|pregnant|domestic violence|harassment|abuse)\b/, points: 18, reason: "women safety vulnerability" },
        { pattern: /\b(child|children|minor|baby|infant)\b/, points: 18, reason: "child vulnerability" },
        { pattern: /\b(elder|senior|old age|abandoned)\b/, points: 14, reason: "elder vulnerability" },
        { pattern: /\b(disease|infection|outbreak|contamination|sewage)\b/, points: 16, reason: "public health escalation risk" },
        { pattern: /\b(stranded|trapped|missing|unsafe)\b/, points: 15, reason: "high time sensitivity" },
        { pattern: /\b(injured dog|injured cow|animal injury|fracture|rescue)\b/, points: 12, reason: "serious animal welfare issue" },
    ];
    rules.forEach((rule) => {
        if (rule.pattern.test(text)) {
            score += rule.points;
            reasons.push(rule.reason);
        }
    });
    const affectedCount = text.match(/\b([2-9][0-9]?|[1-9][0-9]{2,})\+?\b/);
    if (affectedCount) {
        score += 10;
        reasons.push("multiple affected people or animals");
    }
    score = Math.min(score, 100);
    let label = client_1.PriorityLabel.LOW;
    if (score >= 85) {
        label = client_1.PriorityLabel.CRITICAL;
    }
    else if (score >= 70) {
        label = client_1.PriorityLabel.HIGH;
    }
    else if (score >= 45) {
        label = client_1.PriorityLabel.MEDIUM;
    }
    return {
        score,
        label,
        reasoning: reasons.length > 0 ? reasons.join(", ") : "No extreme-risk signals detected.",
    };
};
exports.scorePriority = scorePriority;
const detectDuplicate = (subject, candidates, settings) => {
    const lookbackCutoff = Date.now() - settings.lookbackHours * 60 * 60 * 1000;
    const ranked = candidates
        .filter((candidate) => candidate.createdAt.getTime() >= lookbackCutoff)
        .map((candidate) => {
        const distanceKm = (0, distance_1.haversineDistanceKm)(subject, candidate);
        const textSimilarity = jaccardSimilarity(`${subject.title} ${subject.description}`, `${candidate.title} ${candidate.description}`);
        const categoryScore = subject.categorySlug && candidate.categorySlug && subject.categorySlug === candidate.categorySlug ? 0.2 : 0;
        const geoScore = Math.max(0, 1 - distanceKm / settings.radiusKm);
        const similarityScore = geoScore * 0.5 + textSimilarity * 0.3 + categoryScore;
        return {
            candidateId: candidate.id,
            distanceKm,
            textSimilarity,
            similarityScore,
        };
    })
        .sort((left, right) => right.similarityScore - left.similarityScore);
    const top = ranked[0];
    return {
        isDuplicate: Boolean(top && top.distanceKm <= settings.radiusKm && top.similarityScore >= 0.62),
        matchedReportId: top?.candidateId ?? null,
        confidence: top ? Math.round(top.similarityScore * 100) : 0,
        reasoning: top
            ? `Nearest similar report is ${top.distanceKm.toFixed(2)} km away with ${Math.round(top.textSimilarity * 100)}% text overlap.`
            : "No comparable open reports found in the configured time window.",
        ranked,
    };
};
exports.detectDuplicate = detectDuplicate;
const scoreNgoCandidates = (report, candidates) => candidates
    .map((candidate) => {
    const domainMatch = report.categorySlug && candidate.supportedCategorySlugs.includes(report.categorySlug) ? 40 : 0;
    const distanceKm = (0, distance_1.haversineDistanceKm)(report, candidate);
    const regionCoverage = candidate.regions.some((region) => (0, distance_1.haversineDistanceKm)(report, region) <= Math.max(region.coverageRadiusKm, candidate.serviceRadiusKm))
        ? 24
        : distanceKm <= candidate.serviceRadiusKm
            ? 12
            : 0;
    const loadScore = Math.max(0, 12 - Math.min(candidate.pendingTaskCount, 24) / 2);
    const volunteerScore = Math.min(candidate.availableVolunteerCount, 5) * 3;
    const verificationScore = candidate.verificationStatus === "APPROVED" ? 9 : 0;
    const proximityScore = Math.max(0, 15 - Math.min(distanceKm, 30) * 0.5);
    const score = domainMatch + regionCoverage + loadScore + volunteerScore + verificationScore + proximityScore;
    return {
        ngoId: candidate.id,
        name: candidate.name,
        distanceKm,
        score: Math.round(score),
        reasoning: [
            domainMatch ? "domain match" : "domain mismatch",
            regionCoverage ? "service area coverage" : "outside primary coverage",
            candidate.availableVolunteerCount > 0 ? "volunteers available" : "limited volunteer availability",
        ].join(", "),
    };
})
    .sort((left, right) => right.score - left.score);
exports.scoreNgoCandidates = scoreNgoCandidates;
const scoreVolunteerCandidates = (task, candidates) => {
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    return candidates
        .map((candidate) => {
        const distanceKm = (0, distance_1.haversineDistanceKm)(task, candidate);
        const withinRadius = distanceKm <= candidate.serviceRadiusKm;
        const availabilityScore = candidate.availabilityStatus === "AVAILABLE" ? 28 : 0;
        const radiusScore = withinRadius ? Math.max(0, 24 - distanceKm * 3) : 0;
        const skillScore = candidate.skills.reduce((score, skill) => {
            return score + (taskText.includes(skill.toLowerCase()) ? 6 : 0);
        }, task.categoryName ? (candidate.skills.some((skill) => task.categoryName?.toLowerCase().includes(skill.toLowerCase())) ? 8 : 0) : 0);
        const workloadScore = Math.max(0, 14 - candidate.currentWorkload * 3);
        const qualityScore = candidate.rating * 4 + candidate.acceptanceRate * 0.08;
        const vehicleScore = candidate.vehicleType ? 4 : 0;
        const score = availabilityScore + radiusScore + skillScore + workloadScore + qualityScore + vehicleScore;
        return {
            volunteerId: candidate.id,
            name: candidate.fullName,
            distanceKm,
            score: Math.round(score),
            reasoning: [
                candidate.availabilityStatus === "AVAILABLE" ? "available now" : "not currently available",
                withinRadius ? "inside service radius" : "outside service radius",
                candidate.vehicleType ? `has ${candidate.vehicleType}` : "no transport listed",
            ].join(", "),
        };
    })
        .sort((left, right) => right.score - left.score);
};
exports.scoreVolunteerCandidates = scoreVolunteerCandidates;
