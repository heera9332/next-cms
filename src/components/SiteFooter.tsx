"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Top */}
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="text-xl md:text-2xl font-semibold tracking-tight">
              Next<span className="text-blue-600">CMS</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              WordPress-style CMS on Next.js with a modern admin. Fast, flexible, and scalable.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/docs" className="hover:text-foreground">Docs</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              <li><Link href="/legal" className="hover:text-foreground">Legal</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold">Subscribe</h4>
            <p className="mt-3 text-sm text-muted-foreground">
              Get product updates and tips. No spam.
            </p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: hook up to your API route
              }}
            >
              <Input type="email" placeholder="you@example.com" className="h-9" />
              <Button type="submit" className="h-9 bg-blue-600 hover:bg-blue-700 text-white">
                Join
              </Button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-border/60" />

        {/* Bottom */}
        <div className="flex flex-col-reverse items-center justify-between gap-4 md:gap-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NextCMS. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <Link href="mailto:hello@example.com" aria-label="Email" className="text-muted-foreground hover:text-foreground">
              <Mail className="h-4 w-4" />
            </Link>
            <Link href="https://twitter.com" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">
              <Twitter className="h-4 w-4" />
            </Link>
            <Link href="https://github.com" aria-label="GitHub" className="text-muted-foreground hover:text-foreground">
              <Github className="h-4 w-4" />
            </Link>
            <Link href="https://linkedin.com" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground">
              <Linkedin className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
