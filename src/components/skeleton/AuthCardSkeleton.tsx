"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// If you already have shadcn/ui Skeleton, use it. Otherwise a minimal fallback is provided.
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import * as React from "react";

type Action =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "logout";

type Props = {
  action: Action;
  className?: string;
};

// Fallback Skeleton if shadcn Skeleton is not present
const FallbackSkeleton: React.FC<React.ComponentProps<"div">> = ({
  className,
}) => (
  <div
    className={`animate-pulse rounded-md bg-gray-200/70 dark:bg-gray-800/60 ${className}`}
  />
);

const Skeleton = ShadcnSkeleton ?? FallbackSkeleton;

const FieldSkeleton = ({ labelWidth = "w-20" }: { labelWidth?: string }) => (
  <div className="grid gap-2">
    <Skeleton className={`${labelWidth} h-4`} />
    <Skeleton className="h-10 rounded-md" />
  </div>
);

export const AuthCardSkeleton: React.FC<Props> = ({ action, className }) => {
  return (
    <div className="min-h-[calc(100dvh-80px)] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] py-8">
        <Card className={`w-full max-w-[480px] py-8 ${className ?? ""}`}>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">
              <Skeleton className="h-7 w-40" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-64" />
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {/* Alert placeholder (success/error) */}
            <div className="rounded-md border px-4 py-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            </div>

            {action === "login" && (
              <div className="space-y-4">
                <FieldSkeleton labelWidth="w-12" />
                <FieldSkeleton labelWidth="w-16" />
                <Skeleton className="h-10 w-full rounded-md" />
                {/* Separator */}
                <div className="my-2">
                  <Skeleton className="h-px w-full" />
                </div>
                {/* AuthSwitcher */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            )}

            {action === "register" && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldSkeleton labelWidth="w-20" />
                  <FieldSkeleton labelWidth="w-20" />
                </div>
                <FieldSkeleton labelWidth="w-12" />
                <FieldSkeleton labelWidth="w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="my-2">
                  <Skeleton className="h-px w-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            )}

            {action === "forgot-password" && (
              <div className="space-y-4">
                <FieldSkeleton labelWidth="w-12" />
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="my-2">
                  <Skeleton className="h-px w-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            )}

            {action === "reset-password" && (
              <div className="space-y-4">
                <FieldSkeleton labelWidth="w-12" />
                {/* Hidden token field in real UI – we just show a tiny line */}
                <Skeleton className="h-3 w-24 rounded-md opacity-60" />
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldSkeleton labelWidth="w-24" />
                  <FieldSkeleton labelWidth="w-32" />
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
                <div className="my-2">
                  <Skeleton className="h-px w-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            )}

            {action === "logout" && (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
