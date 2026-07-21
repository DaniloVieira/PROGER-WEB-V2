import { create } from "zustand";

// ─── Notification Store ──────────────────────────────────────────────────────

export interface Notification {
	id: string;
	type: "info" | "success" | "warning" | "error";
	title: string;
	message: string;
	timestamp: Date;
	read: boolean;
}

interface NotificationState {
	notifications: Notification[];
	addNotification: (
		notification: Omit<Notification, "id" | "timestamp" | "read">,
	) => void;
	markAsRead: (id: string) => void;
	markAllAsRead: () => void;
	removeNotification: (id: string) => void;
	clearAll: () => void;
	unreadCount: () => number;
}

let counter = 0;

export const useNotificationStore = create<NotificationState>()((set, get) => ({
	notifications: [],

	addNotification: (notification) => {
		const id = `notif-${Date.now()}-${++counter}`;
		const newNotification: Notification = {
			...notification,
			id,
			timestamp: new Date(),
			read: false,
		};
		set((state) => ({
			notifications: [newNotification, ...state.notifications],
		}));
	},

	markAsRead: (id) => {
		set((state) => ({
			notifications: state.notifications.map((n) =>
				n.id === id ? { ...n, read: true } : n,
			),
		}));
	},

	markAllAsRead: () => {
		set((state) => ({
			notifications: state.notifications.map((n) => ({ ...n, read: true })),
		}));
	},

	removeNotification: (id) => {
		set((state) => ({
			notifications: state.notifications.filter((n) => n.id !== id),
		}));
	},

	clearAll: () => set({ notifications: [] }),

	unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
