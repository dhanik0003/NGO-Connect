export const CATEGORY_SEEDS = [
  {
    name: "Animal Care",
    slug: "animal-care",
    description: "Rescue, treatment, shelter and street-animal intervention.",
    colorHex: "#159A9C",
    iconKey: "paw-print",
  },
  {
    name: "Healthcare",
    slug: "healthcare",
    description: "Urgent aid, medicine access, clinics and emergency care.",
    colorHex: "#E76F51",
    iconKey: "heart-pulse",
  },
  {
    name: "Education",
    slug: "education",
    description: "School access, supplies, tutoring and literacy support.",
    colorHex: "#355070",
    iconKey: "graduation-cap",
  },
  {
    name: "Elder Care",
    slug: "elder-care",
    description: "Senior support, welfare checks and care coordination.",
    colorHex: "#8D99AE",
    iconKey: "badge-plus",
  },
  {
    name: "Women Safety",
    slug: "women-safety",
    description: "Safety intervention, protection response and legal support.",
    colorHex: "#BC5090",
    iconKey: "shield-alert",
  },
  {
    name: "Environment",
    slug: "environment",
    description: "Cleanup, conservation, pollution and green response work.",
    colorHex: "#2A9D8F",
    iconKey: "leaf",
  },
  {
    name: "Food Support",
    slug: "food-support",
    description: "Meal distribution, rations and hunger-response programs.",
    colorHex: "#F4A261",
    iconKey: "utensils",
  },
  {
    name: "Disaster Relief",
    slug: "disaster-relief",
    description: "Flood, fire, landslide, storm and mass-incident response.",
    colorHex: "#D62828",
    iconKey: "siren",
  },
  {
    name: "Sanitation",
    slug: "sanitation",
    description: "Waste management, water safety and hygiene remediation.",
    colorHex: "#457B9D",
    iconKey: "droplets",
  },
  {
    name: "Child Welfare",
    slug: "child-welfare",
    description: "Child safety, nutrition, care and abuse-response support.",
    colorHex: "#6D597A",
    iconKey: "baby",
  },
] as const;

export const MASTER_REPORT_STATUS_FLOW = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "CLASSIFIED",
  "DUPLICATE_FLAGGED",
  "ROUTED_TO_NGO",
  "ACCEPTED_BY_NGO",
  "REJECTED_BY_NGO",
  "REASSIGNMENT_PENDING",
  "VOLUNTEER_ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED_PENDING_VERIFICATION",
  "VERIFIED_CLOSED",
  "INVALID",
  "ESCALATED",
  "DUPLICATE_MERGED",
] as const;

export const NGO_TASK_STATUS_FLOW = [
  "PENDING_NGO_ACCEPTANCE",
  "ACCEPTED",
  "REJECTED",
  "VOLUNTEER_ASSIGNMENT_PENDING",
  "ASSIGNED",
  "VOLUNTEER_REJECTED",
  "REASSIGNMENT_NEEDED",
  "IN_PROGRESS",
  "COMPLETED_PENDING_VERIFICATION",
  "VERIFIED_CLOSED",
  "REWORK_NEEDED",
  "ESCALATED",
] as const;

export const ROLE_PERMISSION_MATRIX = {
  SUPER_ADMIN: [
    "approve_ngos",
    "view_all_reports",
    "override_ai_recommendations",
    "merge_duplicates",
    "mark_invalid_reports",
    "reroute_reports",
    "handle_escalations",
    "view_platform_analytics",
  ],
  NGO_ADMIN: [
    "view_routed_tasks",
    "accept_or_reject_tasks",
    "assign_or_override_volunteers",
    "verify_task_completion",
    "manage_ngo_team",
    "view_ngo_analytics",
  ],
  SURVEYOR: [
    "submit_field_reports",
    "view_own_reports",
    "track_direct_and_central_routes",
    "view_assigned_region",
  ],
  VOLUNTEER: [
    "view_assigned_tasks",
    "accept_or_reject_assignment",
    "update_task_progress",
    "upload_evidence",
    "manage_availability",
  ],
  USER: [
    "submit_public_issue",
    "track_own_reports",
    "view_notifications",
  ],
} as const;

export const DEFAULT_COORDINATES = {
  lat: 28.6139,
  lng: 77.209,
};
