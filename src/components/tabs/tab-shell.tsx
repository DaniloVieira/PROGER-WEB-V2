"use client";

import { useTabStore, type Tab } from "@/stores/tabs";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	horizontalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";

// ─── Sortable Tab Item ───────────────────────────────────────────────────────

function SortableTab({ tab }: { tab: Tab }) {
	const { activeTabId, setActiveTab, removeTab } = useTabStore();
	const router = useRouter();
	const isActive = activeTabId === tab.id;

	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: tab.id, disabled: !tab.closable });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const handleClick = () => {
		setActiveTab(tab.id);
		const params = new URLSearchParams(window.location.search);
		const query = params.toString();
		router.push(`${tab.path}${query ? `?${query}` : ""}`);
	};

	const handleClose = (e: React.MouseEvent) => {
		e.stopPropagation();
		removeTab(tab.id);
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			onClick={handleClick}
			role="tab"
			aria-selected={isActive}
			aria-label={tab.title}
			className={cn(
				"group flex items-center gap-1 px-4 py-2 text-sm font-medium cursor-pointer border-b-2 transition-colors select-none",
				isActive
					? "border-[#5d9cec] text-[#5d9cec] bg-[#1a1d21]"
					: "border-transparent text-[#B4B4B5] hover:text-white hover:bg-[#1a1d21]",
				!tab.closable && "pr-4",
			)}
		>
			<span className="flex items-center gap-1.5">
				{tab.dirty && (
					<span className="text-orange-400 text-xs" aria-hidden="true">
						●
					</span>
				)}
				<span>{tab.title}</span>
			</span>
			{tab.closable && (
				<button
					onClick={handleClose}
					className="ml-1 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[#303033] transition-opacity"
					aria-label={`Fechar aba ${tab.title}`}
					type="button"
				>
					<X className="h-3 w-3" />
				</button>
			)}
		</div>
	);
}

// ─── Tab Shell ────────────────────────────────────────────────────────────────
// Dynamic tab navigation with drag-and-drop reordering.
// Dashboard tab is always first and cannot be closed.
// Maximum 8 dynamic tabs.
// State persists to URL query params (?tabs=&active=).

export function TabShell({ children }: { children: React.ReactNode }) {
	const {
		tabs,
		activeTabId,
		reorderTabs,
		getTabsFromUrl,
		setActiveTab,
		addTab,
	} = useTabStore();
	const pathname = usePathname();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);
	const hasRestored = useRef(false);

	// 1. Restore tab state from URL on mount; if direct link to /programacao/[cdUsina],
	// auto-open that usina as a tab.
	useEffect(() => {
		if (hasRestored.current) return;
		hasRestored.current = true;

		const urlState = getTabsFromUrl();
		if (urlState) {
			useTabStore.setState({
				tabs: urlState.tabs,
				activeTabId: urlState.activeTabId,
			});
			return;
		}

		const match = pathname.match(/^\/programacao\/([^/]+)$/);
		if (match) {
			const cdUsina = match[1];
			const state = useTabStore.getState();
			const exists = state.tabs.find((t) => t.id === cdUsina);
			if (!exists) {
				state.addTab({
					id: cdUsina,
					title: cdUsina,
					path: `/programacao/${cdUsina}`,
				});
			} else if (state.activeTabId !== cdUsina) {
				state.setActiveTab(cdUsina);
			}
		}
	}, [pathname, getTabsFromUrl, addTab, setActiveTab]);

	// 2. Sync tab state to URL whenever tabs or active tab change.
	useEffect(() => {
		useTabStore.getState().syncToUrl();
	}, [tabs, activeTabId]);

	// 3. Keyboard shortcut: Ctrl+W closes the active dynamic tab.
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.ctrlKey && e.key === "w") {
				e.preventDefault();
				const state = useTabStore.getState();
				const active = state.tabs.find((t) => t.id === state.activeTabId);
				if (active?.closable) {
					state.removeTab(state.activeTabId);
				}
			}
		},
		[],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const fromIndex = tabs.findIndex((t) => t.id === active.id);
		const toIndex = tabs.findIndex((t) => t.id === over.id);
		if (fromIndex !== -1 && toIndex !== -1) {
			reorderTabs(fromIndex, toIndex);
		}
	};

	return (
		<div className="flex flex-col h-full">
			{/* Tab bar */}
			<div className="flex border-b border-[#303033] bg-[#090b0d] overflow-x-auto">
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={tabs.map((t) => t.id)}
						strategy={horizontalListSortingStrategy}
					>
						{tabs.map((tab) => (
							<SortableTab key={tab.id} tab={tab} />
						))}
					</SortableContext>
				</DndContext>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
