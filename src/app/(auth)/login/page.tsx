"use client";

import { QueryProvider } from "@/components/providers";
import { LoginPage } from "@/components/auth/login-page";

export default function LoginRoute() {
	return (
		<QueryProvider>
			<LoginPage />
		</QueryProvider>
	);
}
