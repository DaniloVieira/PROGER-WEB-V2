import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Auth Middleware ───────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get("proger_token")?.value;
	const isAuthenticated = Boolean(token);

	// Se está autenticado e tenta acessar login → redireciona para dashboard
	if (isAuthenticated && pathname === "/login") {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// Se não está autenticado e tenta acessar rota protegida → redireciona para login
	if (!isAuthenticated && pathname !== "/login") {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return NextResponse.next();
}

// ─── Matcher ─────────────────────────────────────────────────────────────────

export const config = {
	matcher: [
		"/",
		"/login",
		"/dashboard",
		"/configuracoes",
		"/programacao/:path*",
		"/p/:path*",
	],
};
