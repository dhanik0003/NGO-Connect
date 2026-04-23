import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { inferCoordinatesFromAddress } from "@/lib/location";

const schema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(1000),
  categorySlug: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  location: z.string().trim().min(2).max(200),
  preferredRoute: z.enum(["ngo", "central"]).optional(),
});

interface Props {
  mode?: "user" | "surveyor";
}

export function ReportForm({ mode = "user" }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const accessToken = useSessionStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ["meta", "bootstrap"],
    queryFn: () => apiClient.getBootstrap(),
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      severity: "medium",
      preferredRoute: mode === "surveyor" ? "ngo" : undefined,
    },
  });
  const severity = watch("severity");
  const categorySlug = watch("categorySlug");
  const preferredRoute = watch("preferredRoute");

  useEffect(() => {
    if (!categorySlug && categoriesQuery.data?.categories[0]) {
      setValue("categorySlug", categoriesQuery.data.categories[0].slug);
    }
  }, [categoriesQuery.data, categorySlug, setValue]);

  const createReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      if (!accessToken) {
        throw new Error("Please sign in before submitting a report.");
      }

      const coordinates = inferCoordinatesFromAddress(data.location);

      if (mode === "surveyor") {
        return apiClient.createSurveyorReport(accessToken, {
          title: data.title,
          description: data.description,
          categorySlug: data.categorySlug,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          address: data.location,
          preferredRoute: data.preferredRoute,
          isEmergency: data.severity === "critical",
          media: file,
        });
      }

      return apiClient.createReport(accessToken, {
        title: data.title,
        description: data.description,
        categorySlug: data.categorySlug,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address: data.location,
        media: file,
      });
    },
    onSuccess: async (report) => {
      toast.success(
        report.routedNgo
          ? `Report routed to ${report.routedNgo.name}.`
          : mode === "surveyor"
            ? "Report sent to the central queue."
            : "Report submitted and kept in the central review queue.",
      );
      reset({
        severity: "medium",
        preferredRoute: mode === "surveyor" ? "ngo" : undefined,
        categorySlug: categoriesQuery.data?.categories[0]?.slug ?? "",
        title: "",
        description: "",
        location: "",
      });
      setFile(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reports", "my"] }),
        queryClient.invalidateQueries({ queryKey: ["surveyor", "reports"] }),
        queryClient.invalidateQueries({ queryKey: ["surveyor", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", accessToken] }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Card>
      <CardContent className="p-6">
        <form
          onSubmit={handleSubmit(async (data) => {
            await createReportMutation.mutateAsync(data);
          })}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" className="mt-1.5" placeholder="Brief summary of the issue" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              className="mt-1.5"
              placeholder="What is happening, who is affected, and how urgent is it?"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={categorySlug} onValueChange={(value) => setValue("categorySlug", value, { shouldValidate: true })}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categoriesQuery.data?.categories.map((entry) => (
                    <SelectItem key={entry.id} value={entry.slug}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categorySlug && <p className="text-xs text-destructive mt-1">{errors.categorySlug.message}</p>}
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(value) => setValue("severity", value as z.infer<typeof schema>["severity"])}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === "surveyor" && (
            <div>
              <Label>Route report to</Label>
              <Select value={preferredRoute} onValueChange={(value) => setValue("preferredRoute", value as "ngo" | "central", { shouldValidate: true })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ngo">My NGO intake queue</SelectItem>
                  <SelectItem value="central">Central queue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="location">Location</Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="location" className="pl-9" placeholder="Address or area" {...register("location")} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Routing uses an estimated map point from this address.
            </p>
            {errors.location && <p className="text-xs text-destructive mt-1">{errors.location.message}</p>}
          </div>
          <div>
            <Label>Photo / Video evidence</Label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition hover:bg-muted/40">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{file?.name ?? "Click to upload (image or video)"}</span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <Button type="submit" disabled={isSubmitting || createReportMutation.isPending} className="w-full">
            {isSubmitting || createReportMutation.isPending ? "Submitting..." : "Submit report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
