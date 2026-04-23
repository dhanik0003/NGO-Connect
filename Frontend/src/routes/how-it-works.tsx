import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, PublicFooter } from "@/components/PublicNav";
import { Card, CardContent } from "@/components/ui/card";
import { SITE_NAME } from "@/lib/brand";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: `How It Works - ${SITE_NAME}` },
      { name: "description", content: "From report to verified resolution in 4 steps." },
    ],
  }),
  component: How,
});

const steps = [
  { n: "01", t: "Report", d: "A citizen or surveyor submits an issue with location, severity, and media evidence." },
  { n: "02", t: "Classify and route", d: "Our AI categorizes the report and routes it to the closest verified NGO with capacity." },
  { n: "03", t: "Dispatch", d: "The NGO assigns volunteers manually or with AI suggestions based on skills, distance, and availability." },
  { n: "04", t: "Resolve and verify", d: "Volunteers update status, upload evidence, and NGO teams verify completion." },
];

function How() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center">How it works</h1>
        <p className="mt-4 text-center text-muted-foreground">A coordinated pipeline from report to verified resolution.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.n} className="border-border/60">
              <CardContent className="p-7">
                <div className="text-sm font-mono text-primary">{step.n}</div>
                <h3 className="mt-2 text-xl font-semibold">{step.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
