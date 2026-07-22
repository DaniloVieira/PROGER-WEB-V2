"use client";

import { QueryProvider } from "@/components/providers";
import { AppHeader } from "@/components/layout/app-header";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Toaster } from "@/components/ui/sonner";

// ─── Standalone Programação Layout ───────────────────────────────────────────
// Provides auth, AppHeader, QueryProvider and Toaster WITHOUT the TabShell.
// Used by routes outside the (main) group (e.g., deep-linked /programacao/UHJA).

export default function ProgramacaoStandaloneLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { hydrated, isAuthenticated } = useRequireAuth();

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
		<QueryProvider>
			<div className="dark flex flex-col h-screen bg-[#090b0d] text-white">
				<AppHeader />
				<div className="flex-1 overflow-auto">{children}</div>
				<Toaster position="bottom-right" />
			</div>
		</QueryProvider>
	);
}
