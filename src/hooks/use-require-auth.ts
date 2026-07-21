"use client";

import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Auth Guard ──────────────────────────────────────────────────────────────
// Redirects to /login if user is not authenticated.

export function useRequireAuth() {
	const { isAuthenticated } = useAuthStore();
	const router = useRouter();
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (hydrated && !isAuthenticated) {
			router.replace("/login");
		}
	}, [hydrated, isAuthenticated, router]);

	return { isAuthenticated, hydrated };
}
