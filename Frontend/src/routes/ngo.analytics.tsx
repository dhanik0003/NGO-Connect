import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Users, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/ngo/analytics")({
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">NGO analytics</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tasks completed" value="248" icon={CheckCircle2} tone="success" />
        <StatCard label="Avg response" value="42m" icon={Clock} tone="warning" />
        <StatCard label="Active volunteers" value="34" icon={Users} tone="primary" />
        <StatCard label="Verification rate" value="96%" icon={Activity} tone="info" />
      </div>
      <Card>
        <CardHeader><CardTitle>Tasks per category (30d)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { c: "Disaster", v: 32 },
              { c: "Food", v: 58 },
              { c: "Health", v: 27 },
              { c: "Animal", v: 14 },
              { c: "Education", v: 22 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="c" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="v" fill="oklch(0.52 0.13 200)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  ),
});
