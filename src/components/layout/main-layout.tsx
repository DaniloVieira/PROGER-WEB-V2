"use client";

import { useNotificationStore } from "@/stores/notifications";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { AppHeader } from "@/components/layout/app-header";
import { TabShell } from "@/components/tabs/tab-shell";
import { Toaster } from "@/components/ui/sonner";

// ─── Main Layout ─────────────────────────────────────────────────────────────
// Authenticated layout with header, tab shell, and notifications.

export function MainLayout({ children }: { children: React.ReactNode }) {
	const { hydrated, isAuthenticated } = useRequireAuth();
	useNotifications({ enabled: isAuthenticated });
	useNotificationStore(); // ensure reactivity

	if (!hydrated) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return null; // will redirect via useRequireAuth
	}

	return (
		<div className="dark flex flex-col h-screen bg-[#090b0d] text-white">
			<AppHeader />
			<TabShell>{children}</TabShell>
			<Toaster position="bottom-right" />
		</div>
	);
}
