"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const [openItems, setOpenItems] = useState<string[]>(
    items.filter((item) => item.isActive).map((item) => item.title)
  );

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <nav className="space-y-1 px-3 py-4">
      <div className="px-3 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Platform
      </div>
      <ul className="space-y-1">
        {items.map((item) => {
          const isOpen = openItems.includes(item.title);
          const Icon = item.icon;

          return (
            <li key={item.title}>
              <div
                className={cn(
                  "flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 cursor-pointer",
                  isOpen
                    ? "bg-slate-50"
                    : "hover:bg-slate-100"
                )}
                onClick={() => item.items && toggleItem(item.title)}
              >
                <Link
                  href={item.url}
                  className="flex items-center gap-3 flex-1"
                  onClick={(e) => item.items && e.preventDefault()}
                >
                  {Icon && (
                    <Icon className="w-5 h-5 text-slate-600 hover:text-slate-900 transition-colors" />
                  )}
                  <span className="font-medium text-sm text-slate-700 hover:text-slate-900 transition-colors">
                    {item.title}
                  </span>
                </Link>
                {item?.items && (
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-slate-400 transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                )}
              </div>

              {item?.items && isOpen && (
                <ul className="ml-6 mt-1 space-y-0.5 border-l-2 border-slate-200 pl-4">
                  {item.items.map((subItem) => (
                    <li key={subItem.title}>
                      <Link
                        href={subItem.url}
                        className="block py-2 px-3 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors duration-200"
                      >
                        {subItem.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
