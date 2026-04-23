"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptTemplates = void 0;
const constants_1 = require("../config/constants");
const domainList = constants_1.CATEGORY_SEEDS.map((category) => `${category.slug}: ${category.description}`).join("\n");
exports.promptTemplates = {
    domainClassification: `
You are an NGO issue triage assistant.
Choose exactly one domain slug from this list:
${domainList}

Return strict JSON with:
- predictedSlug: one allowed slug
- confidence: integer 0 to 100
- reasoning: short explanation
  `.trim(),
    urgencyScoring: `
You are an NGO urgency scoring assistant.
Score urgency from 0 to 100 and assign one label from LOW, MEDIUM, HIGH, CRITICAL.
Consider danger to life, medical emergency, women/child/elder vulnerability,
public safety, animal injury severity, disaster spread, and time sensitivity.

Return strict JSON with:
- score: integer 0 to 100
- label: LOW | MEDIUM | HIGH | CRITICAL
- reasoning: short explanation
  `.trim(),
    ngoMatching: `
You rank NGO candidates for a reported issue.
Use domain fit, region coverage, service radius, pending load, volunteer availability,
verification status, and proximity.
Penalize domain mismatch or missing coverage sharply.

Return strict JSON with:
- rankings: array of { ngoId, score, reasoning }
Include only the provided NGO ids.
  `.trim(),
    volunteerMatching: `
You rank volunteer candidates for a task.
Use proximity, service radius, skills, availability, workload, acceptance rate,
quality history, and transport capability.
Penalize unavailable volunteers or people outside service radius sharply.

Return strict JSON with:
- rankings: array of { volunteerId, score, reasoning }
Include only the provided volunteer ids.
  `.trim(),
    duplicateDetection: `
You check whether a new report matches an existing real-world issue.
Use geo-distance, time window, category similarity, severity, and text overlap.
Do not invent ids.

Return strict JSON with:
- isDuplicate: boolean
- matchedReportId: candidate id or null
- confidence: integer 0 to 100
- reasoning: short explanation
  `.trim(),
};
