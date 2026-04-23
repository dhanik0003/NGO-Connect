import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicNav, PublicFooter } from "@/components/PublicNav";
import { apiClient } from "@/services/api";
import { SITE_NAME } from "@/lib/brand";
import {
  describeCategory,
  getCategoryInitials,
  getCategoryTint,
} from "@/lib/category-presenter";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: `NGO Categories - ${SITE_NAME}` },
      { name: "description", content: "Causes and categories supported by our partner NGO network." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const bootstrapQuery = useQuery({
    queryKey: ["meta", "bootstrap"],
    queryFn: () => apiClient.getBootstrap(),
  });
  const categories = bootstrapQuery.data?.categories ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">NGO Categories</h1>
        <p className="mt-3 text-muted-foreground">Every cause we route reports across.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
              No categories are available yet. Start the backend to load the live category list.
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="rounded-xl border bg-card p-6 hover:border-primary/40 hover:shadow-[var(--shadow-soft)] transition"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold ${getCategoryTint(category.slug)}`}
                >
                  {getCategoryInitials(category.name)}
                </div>
                <h3 className="mt-3 font-semibold text-lg">{category.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{describeCategory(category)}</p>
              </div>
            ))
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
