import type { ApiCategory } from "@/services/api";

export const fallbackCategories: ApiCategory[] = [
  { id: "animal-care", name: "Animal Care", slug: "animal-care", description: "Rescue, treatment, shelter and street-animal intervention." },
  { id: "healthcare", name: "Healthcare", slug: "healthcare", description: "Urgent aid, medicine access, clinics and emergency care." },
  { id: "education", name: "Education", slug: "education", description: "School access, supplies, tutoring and literacy support." },
  { id: "elder-care", name: "Elder Care", slug: "elder-care", description: "Senior support, welfare checks and care coordination." },
  { id: "women-safety", name: "Women Safety", slug: "women-safety", description: "Safety intervention, protection response and legal support." },
  { id: "environment", name: "Environment", slug: "environment", description: "Cleanup, conservation, pollution and green response work." },
  { id: "food-support", name: "Food Support", slug: "food-support", description: "Meal distribution, rations and hunger-response programs." },
  { id: "disaster-relief", name: "Disaster Relief", slug: "disaster-relief", description: "Flood, fire, landslide, storm and mass-incident response." },
  { id: "sanitation", name: "Sanitation", slug: "sanitation", description: "Waste management, water safety and hygiene remediation." },
  { id: "child-welfare", name: "Child Welfare", slug: "child-welfare", description: "Child safety, nutrition, care and abuse-response support." },
];
