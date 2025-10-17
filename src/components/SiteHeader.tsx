"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type NavItem = {
  label: string;
  href?: string;
  target?: "_blank" | "_self";
  children?: { label: string; href: string; target?: "_blank" | "_self" }[];
};

type Props = {
  nav: NavItem[];
  logo?: { src: string; alt?: string; width?: number; height?: number };
  cta?: { label: string; href: string };
  renderRight?: React.ReactNode; // e.g., <ThemeToggle/> or user avatar
};

export function SiteHeader({ nav, logo, cta, renderRight }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollDir, setScrollDir] = useState<"up" | "down">("up");
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const menuBtnId = useId();
  const mobileNavId = useId();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setAtTop(y < 8);
      const dir = y > lastY.current ? "down" : "up";
      // small threshold to avoid jitter
      if (Math.abs(y - lastY.current) > 6 && y > 48) setScrollDir(dir);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      // lock scroll
      const { overflow } = document.documentElement
        .style as CSSStyleDeclaration & { overflow?: string };
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = overflow || "";
      };
    }
  }, [mobileOpen]);

  // Close on route change (Next.js soft nav) – optional
  useEffect(() => {
    const handler = () => setMobileOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:m-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header
        className={[
          "fixed inset-x-0 top-0 z-40 transition-transform duration-200 will-change-transform  border-b backdrop-blur supports-[backdrop-filter]:bg-background/70",
          scrollDir === "down" && !mobileOpen
            ? "-translate-y-full"
            : "translate-y-0",
          atTop ? "bg-background/80" : "bg-background/90",
          "border-border",
        ].join(" ")}
        id="site-header"
        role="banner"
      >
        <div className={["mx-auto max-w-7xl", ""].join(" ")}>
          <div className="flex h-16 items-center px-4">
            <div className="flex flex-1 items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2"
                aria-label="Home"
              >
                {logo ? (
                  <Image
                    src={logo.src}
                    alt={logo.alt ?? "Logo"}
                    width={logo.width ?? 28}
                    height={logo.height ?? 28}
                    className="h-16 w-16"
                    priority
                  />
                ) : (
                  <span className="text-lg font-bold">Brand</span>
                )}
              </Link>
            </div>

            {/* Desktop nav */}
            <nav
              className="hidden lg:flex lg:items-center lg:gap-2"
              aria-label="Primary"
            >
              {nav.map((item) => {
                return (
                  <Link
                    key={item.label}
                    href={item.href ?? "#"}
                    target={item.target}
                    className="rounded px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto hidden items-center gap-2 lg:flex">
              {renderRight}
              {cta && (
                <Link
                  href={cta.href}
                  className="ml-4 inline-flex items-center rounded-md border bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {cta.label}
                </Link>
              )}
            </div>

            {/* Mobile toggle */}
            <div className="ml-auto lg:hidden">
              <button
                id={menuBtnId}
                aria-controls={mobileNavId}
                aria-expanded={mobileOpen}
                aria-label="Toggle menu"
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Hamburger open={mobileOpen} />
              </button>
            </div>
          </div>

          {/* Mobile nav panel */}
          <div
            id={mobileNavId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={menuBtnId}
            className={[
              "lg:hidden",
              "border-t border-border",
              mobileOpen ? "block" : "hidden",
            ].join(" ")}
          >
            <div className="px-3 pb-3 pt-2 sm:px-4">
              <div className="flex items-center justify-between">
                {renderRight}
                {cta && (
                  <Link
                    href={cta.href}
                    className="inline-flex items-center rounded-md border bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cta.label}
                  </Link>
                )}
              </div>

              <ul
                className="mt-2 space-y-1"
                role="menu"
                aria-label="Mobile Primary"
              >
                {nav.map((item) =>
                  item.children?.length ? (
                    <li key={item.label}>
                      <MobileCollapsible
                        item={item}
                        onSelect={() => setMobileOpen(false)}
                      />
                    </li>
                  ) : (
                    <li key={item.label}>
                      <Link
                        href={item.href ?? "#"}
                        target={item.target}
                        className="block rounded px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setMobileOpen(false)}
                        role="menuitem"
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* spacer so content isn't hidden under fixed header */}
      <div aria-hidden className="h-16" />
    </>
  );
}
  
function MobileCollapsible({
  item,
  onSelect,
}: {
  item: NavItem;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="rounded border">
      <button
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-controls={id}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <span className="ml-2">{open ? "▴" : "▾"}</span>
      </button>
      <div id={id} hidden={!open}>
        <ul className="py-1">
          {item.children?.map((c) => (
            <li key={c.label}>
              <Link
                href={c.href}
                target={c.target}
                className="block px-5 py-2 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onSelect}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Hamburger({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d={open ? "M6 6 L18 18 M6 18 L18 6" : "M4 7h16M4 12h16M4 17h16"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
