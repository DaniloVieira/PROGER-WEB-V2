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
import { useRouter } from "next/navigation";

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
		router.push(tab.path);
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
			className={cn(
				"group flex items-center gap-1 px-4 py-2 text-sm font-medium cursor-pointer border-b-2 transition-colors select-none",
				isActive
					? "border-[#5d9cec] text-[#5d9cec] bg-[#1a1d21]"
					: "border-transparent text-[#B4B4B5] hover:text-white hover:bg-[#1a1d21]",
				!tab.closable && "pr-4",
			)}
		>
			<span>{tab.title}</span>
			{tab.closable && (
				<button
					onClick={handleClose}
					className="ml-1 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[#303033] transition-opacity"
					aria-label={`Fechar aba ${tab.title}`}
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

export function TabShell({ children }: { children: React.ReactNode }) {
	const { tabs, reorderTabs } = useTabStore();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

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
