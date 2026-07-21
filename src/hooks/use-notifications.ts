import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import env from "@/lib/config";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notifications";

// ─── WebSocket Hook ──────────────────────────────────────────────────────────
// Connects to proger-api-gateway via Socket.IO with JWT auth.
// Listens for real-time events: programacao:publicada, restricao:violada, importacao:concluida.

interface UseNotificationsOptions {
	enabled?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
	const { enabled = true } = options;
	const socketRef = useRef<Socket | null>(null);
	const { token, isAuthenticated } = useAuthStore();
	const { addNotification } = useNotificationStore();

	const connect = useCallback(() => {
		if (!isAuthenticated || !token || !enabled) return;

		const socket = io(env.wsUrl, {
			auth: { token },
			transports: ["websocket"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		socket.on("connect", () => {
			console.log("[WS] Connected:", socket.id);
		});

		socket.on("programacao:publicada", (data) => {
			addNotification({
				type: "success",
				title: "Programação Publicada",
				message: `Programação ${data.cdProgramacao} — ${data.cdUsina} publicada com sucesso.`,
			});
		});

		socket.on("restricao:violada", (data) => {
			addNotification({
				type: "warning",
				title: "Restrição Violada",
				message: `Restrição violada para ${data.cdUsina}: ${data.tipo}`,
			});
		});

		socket.on("importacao:concluida", (data) => {
			addNotification({
				type: "info",
				title: "Importação Concluída",
				message: `Importação de dados ${data.tipo} concluída.`,
			});
		});

		socket.on("disconnect", (reason) => {
			console.log("[WS] Disconnected:", reason);
		});

		socketRef.current = socket;
	}, [isAuthenticated, token, enabled, addNotification]);

	const disconnect = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current = null;
		}
	}, []);

	useEffect(() => {
		connect();
		return () => disconnect();
	}, [connect, disconnect]);

	return { connect, disconnect };
}
