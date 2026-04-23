import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Activity, MapPin, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedMetric } from "@/components/AnimatedMetric";
import { PublicFooter } from "@/components/PublicNav";
import { Header } from "@/components/ui/header-2";
import LightPillar from "@/components/LightPillar";
import { TextReveal } from "@/components/TextReveal";
import { apiClient } from "@/services/api";
import { SITE_NAME } from "@/lib/brand";
import {
  describeCategory,
  getCategoryInitials,
  getCategoryTint,
} from "@/lib/category-presenter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE_NAME} - Smart NGO routing and volunteer coordination` },
      {
        name: "description",
        content: "Report issues, route them to the right NGO, and dispatch volunteers in real time.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const bootstrapQuery = useQuery({
    queryKey: ["meta", "bootstrap"],
    queryFn: () => apiClient.getBootstrap(),
  });
  const categories = bootstrapQuery.data?.categories ?? [];
  const ngos = bootstrapQuery.data?.ngos ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--gradient-subtle)]" />
          <div className="absolute inset-x-0 top-0 h-[600px]">
            <LightPillar
              topColor="#5227FF"
              bottomColor="#FF9FFC"
              intensity={1}
              rotationSpeed={0.3}
              glowAmount={0.005}
              pillarWidth={3}
              pillarHeight={0.4}
              noiseIntensity={0.5}
              pillarRotation={0}
              interactive={false}
              mixBlendMode="normal"
              quality="high"
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%),linear-gradient(to_bottom,rgba(248,250,252,0.18),rgba(248,250,252,0.8)_86%)] dark:bg-[linear-gradient(to_bottom,rgba(10,14,24,0.08),rgba(10,14,24,0.86)_88%)]" />

          <div className="container relative mx-auto px-4 py-20 md:py-32 text-center max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border bg-background/60 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered task routing for NGOs
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <TextReveal
                text="Connect every report to the"
                className="flex justify-center"
                wordClassName="leading-[1.05]"
                delay={0.05}
                stagger={0.07}
              />
              <TextReveal
                text="right hands, instantly."
                className="mt-1 flex justify-center"
                wordClassName="leading-[1.05] bg-gradient-to-r from-primary to-[var(--primary-glow)] bg-clip-text text-transparent"
                delay={0.28}
                stagger={0.08}
                blur={12}
              />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              {SITE_NAME} routes citizen reports and field surveys to verified NGOs and dispatches volunteers in
              minutes, with live status, evidence, and accountability built in.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-[var(--shadow-elegant)]">
                <Link to="/register">
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/how-it-works">How it works</Link>
              </Button>
            </motion.div>

            <div className="mt-14 grid grid-cols-3 gap-4 max-w-xl mx-auto">
              {[
                { v: String(categories.length), l: "Active categories" },
                { v: String(ngos.length), l: "Active NGOs" },
                { v: "4", l: "Core user roles" },
              ].map((stat) => (
                <div key={stat.l} className="text-center">
                  <AnimatedMetric value={stat.v} className="text-2xl md:text-3xl font-bold tracking-tight" />
                  <div className="text-xs text-muted-foreground mt-1">{stat.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for fast, accountable response</h2>
            <p className="mt-3 text-muted-foreground">Every step from report to verification, coordinated.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Zap,
                t: "Smart routing",
                d: "AI classifies severity and routes to the closest verified NGO with available capacity.",
              },
              {
                icon: MapPin,
                t: "Geo-aware dispatch",
                d: "Assign volunteers based on proximity, skills, and live availability.",
              },
              {
                icon: ShieldCheck,
                t: "Evidence and verification",
                d: "Photo, video, and surveyor confirmation before tasks are closed.",
              },
              {
                icon: Users,
                t: "Multi-role workflows",
                d: "Citizens, NGOs, surveyors, and volunteers each get focused tools.",
              },
              {
                icon: Activity,
                t: "Live timelines",
                d: "Status tracking from submission to verified resolution.",
              },
              {
                icon: Sparkles,
                t: "Duplicate detection",
                d: "Merges overlapping reports automatically to avoid wasted dispatch.",
              },
            ].map((feature) => (
              <Card key={feature.t} className="border-border/60 hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/30 border-y">
          <div className="container mx-auto px-4 py-20">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">NGO categories we support</h2>
                <p className="mt-2 text-muted-foreground">A growing network across every cause.</p>
              </div>
              <Button asChild variant="outline">
                <Link to="/categories">View all</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.length === 0 ? (
                <div className="col-span-full rounded-xl border bg-background p-5 text-sm text-muted-foreground">
                  Categories will appear here once the backend is running.
                </div>
              ) : (
                categories.slice(0, 8).map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border bg-background p-5 hover:border-primary/40 transition-colors"
                  >
                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold ${getCategoryTint(category.slug)}`}
                    >
                      {getCategoryInitials(category.name)}
                    </div>
                    <div className="mt-3 font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{describeCategory(category)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-[var(--primary-glow)] p-10 md:p-16 text-center text-primary-foreground shadow-[var(--shadow-elegant)]">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to mobilize your community?</h2>
            <p className="mt-3 opacity-90 max-w-xl mx-auto">Join {SITE_NAME} as a citizen, NGO, surveyor, or volunteer.</p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/register">Create your account</Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
