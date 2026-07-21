import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Tab Store ───────────────────────────────────────────────────────────────
// Manages dynamic tabs in the Tab Shell.
// Maximum 8 dynamic tabs (excluding Dashboard which is always present).

export interface Tab {
	id: string;
	title: string;
	path: string;
	closable: boolean; // Dashboard tab is not closable
}

const MAX_DYNAMIC_TABS = 8;

interface TabState {
	tabs: Tab[];
	activeTabId: string;
	addTab: (tab: Omit<Tab, "closable">) => void;
	removeTab: (id: string) => void;
	setActiveTab: (id: string) => void;
	reorderTabs: (fromIndex: number, toIndex: number) => void;
}

const DASHBOARD_TAB: Tab = {
	id: "dashboard",
	title: "🏠 Dashboard",
	path: "/dashboard",
	closable: false,
};

export const useTabStore = create<TabState>()(
	persist(
		(set, get) => ({
			tabs: [DASHBOARD_TAB],
			activeTabId: "dashboard",

			addTab: (tab) => {
				const { tabs } = get();
				const existing = tabs.find((t) => t.id === tab.id);
				if (existing) {
					set({ activeTabId: tab.id });
					return;
				}

				const dynamicTabs = tabs.filter((t) => t.closable);
				if (dynamicTabs.length >= MAX_DYNAMIC_TABS) {
					// Replace the oldest dynamic tab
					const newTabs = [
						DASHBOARD_TAB,
						...dynamicTabs.slice(1),
						{ ...tab, closable: true },
					];
					set({ tabs: newTabs, activeTabId: tab.id });
				} else {
					set({
						tabs: [...tabs, { ...tab, closable: true }],
						activeTabId: tab.id,
					});
				}
			},

			removeTab: (id) => {
				const { tabs, activeTabId } = get();
				if (id === "dashboard") return;

				const newTabs = tabs.filter((t) => t.id !== id);
				const newActive =
					activeTabId === id
						? newTabs[newTabs.length - 1]?.id || "dashboard"
						: activeTabId;

				set({ tabs: newTabs, activeTabId: newActive });
			},

			setActiveTab: (id) => set({ activeTabId: id }),

			reorderTabs: (fromIndex, toIndex) => {
				// Dashboard (index 0) is always fixed
				if (fromIndex === 0 || toIndex === 0) return;

				const { tabs } = get();
				const newTabs = [...tabs];
				const [moved] = newTabs.splice(fromIndex, 1);
				newTabs.splice(toIndex, 0, moved);
				set({ tabs: newTabs });
			},
		}),
		{ name: "proger-tabs" },
	),
);
