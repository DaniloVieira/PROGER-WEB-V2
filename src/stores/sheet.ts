import { create } from "zustand";
import type { ProgerSheetChange } from "@/components/sheet/proger-sheet-types";

// ─── Sheet Undo/Redo Store ───────────────────────────────────────────────────
// Dedicated Zustand slice for ProgerSheet undo/redo stacks.
// Each sheet instance is keyed by sheetId (e.g. cdUsina).

interface UndoRedoEntry {
	changes: ProgerSheetChange[];
}

interface PerSheetState {
	past: UndoRedoEntry[];
	future: UndoRedoEntry[];
}

interface SheetState {
	sheets: Record<string, PerSheetState>;
	pushUndo: (sheetId: string, changes: ProgerSheetChange[]) => void;
	undo: (sheetId: string) => ProgerSheetChange[] | null;
	redo: (sheetId: string) => ProgerSheetChange[] | null;
	clear: (sheetId: string) => void;
}

function inverseChanges(
	changes: ProgerSheetChange[],
): ProgerSheetChange[] {
	return changes.map((c) => ({
		...c,
		prevValue: c.nextValue,
		nextValue: c.prevValue,
	}));
}

export const useSheetStore = create<SheetState>()((set, get) => ({
	sheets: {},

	pushUndo: (sheetId, changes) => {
		set((state) => {
			const current = state.sheets[sheetId] ?? { past: [], future: [] };
			return {
				sheets: {
					...state.sheets,
					[sheetId]: {
						past: [...current.past, { changes }],
						future: [],
					},
				},
			};
		});
	},

	undo: (sheetId) => {
		const state = get().sheets[sheetId];
		if (!state || state.past.length === 0) return null;
		const entry = state.past[state.past.length - 1];
		set((s) => ({
			sheets: {
				...s.sheets,
				[sheetId]: {
					past: state.past.slice(0, -1),
					future: [...state.future, entry],
				},
			},
		}));
		return inverseChanges(entry.changes);
	},

	redo: (sheetId) => {
		const state = get().sheets[sheetId];
		if (!state || state.future.length === 0) return null;
		const entry = state.future[state.future.length - 1];
		set((s) => ({
			sheets: {
				...s.sheets,
				[sheetId]: {
					past: [...state.past, entry],
					future: state.future.slice(0, -1),
				},
			},
		}));
		return entry.changes;
	},

	clear: (sheetId) => {
		set((state) => {
			const next = { ...state.sheets };
			delete next[sheetId];
			return { sheets: next };
		});
	},
}));
