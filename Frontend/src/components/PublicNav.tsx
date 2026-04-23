import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { SITE_NAME, SITE_SHORT_NAME } from "@/lib/brand";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/categories", label: "NGO Categories" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground font-bold">
            {SITE_SHORT_NAME}
          </div>
          <span className="font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              activeOptions={{ exact: true }}
              className="text-sm font-medium hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <Link to="/register">Get started</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-1 mt-8">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 grid gap-2">
                <Button asChild variant="outline">
                  <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register" onClick={() => setOpen(false)}>Get started</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground font-bold">
              {SITE_SHORT_NAME}
            </div>
            <span className="font-semibold">{SITE_NAME}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Intelligent NGO task routing and volunteer coordination.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/categories" className="hover:text-foreground">NGO Categories</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Get started</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/register" className="hover:text-foreground">Register</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Privacy</li>
            <li>Terms</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
