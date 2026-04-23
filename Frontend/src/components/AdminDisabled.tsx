import { Card, CardContent } from "@/components/ui/card";

export function AdminDisabled() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--gradient-subtle)]">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Super admin interface removed</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This build focuses on citizen, NGO admin, surveyor, and volunteer workflows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
