import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UsuarioInfo } from "@/types/api";

// ─── Cookie helpers ─────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days = 7) {
	const expires = new Date(Date.now() + days * 864e5).toUTCString();
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ─── Auth Store ─────────────────────────────────────────────────────────────

interface AuthState {
	token: string | null;
	user: UsuarioInfo | null;
	isAuthenticated: boolean;
	setAuth: (token: string, user: UsuarioInfo) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			user: null,
			isAuthenticated: false,
			setAuth: (token, user) => {
				localStorage.setItem("proger_token", token);
				setCookie("proger_token", token);
				set({ token, user, isAuthenticated: true });
			},
			logout: () => {
				localStorage.removeItem("proger_token");
				removeCookie("proger_token");
				set({ token: null, user: null, isAuthenticated: false });
			},
		}),
		{ name: "proger-auth" },
	),
);
