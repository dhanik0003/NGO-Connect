interface CategoryLike {
  name: string;
  slug: string;
  description?: string | null;
}

const fallbackDescriptions: Record<string, string> = {
  "animal-care": "Rescue, shelter, and urgent response for animals in distress.",
  healthcare: "Medical aid, urgent care, and community health support.",
  education: "School access, learning resources, and education continuity.",
  "elder-care": "Support, protection, and assistance for senior citizens.",
  "women-safety": "Safety response, crisis intervention, and protection workflows.",
  environment: "Cleanup, restoration, and environmental protection response.",
  "food-support": "Meal support, ration delivery, and hunger relief coordination.",
  "disaster-relief": "Emergency response for floods, fires, storms, and disasters.",
  sanitation: "Waste, hygiene, and public sanitation issue handling.",
  "child-welfare": "Protection, care, and support services for children.",
};

const tintBySlug: Record<string, string> = {
  "animal-care": "bg-emerald-100 text-emerald-700",
  healthcare: "bg-rose-100 text-rose-700",
  education: "bg-sky-100 text-sky-700",
  "elder-care": "bg-amber-100 text-amber-700",
  "women-safety": "bg-fuchsia-100 text-fuchsia-700",
  environment: "bg-lime-100 text-lime-700",
  "food-support": "bg-orange-100 text-orange-700",
  "disaster-relief": "bg-red-100 text-red-700",
  sanitation: "bg-cyan-100 text-cyan-700",
  "child-welfare": "bg-violet-100 text-violet-700",
};

export function describeCategory(category: CategoryLike) {
  return category.description?.trim() || fallbackDescriptions[category.slug] || `Routing and response workflows for ${category.name.toLowerCase()} issues.`;
}

export function getCategoryInitials(name: string) {
  return name
    .split(" ")
    .map((segment) => segment[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getCategoryTint(slug: string) {
  return tintBySlug[slug] ?? "bg-primary/10 text-primary";
}
