"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProgerSkeletonProps {
	className?: string;
}

export function ProgerSkeleton({ className }: ProgerSkeletonProps) {
	return <Skeleton className={cn("bg-[#303033]", className)} />;
}
