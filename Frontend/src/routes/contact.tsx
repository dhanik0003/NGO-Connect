import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicNav, PublicFooter } from "@/components/PublicNav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Mail, MapPin, Phone } from "lucide-react";
import { SITE_NAME } from "@/lib/brand";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact - ${SITE_NAME}` },
      { name: "description", content: `Get in touch with the ${SITE_NAME} team.` },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(5).max(1000),
});

function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <Toaster />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-5xl grid gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Contact us</h1>
          <p className="mt-3 text-muted-foreground">We&apos;d love to hear from you. NGOs, governments and donors welcome.</p>
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> hello@ngoconnect.org</div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +91 11 4000 0000</div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> New Delhi, India</div>
          </div>
        </div>
        <form
          onSubmit={handleSubmit(async (data) => {
            await new Promise((r) => setTimeout(r, 600));
            toast.success("Message sent. We'll reply within 1 business day.");
            reset();
            console.log("contact", data);
          })}
          className="rounded-xl border bg-card p-6 space-y-4"
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} className="mt-1.5" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} className="mt-1.5" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={5} {...register("message")} className="mt-1.5" />
            {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Sending..." : "Send message"}
          </Button>
        </form>
      </main>
      <PublicFooter />
    </div>
  );
}
