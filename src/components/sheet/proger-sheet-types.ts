// ─── ProgerSheet Types ───────────────────────────────────────────────────────
// Reusable pure-HTML <table> grid for SPEC-004 Phase 3.
// Zero external grid libraries — all behaviour is hand-rolled.

export type ProgerSheetInputType = "number" | "text";

export interface ProgerSheetCellData {
	value: string | number;
	readOnly?: boolean;
	inputType?: ProgerSheetInputType;
	className?: string;
	stroke?: boolean;
	restricoes?: string[];
	isManual?: boolean;
	isOns?: boolean;
}

export interface ProgerSheetColumn {
	key: string;
	title: React.ReactNode;
	width?: string | number;
	inputType?: ProgerSheetInputType;
	readOnly?: boolean;
	align?: "left" | "center" | "right";
}

export interface ProgerSheetChange {
	row: number;
	col: number;
	prevValue: string | number;
	nextValue: string | number;
}

export interface ProgerSheetSelectedRange {
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
}

export interface ProgerSheetProps {
	data: ProgerSheetCellData[][];
	columns: ProgerSheetColumn[];
	sheetId?: string;
	className?: string;
	onCellsChanged?: (changes: ProgerSheetChange[]) => void;
	onSelect?: (range: ProgerSheetSelectedRange | null) => void;
	getCellClassName?: (cell: ProgerSheetCellData, row: number, col: number) => string;
	defaultInputType?: ProgerSheetInputType;
}
