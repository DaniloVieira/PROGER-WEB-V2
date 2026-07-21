import axios from "axios";
import env from "./config";

// ─── Axios instance for PROGER API Gateway ──────────────────────────────────

const api = axios.create({
	baseURL: env.apiGatewayUrl,
	headers: { "Content-Type": "application/json" },
	timeout: 30_000,
});

// ─── Request interceptor: attach JWT ────────────────────────────────────────
api.interceptors.request.use((config) => {
	if (typeof window !== "undefined") {
		const token = localStorage.getItem("proger_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	}
	return config;
});

// ─── Response interceptor: handle 401 ────────────────────────────────────────
// NÃO redireciona automaticamente — deixa o componente que fez a requisição
// decidir como lidar com o erro (ex: toast, redirect, retry).
// O interceptor apenas limpa o token para forçar re-autenticação.
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401 && typeof window !== "undefined") {
			localStorage.removeItem("proger_token");
		}
		return Promise.reject(error);
	},
);

export default api;
