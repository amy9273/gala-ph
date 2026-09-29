"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  CreditCard,
  Bus,
  Receipt,
  Radio,
  Menu,
  X,
  PlusCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

const NAV_ITEMS = [
  {
    label: "Trips & Planner",
    href: "/trips",
    icon: Compass,
  },
  {
    label: "Dual-RFID Tolls",
    href: "/toll-calculator",
    icon: CreditCard,
  },
  {
    label: "Transit & TODA",
    href: "/transit",
    icon: Bus,
  },
  {
    label: "KKB Splitter",
    href: "/ledger",
    icon: Receipt,
  },
  {
    label: "Convoy HUD",
    href: "/convoy",
    icon: Radio,
    badge: "LIVE",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="glass-nav">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-ocean to-accent-sunset text-white shadow-sm transition-transform group-hover:scale-105">
            <span className="text-lg">🌴</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-foreground font-sans">
              Gala<span className="text-brand-ocean">PH</span>
            </span>
            <span className="rounded-md bg-accent-sunset/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-sunset border border-accent-sunset/20">
              v1.0
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-brand-ocean/10 text-brand-ocean font-semibold dark:bg-brand-ocean/20"
                    : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-blue-500/15 px-1.5 py-0.2 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Profile */}
        <div className="hidden sm:flex items-center gap-2">
          <ThemeToggle />

          <Link href="/trips">
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex rounded-xl"
            >
              <KeyRound className="h-4 w-4 text-accent-sunset" />
              <span>Join Barkada</span>
            </Button>
          </Link>

          <Link href="/trips">
            <Button size="sm" variant="default" className="rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>Plan Trip</span>
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-xl"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface/95 backdrop-blur-xl px-4 pt-2 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-brand-ocean/10 text-brand-ocean font-semibold"
                      : "text-foreground hover:bg-surface-secondary",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-brand-ocean" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-600">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
            <Link href="/trips" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                <KeyRound className="h-4 w-4 text-accent-sunset" />
                <span>Join with Barkada Code</span>
              </Button>
            </Link>
            <Link href="/trips" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="default" className="w-full justify-center">
                <Sparkles className="h-4 w-4" />
                <span>Start New Philippine Road Trip</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
