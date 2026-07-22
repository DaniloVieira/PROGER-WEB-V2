import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Tab Store ───────────────────────────────────────────────────────────────
// Manages dynamic tabs in the Tab Shell.
// Maximum 8 dynamic tabs (excluding Dashboard which is always present).
// State persists to URL query params (?tabs=UHJA,UHCC&active=UHJA)
// and to localStorage via Zustand persist middleware (secondary cache).

export interface Tab {
	id: string;
	title: string;
	path: string;
	closable: boolean; // Dashboard tab is not closable
	dirty?: boolean; // Indica dados não salvos na aba
}

const MAX_DYNAMIC_TABS = 8;

interface TabState {
	tabs: Tab[];
	activeTabId: string;
	addTab: (tab: Omit<Tab, "closable" | "dirty">) => void;
	removeTab: (id: string) => void;
	setActiveTab: (id: string) => void;
	reorderTabs: (fromIndex: number, toIndex: number) => void;
	setTabDirty: (id: string, dirty: boolean) => void;
	getTabsFromUrl: () => { tabs: Tab[]; activeTabId: string } | null;
	syncToUrl: () => void;
}

const DASHBOARD_TAB: Tab = {
	id: "dashboard",
	title: "🏠 Dashboard",
	path: "/dashboard",
	closable: false,
};

function buildDynamicTab(tab: Omit<Tab, "closable" | "dirty">): Tab {
	return { ...tab, closable: true, dirty: false };
}

function getDefaultPathForTabId(id: string): string {
	if (id === "dashboard") return "/dashboard";
	if (id === "configuracoes") return "/configuracoes";
	return `/programacao/${id}`;
}

export const useTabStore = create<TabState>()(
	persist(
		(set, get) => ({
			tabs: [DASHBOARD_TAB],
			activeTabId: "dashboard",

			addTab: (tab) => {
				const { tabs, syncToUrl } = get();
				const existing = tabs.find((t) => t.id === tab.id);
				if (existing) {
					set({ activeTabId: tab.id });
					syncToUrl();
					return;
				}

				const dynamicTabs = tabs.filter((t) => t.closable);
				if (dynamicTabs.length >= MAX_DYNAMIC_TABS) {
					// Replace the oldest dynamic tab
					const newTabs = [
						DASHBOARD_TAB,
						...dynamicTabs
							.slice(1)
							.map((t) => ({ ...t, dirty: t.dirty ?? false })),
						buildDynamicTab(tab),
					];
					set({ tabs: newTabs, activeTabId: tab.id });
				} else {
					set({
						tabs: [...tabs, buildDynamicTab(tab)],
						activeTabId: tab.id,
					});
				}
				syncToUrl();
			},

			removeTab: (id) => {
				const { tabs, activeTabId, syncToUrl } = get();
				if (id === "dashboard") return;

				const newTabs = tabs.filter((t) => t.id !== id);
				const newActive =
					activeTabId === id
						? newTabs[newTabs.length - 1]?.id || "dashboard"
						: activeTabId;

				set({ tabs: newTabs, activeTabId: newActive });
				syncToUrl();
			},

			setActiveTab: (id) => {
				set({ activeTabId: id });
				get().syncToUrl();
			},

			reorderTabs: (fromIndex, toIndex) => {
				// Dashboard (index 0) is always fixed
				if (fromIndex === 0 || toIndex === 0) return;

				const { tabs, syncToUrl } = get();
				const newTabs = [...tabs];
				const [moved] = newTabs.splice(fromIndex, 1);
				newTabs.splice(toIndex, 0, moved);
				set({ tabs: newTabs });
				syncToUrl();
			},

			setTabDirty: (id, dirty) => {
				const { tabs } = get();
				const newTabs = tabs.map((t) =>
					t.id === id ? { ...t, dirty } : t,
				);
				set({ tabs: newTabs });
			},

			getTabsFromUrl: () => {
				if (typeof window === "undefined") return null;

				const params = new URLSearchParams(window.location.search);
				const tabsParam = params.get("tabs");
				const activeParam = params.get("active");

				if (!tabsParam) return null;

				const dynamicIds = tabsParam.split(",").filter(Boolean);
				if (dynamicIds.length === 0) return null;

				const dynamicTabs = dynamicIds.map((id) => ({
					id,
					title: id,
					path: getDefaultPathForTabId(id),
					closable: true as const,
					dirty: false,
				}));

				const tabs = [DASHBOARD_TAB, ...dynamicTabs];
				const activeTabId =
					activeParam && dynamicIds.includes(activeParam)
						? activeParam
						: dynamicIds[0];

				return { tabs, activeTabId };
			},

			syncToUrl: () => {
				if (typeof window === "undefined") return;

				const { tabs, activeTabId } = get();
				const dynamicTabs = tabs
					.filter((t) => t.closable)
					.map((t) => t.id);

				const params = new URLSearchParams(window.location.search);
				if (dynamicTabs.length > 0) {
					params.set("tabs", dynamicTabs.join(","));
					params.set("active", activeTabId);
				} else {
					params.delete("tabs");
					params.delete("active");
				}

				const query = params.toString();
				const newUrl = `${window.location.pathname}${
					query ? `?${query}` : ""
				}`;
				window.history.replaceState({}, "", newUrl);
			},
		}),
		{ name: "proger-tabs" },
	),
);
