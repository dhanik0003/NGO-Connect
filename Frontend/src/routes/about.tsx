import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicNav";
import { SITE_NAME } from "@/lib/brand";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About - ${SITE_NAME}` },
      { name: "description", content: "Our mission: faster, accountable humanitarian response through smart coordination." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">About {SITE_NAME}</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          We exist to shorten the distance between a problem reported and a real, accountable response on the ground.
        </p>
        <div className="prose prose-neutral mt-10 max-w-none">
          <h2 className="text-2xl font-semibold mt-10">Our mission</h2>
          <p className="text-muted-foreground mt-2">
            Citizens, surveyors, and frontline staff witness urgent issues every day, from food shortages to flood-stuck families. Yet response is often slowed by fragmented channels, duplicate reporting, and unclear ownership. {SITE_NAME} fixes that with a transparent routing layer that connects every report to the right NGO and the right volunteer in minutes.
          </p>
          <h2 className="text-2xl font-semibold mt-10">What we believe</h2>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            <li>Speed and accountability are not opposites.</li>
            <li>Local NGOs know their communities best, and software should empower them, not replace them.</li>
            <li>Every action should leave a verifiable trail.</li>
          </ul>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
