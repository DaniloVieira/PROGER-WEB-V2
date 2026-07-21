"use client";

import { QueryProvider } from "@/components/providers";
import { MainLayout } from "@/components/layout/main-layout";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<QueryProvider>
			<MainLayout>{children}</MainLayout>
		</QueryProvider>
	);
}
