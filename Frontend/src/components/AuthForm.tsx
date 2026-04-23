import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicNav, PublicFooter } from "@/components/PublicNav";
import { loginRoles, type RegisterRoleId, type RoleId } from "@/components/RoleSelector";
import { toast } from "sonner";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { fallbackCategories } from "@/lib/bootstrap-fallback";
import { SITE_NAME } from "@/lib/brand";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
});

const registerSchemas = {
  user: loginSchema.extend({
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(8).max(20),
    currentAddress: z.string().trim().min(4).max(200),
  }),
  ngo: loginSchema.extend({
    ngoName: z.string().trim().min(2).max(140),
    phone: z.string().trim().min(8).max(20),
    description: z.string().trim().min(10).max(400),
    headquartersAddress: z.string().trim().min(4).max(200),
    serviceRadiusKm: z.coerce.number().positive(),
    adminFullName: z.string().trim().min(2).max(100),
    adminPhone: z.string().trim().min(8).max(20).optional(),
    domainSlug: z.string().trim().min(1, "Select an NGO domain."),
  }),
  surveyor: loginSchema.extend({
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(8).max(20),
    ngoId: z.string().trim().min(1),
    assignedRegionName: z.string().trim().min(4).max(160),
    serviceRadiusKm: z.coerce.number().positive(),
  }),
  volunteer: loginSchema.extend({
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(8).max(20),
    ngoId: z.string().trim().min(1),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    serviceRadiusKm: z.coerce.number().positive(),
    skillsCsv: z.string().trim().min(2),
    vehicleType: z.string().trim().min(2).max(60).optional(),
  }),
} as const;

type FormValues = {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  currentAddress?: string;
  ngoName?: string;
  description?: string;
  headquartersAddress?: string;
  serviceRadiusKm?: number;
  adminFullName?: string;
  adminPhone?: string;
  domainSlug?: string;
  ngoId?: string;
  assignedRegionName?: string;
  latitude?: number;
  longitude?: number;
  skillsCsv?: string;
  vehicleType?: string;
};

interface Props {
  mode: "login" | "register";
  role: RoleId;
}

const dashboardByUserRole: Record<string, string> = {
  NGO_ADMIN: "/ngo",
  SURVEYOR: "/surveyor",
  VOLUNTEER: "/volunteer",
  USER: "/user",
  SUPER_ADMIN: "/",
};

export function AuthForm({ mode, role }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const roleConfig = loginRoles.find((entry) => entry.id === role)!;
  const setSession = useSessionStore((state) => state.setSession);
  const schema = mode === "login" ? loginSchema : registerSchemas[role as RegisterRoleId];
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema as unknown as z.ZodType<FormValues>),
    defaultValues:
      role === "ngo"
        ? { serviceRadiusKm: 20 }
        : role === "volunteer"
          ? { latitude: 28.6139, longitude: 77.209, serviceRadiusKm: 10 }
          : role === "surveyor"
            ? { serviceRadiusKm: 10 }
          : undefined,
  });

  const selectedDomain = watch("domainSlug");
  const selectedNgoId = watch("ngoId");

  const bootstrapQuery = useQuery({
    queryKey: ["meta", "bootstrap"],
    queryFn: () => apiClient.getBootstrap(),
    enabled: mode === "register" && role !== "user",
  });

  const availableCategories = bootstrapQuery.data?.categories?.length
    ? bootstrapQuery.data.categories
    : fallbackCategories;
  const availableNgos = bootstrapQuery.data?.ngos ?? [];

  useEffect(() => {
    if (mode === "register" && role === "ngo" && !selectedDomain && availableCategories[0]) {
      setValue("domainSlug", availableCategories[0].slug, { shouldValidate: true });
    }
  }, [availableCategories, mode, role, selectedDomain, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (mode === "login") {
        return apiClient.login({
          email: values.email,
          password: values.password,
        });
      }

      if (role === "user") {
        return apiClient.register("user", {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          currentAddress: values.currentAddress,
        });
      }

      if (role === "ngo") {
        return apiClient.register("ngo", {
          ngoName: values.ngoName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          description: values.description,
          headquartersAddress: values.headquartersAddress,
          serviceRadiusKm: values.serviceRadiusKm,
          domainSlugs: values.domainSlug ? [values.domainSlug] : [],
          adminFullName: values.adminFullName,
          adminPhone: values.adminPhone,
        });
      }

      if (role === "surveyor") {
        return apiClient.register("surveyor", {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          ngoId: values.ngoId,
          assignedAddress: values.assignedRegionName,
          serviceRadiusKm: values.serviceRadiusKm,
        });
      }

      return apiClient.register("volunteer", {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        ngoId: values.ngoId,
        latitude: values.latitude,
        longitude: values.longitude,
        serviceRadiusKm: values.serviceRadiusKm,
        skills: values.skillsCsv?.split(",").map((skill) => skill.trim()).filter(Boolean) ?? [],
        vehicleType: values.vehicleType,
      });
    },
    onSuccess: (payload) => {
      setSession(payload);
      toast.success(mode === "login" ? "Signed in successfully." : "Account created.");
      const destination = dashboardByUserRole[payload.user.role] ?? roleConfig.dashboard;
      navigate({ to: destination });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-subtle)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.34),transparent_34%),linear-gradient(to_bottom,transparent,rgba(248,250,252,0.92)_88%)] dark:bg-[radial-gradient(circle_at_top,rgba(82,39,255,0.18),transparent_40%),linear-gradient(to_bottom,transparent,rgba(14,23,36,0.9)_90%)]" />
        <div className="relative container mx-auto max-w-md px-4 py-16">
          <div className="rounded-2xl border bg-card/88 p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <roleConfig.icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {mode === "login" ? "Sign in as" : "Register as"} {roleConfig.label}
              </h1>
              <p className="text-xs text-muted-foreground">{roleConfig.desc}</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(async (data) => {
              await mutation.mutateAsync(data);
            })}
            className="space-y-4"
          >
            {mode === "register" && role !== "ngo" && (
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" className="mt-1.5" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
              </div>
            )}

            {mode === "register" && role === "ngo" && (
              <div>
                <Label htmlFor="ngoName">NGO name</Label>
                <Input id="ngoName" className="mt-1.5" {...register("ngoName")} />
                {errors.ngoName && <p className="text-xs text-destructive mt-1">{errors.ngoName.message}</p>}
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-1.5" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? "text" : "password"} className="pr-11" {...register("password")} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-1 my-auto h-8 w-8"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            {mode === "register" && role !== "ngo" && (
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" className="mt-1.5" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
              </div>
            )}

            {mode === "register" && role === "user" && (
              <div>
                <Label htmlFor="currentAddress">Current address</Label>
                <Input id="currentAddress" className="mt-1.5" {...register("currentAddress")} />
                {errors.currentAddress && <p className="text-xs text-destructive mt-1">{errors.currentAddress.message}</p>}
              </div>
            )}

            {mode === "register" && role === "ngo" && (
              <>
                <div>
                  <Label htmlFor="phone">NGO phone</Label>
                  <Input id="phone" className="mt-1.5" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" className="mt-1.5" {...register("description")} />
                  {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
                </div>
                <div>
                  <Label htmlFor="headquartersAddress">Headquarters address</Label>
                  <Input id="headquartersAddress" className="mt-1.5" {...register("headquartersAddress")} />
                  {errors.headquartersAddress && <p className="text-xs text-destructive mt-1">{errors.headquartersAddress.message}</p>}
                </div>
                <div>
                  <Label htmlFor="serviceRadiusKm">Service radius (km)</Label>
                  <Input id="serviceRadiusKm" type="number" className="mt-1.5" {...register("serviceRadiusKm", { valueAsNumber: true })} />
                  {errors.serviceRadiusKm && <p className="text-xs text-destructive mt-1">{errors.serviceRadiusKm.message}</p>}
                </div>
                <div>
                  <Label>NGO domain</Label>
                  <Select value={selectedDomain ?? undefined} onValueChange={(value) => setValue("domainSlug", value, { shouldValidate: true })}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select one domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bootstrapQuery.isError ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Showing fallback domain list because the live category feed is unavailable.
                    </p>
                  ) : null}
                  {errors.domainSlug && <p className="text-xs text-destructive mt-1">{errors.domainSlug.message}</p>}
                </div>
                <div>
                  <Label htmlFor="adminFullName">NGO admin name</Label>
                  <Input id="adminFullName" className="mt-1.5" {...register("adminFullName")} />
                  {errors.adminFullName && <p className="text-xs text-destructive mt-1">{errors.adminFullName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="adminPhone">NGO admin phone</Label>
                  <Input id="adminPhone" className="mt-1.5" {...register("adminPhone")} />
                  {errors.adminPhone && <p className="text-xs text-destructive mt-1">{errors.adminPhone.message}</p>}
                </div>
              </>
            )}

            {mode === "register" && (role === "surveyor" || role === "volunteer") && (
              <>
                <div>
                  <Label>NGO association</Label>
                  <Select value={selectedNgoId ?? undefined} onValueChange={(value) => setValue("ngoId", value, { shouldValidate: true })}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select NGO" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNgos.map((ngo) => (
                        <SelectItem key={ngo.id} value={ngo.id}>
                          {ngo.name} - {ngo.domains.map((domain) => domain.name).join(", ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableNgos.length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      No NGOs are available yet. Register an NGO first or start the backend if this list is empty unexpectedly.
                    </p>
                  ) : null}
                  {errors.ngoId && <p className="text-xs text-destructive mt-1">{errors.ngoId.message}</p>}
                </div>

                {role === "surveyor" && (
                  <div>
                    <Label htmlFor="assignedRegionName">Surveyor&apos;s address</Label>
                    <Input id="assignedRegionName" className="mt-1.5" {...register("assignedRegionName")} />
                    {errors.assignedRegionName && <p className="text-xs text-destructive mt-1">{errors.assignedRegionName.message}</p>}
                  </div>
                )}

                {role === "volunteer" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input id="latitude" type="number" step="0.0001" className="mt-1.5" {...register("latitude", { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input id="longitude" type="number" step="0.0001" className="mt-1.5" {...register("longitude", { valueAsNumber: true })} />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="serviceRadiusKm">Service radius (km)</Label>
                  <Input id="serviceRadiusKm" type="number" className="mt-1.5" {...register("serviceRadiusKm", { valueAsNumber: true })} />
                </div>

                {role === "volunteer" && (
                  <>
                    <div>
                      <Label htmlFor="skillsCsv">Skills</Label>
                      <Input id="skillsCsv" className="mt-1.5" placeholder="First Aid, Driving, Counseling" {...register("skillsCsv")} />
                      {errors.skillsCsv && <p className="text-xs text-destructive mt-1">{errors.skillsCsv.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="vehicleType">Vehicle type</Label>
                      <Input id="vehicleType" className="mt-1.5" placeholder="bike or car" {...register("vehicleType")} />
                    </div>
                  </>
                )}
              </>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <Link to="/register/$role" params={{ role }} className="text-primary font-medium">Register</Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/login/$role" params={{ role }} className="text-primary font-medium">Sign in</Link>
              </>
            )}
            <div className="mt-2">
              <Link to={mode === "login" ? "/login" : "/register"} className="text-xs hover:underline">
                {"<-"} Choose a different role
              </Link>
            </div>
            <div className="mt-3 text-xs">
              {SITE_NAME}
            </div>
          </div>
        </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
