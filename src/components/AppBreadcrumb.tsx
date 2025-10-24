"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // adjust path as needed
import { Fragment } from "react";

function formatSegment(segment: string) {
  // turn 'user-profile' into 'User Profile'
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname
    .split("/")
    .filter((seg) => seg.trim() !== ""); // remove empty

  // Build link path cumulatively
  const paths = segments.map((_, idx) => "/" + segments.slice(0, idx + 1).join("/"));

  return (
    <Breadcrumb>
      <BreadcrumbList> 
        {segments.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )} 
        
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const path = paths[index];

          return (
            <Fragment key={path}>
              <BreadcrumbItem>
                {!isLast ? (
                  <BreadcrumbLink asChild>
                    <Link href={path}>{formatSegment(segment)}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">
                    {formatSegment(segment)}
                  </span>
                )}
              </BreadcrumbItem>

              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
