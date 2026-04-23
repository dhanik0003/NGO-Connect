'use client';
import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { SITE_NAME, SITE_SHORT_NAME } from '@/lib/brand';

export function Header() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  const links = [
    { label: 'About', href: '/about' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'NGO Categories', href: '/categories' },
    { label: 'Contact', href: '/contact' },
  ];

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 mx-auto w-full max-w-5xl border-transparent bg-transparent md:rounded-md md:transition-all md:ease-out',
        {
          'bg-background/95 supports-[backdrop-filter]:bg-background/50 border border-border backdrop-blur-lg md:top-4 md:max-w-4xl md:shadow':
            scrolled && !open,
          'bg-background/90 border-b border-border': open,
        },
      )}
    >
      <nav
        className={cn(
          'flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out',
          {
            'md:px-2': scrolled,
          },
        )}
      >
        {/* Logo / Wordmark */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground text-xs font-bold">
            {SITE_SHORT_NAME}
          </div>
          <span className="font-semibold tracking-tight text-sm">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              {link.label}
            </Link>
          ))}
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          'bg-background/90 fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div
          data-slot={open ? 'open' : 'closed'}
          className={cn(
            'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
            'flex h-full w-full flex-col justify-between gap-y-2 p-4',
          )}
        >
          <div className="grid gap-y-2">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  variant: 'ghost',
                  className: 'justify-start',
                })}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/login" onClick={() => setOpen(false)}>
                Sign In
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link to="/register" onClick={() => setOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
