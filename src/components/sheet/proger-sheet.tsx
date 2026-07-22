"use client";

import * as React from "react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSheetStore } from "@/stores/sheet";
import type {
	ProgerSheetCellData,
	ProgerSheetColumn,
	ProgerSheetChange,
	ProgerSheetSelectedRange,
	ProgerSheetProps,
	ProgerSheetInputType,
} from "./proger-sheet-types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatValue(value: string | number): string {
	if (typeof value === "number") {
		return new Intl.NumberFormat("pt-BR", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(value);
	}
	return String(value ?? "");
}

function parseValue(
	raw: string,
	inputType: ProgerSheetInputType,
	fallback: string | number,
): string | number {
	if (inputType === "number") {
		// pt-BR: dots are thousands separators, comma is decimal separator
		const cleaned = raw.replace(/\./g, "").replace(",", ".");
		const num = parseFloat(cleaned);
		return Number.isFinite(num) ? num : fallback;
	}
	return raw;
}

function getInputType(
	cell: ProgerSheetCellData | undefined,
	column: ProgerSheetColumn | undefined,
	defaultType: ProgerSheetInputType,
): ProgerSheetInputType {
	return cell?.inputType ?? column?.inputType ?? defaultType;
}

function inRange(
	row: number,
	col: number,
	range: ProgerSheetSelectedRange,
): boolean {
	const minRow = Math.min(range.startRow, range.endRow);
	const maxRow = Math.max(range.startRow, range.endRow);
	const minCol = Math.min(range.startCol, range.endCol);
	const maxCol = Math.max(range.startCol, range.endCol);
	return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
}

function isPrintableKey(e: React.KeyboardEvent): boolean {
	return (
		e.key.length === 1 &&
		!e.ctrlKey &&
		!e.metaKey &&
		!e.altKey &&
		!e.key.startsWith("Arrow") &&
		e.key !== "Tab" &&
		e.key !== "Enter" &&
		e.key !== "Escape"
	);
}

type Direction = "up" | "down" | "left" | "right";

// ─── Component ───────────────────────────────────────────────────────────────

export function ProgerSheet({
	data,
	columns = [],
	sheetId = "default",
	className,
	onCellsChanged,
	onSelect,
	getCellClassName,
	defaultInputType = "number",
}: ProgerSheetProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const [selectedRange, setSelectedRange] =
		useState<ProgerSheetSelectedRange | null>(null);
	const [editingCell, setEditingCell] = useState<{
		row: number;
		col: number;
	} | null>(null);
	const [editValue, setEditValue] = useState("");

	// Drag state kept in refs so mouse handlers are stable
	const dragStateRef = useRef({
		isSelecting: false,
		shiftKey: false,
		range: null as ProgerSheetSelectedRange | null,
	});

	const pushUndo = useSheetStore((s) => s.pushUndo);
	const undo = useSheetStore((s) => s.undo);
	const redo = useSheetStore((s) => s.redo);

	// Keep mutable refs to latest props for event handlers
	const dataRef = useRef(data);
	const onCellsChangedRef = useRef(onCellsChanged);
	const columnsRef = useRef(columns);
	const defaultInputTypeRef = useRef(defaultInputType);
	const getCellClassNameRef = useRef(getCellClassName);
	const sheetIdRef = useRef(sheetId);

	useEffect(() => {
		dataRef.current = data;
	}, [data]);
	useEffect(() => {
		onCellsChangedRef.current = onCellsChanged;
	}, [onCellsChanged]);
	useEffect(() => {
		columnsRef.current = columns;
	}, [columns]);
	useEffect(() => {
		defaultInputTypeRef.current = defaultInputType;
	}, [defaultInputType]);
	useEffect(() => {
		getCellClassNameRef.current = getCellClassName;
	}, [getCellClassName]);
	useEffect(() => {
		sheetIdRef.current = sheetId;
	}, [sheetId]);

	// Auto-focus input when editing starts
	useEffect(() => {
		if (editingCell && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editingCell]);

	const activeCell = useMemo(() => {
		if (!selectedRange) return null;
		return { row: selectedRange.startRow, col: selectedRange.startCol };
	}, [selectedRange]);

	const startEdit = useCallback(
		(row: number, col: number, initialChar?: string) => {
			const cell = dataRef.current[row]?.[col];
			if (!cell || cell.readOnly) return;
			setEditingCell({ row, col });
			setEditValue(
				initialChar !== undefined
					? initialChar
					: String(cell.value ?? ""),
			);
		},
		[],
	);

	const confirmEdit = useCallback(() => {
		if (!editingCell) return;
		const { row, col } = editingCell;
		const cell = dataRef.current[row]?.[col];
		if (!cell || cell.readOnly) {
			setEditingCell(null);
			setEditValue("");
			return;
		}

		const inputType = getInputType(
			cell,
			columnsRef.current[col],
			defaultInputTypeRef.current,
		);
		const nextValue = parseValue(editValue, inputType, cell.value);
		const prevValue = cell.value;

		if (nextValue !== prevValue) {
			const change: ProgerSheetChange = {
				row,
				col,
				prevValue,
				nextValue,
			};
			pushUndo(sheetIdRef.current, [change]);
			onCellsChangedRef.current?.([change]);
		}

		setEditingCell(null);
		setEditValue("");
	}, [editingCell, editValue, pushUndo]);

	const cancelEdit = useCallback(() => {
		setEditingCell(null);
		setEditValue("");
	}, []);

	const clearSelectedCells = useCallback(() => {
		if (!selectedRange) return;
		const minRow = Math.min(selectedRange.startRow, selectedRange.endRow);
		const maxRow = Math.max(selectedRange.startRow, selectedRange.endRow);
		const minCol = Math.min(selectedRange.startCol, selectedRange.endCol);
		const maxCol = Math.max(selectedRange.startCol, selectedRange.endCol);

		const changes: ProgerSheetChange[] = [];
		for (let r = minRow; r <= maxRow; r++) {
			for (let c = minCol; c <= maxCol; c++) {
				const cell = dataRef.current[r]?.[c];
				if (cell && !cell.readOnly) {
					const inputType = getInputType(
						cell,
						columnsRef.current[c],
						defaultInputTypeRef.current,
					);
					const emptyValue = inputType === "number" ? 0 : "";
					if (cell.value !== emptyValue) {
						changes.push({
							row: r,
							col: c,
							prevValue: cell.value,
							nextValue: emptyValue,
						});
					}
				}
			}
		}
		if (changes.length > 0) {
			pushUndo(sheetIdRef.current, changes);
			onCellsChangedRef.current?.(changes);
		}
	}, [selectedRange, pushUndo]);

	const handleUndo = useCallback(() => {
		if (editingCell) return;
		const inverseChanges = undo(sheetIdRef.current);
		if (inverseChanges && inverseChanges.length > 0) {
			onCellsChangedRef.current?.(inverseChanges);
		}
	}, [editingCell, undo]);

	const handleRedo = useCallback(() => {
		if (editingCell) return;
		const changes = redo(sheetIdRef.current);
		if (changes && changes.length > 0) {
			onCellsChangedRef.current?.(changes);
		}
	}, [editingCell, redo]);

	const handleCopy = useCallback(() => {
		if (!selectedRange) return;
		const minRow = Math.min(selectedRange.startRow, selectedRange.endRow);
		const maxRow = Math.max(selectedRange.startRow, selectedRange.endRow);
		const minCol = Math.min(selectedRange.startCol, selectedRange.endCol);
		const maxCol = Math.max(selectedRange.startCol, selectedRange.endCol);

		const rows: string[] = [];
		for (let r = minRow; r <= maxRow; r++) {
			const cols: string[] = [];
			for (let c = minCol; c <= maxCol; c++) {
				const cell = dataRef.current[r]?.[c];
				cols.push(cell !== undefined ? String(cell.value ?? "") : "");
			}
			rows.push(cols.join("\t"));
		}
		const tsv = rows.join("\n");

		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard.writeText(tsv).catch(() => {});
		}
	}, [selectedRange]);

	const handlePaste = useCallback(
		(tsv: string) => {
			if (!selectedRange) return;
			const lines = tsv.split(/\r?\n/).filter((l) => l.length > 0);
			if (lines.length === 0) return;

			const startRow = selectedRange.startRow;
			const startCol = selectedRange.startCol;

			const changes: ProgerSheetChange[] = [];
			for (let r = 0; r < lines.length; r++) {
				const cells = lines[r].split("\t");
				for (let c = 0; c < cells.length; c++) {
					const targetRow = startRow + r;
					const targetCol = startCol + c;
					const cell = dataRef.current[targetRow]?.[targetCol];
					if (cell && !cell.readOnly) {
						const inputType = getInputType(
							cell,
							columnsRef.current[targetCol],
							defaultInputTypeRef.current,
						);
						const nextValue = parseValue(cells[c], inputType, cell.value);
						if (nextValue !== cell.value) {
							changes.push({
								row: targetRow,
								col: targetCol,
								prevValue: cell.value,
								nextValue,
							});
						}
					}
				}
			}
			if (changes.length > 0) {
				pushUndo(sheetIdRef.current, changes);
				onCellsChangedRef.current?.(changes);
			}
		},
		[selectedRange, pushUndo],
	);

	const moveSelection = useCallback(
		(dir: Direction) => {
			if (!activeCell) return;
			let { row, col } = activeCell;
			const maxRow = dataRef.current.length - 1;
			const maxCol = (dataRef.current[0]?.length ?? 0) - 1;

			switch (dir) {
				case "up":
					row = Math.max(0, row - 1);
					break;
				case "down":
					row = Math.min(maxRow, row + 1);
					break;
				case "left":
					col = Math.max(0, col - 1);
					break;
				case "right":
					col = Math.min(maxCol, col + 1);
					break;
			}

			const newRange: ProgerSheetSelectedRange = {
				startRow: row,
				startCol: col,
				endRow: row,
				endCol: col,
			};
			setSelectedRange(newRange);
			onSelect?.(newRange);
		},
		[activeCell, onSelect],
	);

	// ── Mouse handlers for range selection ───────────────────────────────────

	const handleStartSelection = useCallback(
		(row: number, col: number, shiftKey: boolean) => {
			dragStateRef.current = {
				isSelecting: true,
				shiftKey,
				range: { startRow: row, startCol: col, endRow: row, endCol: col },
			};
			const newRange = dragStateRef.current.range!;
			setSelectedRange(newRange);
			onSelect?.(newRange);
			wrapperRef.current?.focus();
		},
		[onSelect],
	);

	const handleUpdateSelection = useCallback((row: number, col: number) => {
		if (!dragStateRef.current.isSelecting) return;
		const prev = dragStateRef.current.range;
		if (!prev) return;
		const next = { ...prev, endRow: row, endCol: col };
		dragStateRef.current.range = next;
		setSelectedRange(next);
		onSelect?.(next);
	}, [onSelect]);

	const handleEndSelection = useCallback(() => {
		if (!dragStateRef.current.isSelecting) return;
		dragStateRef.current.isSelecting = false;

		const range = dragStateRef.current.range;
		if (range && dragStateRef.current.shiftKey) {
			const startRow = Math.min(range.startRow, range.endRow);
			const endRow = Math.max(range.startRow, range.endRow);
			const startCol = Math.min(range.startCol, range.endCol);
			const endCol = Math.max(range.startCol, range.endCol);
			const sourceCell =
				dataRef.current[range.startRow]?.[range.startCol];

			if (sourceCell) {
				const changes: ProgerSheetChange[] = [];
				for (let r = startRow; r <= endRow; r++) {
					for (let c = startCol; c <= endCol; c++) {
						if (
							r === range.startRow &&
							c === range.startCol
						)
							continue;
						const target = dataRef.current[r]?.[c];
						if (target && !target.readOnly) {
							changes.push({
								row: r,
								col: c,
								prevValue: target.value,
								nextValue: sourceCell.value,
							});
						}
					}
				}
				if (changes.length > 0) {
					pushUndo(sheetIdRef.current, changes);
					onCellsChangedRef.current?.(changes);
				}
			}
		}
		dragStateRef.current.shiftKey = false;
	}, [pushUndo]);

	// Global mouse-up to end drag
	useEffect(() => {
		const onMouseUp = () => handleEndSelection();
		window.addEventListener("mouseup", onMouseUp);
		return () => window.removeEventListener("mouseup", onMouseUp);
	}, [handleEndSelection]);

	// ── Keyboard handler on wrapper ─────────────────────────────────────────

	const handleWrapperKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (editingCell) {
				if (e.key === "Enter") {
					e.preventDefault();
					confirmEdit();
				} else if (e.key === "Escape") {
					e.preventDefault();
					cancelEdit();
				} else if (e.key === "Tab") {
					e.preventDefault();
					confirmEdit();
					moveSelection(e.shiftKey ? "left" : "right");
				}
				return;
			}

			if (e.ctrlKey || e.metaKey) {
				if (e.key === "z" && !e.shiftKey) {
					e.preventDefault();
					handleUndo();
				} else if (
					(e.key === "z" && e.shiftKey) ||
					e.key === "y"
				) {
					e.preventDefault();
					handleRedo();
				} else if (e.key === "c") {
					e.preventDefault();
					handleCopy();
				} else if (e.key === "v") {
					e.preventDefault();
					if (navigator.clipboard && window.isSecureContext) {
						navigator.clipboard
							.readText()
							.then((text) => {
								handlePaste(text);
							})
							.catch(() => {});
					}
				}
				return;
			}

			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				clearSelectedCells();
				return;
			}

			if (
				["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
					e.key,
				)
			) {
				e.preventDefault();
				moveSelection(
					e.key.replace("Arrow", "").toLowerCase() as Direction,
				);
				return;
			}

			if (isPrintableKey(e) && activeCell) {
				const cell = dataRef.current[activeCell.row]?.[activeCell.col];
				if (cell && !cell.readOnly) {
					e.preventDefault();
					startEdit(activeCell.row, activeCell.col, e.key);
				}
			}
		},
		[
			editingCell,
			activeCell,
			confirmEdit,
			cancelEdit,
			moveSelection,
			handleUndo,
			handleRedo,
			handleCopy,
			handlePaste,
			clearSelectedCells,
			startEdit,
		],
	);

	// ── Native clipboard events (primary) ───────────────────────────────────

	const handleCopyEvent = useCallback(
		(e: React.ClipboardEvent) => {
			if (!selectedRange) return;
			e.preventDefault();
			const minRow = Math.min(
				selectedRange.startRow,
				selectedRange.endRow,
			);
			const maxRow = Math.max(
				selectedRange.startRow,
				selectedRange.endRow,
			);
			const minCol = Math.min(
				selectedRange.startCol,
				selectedRange.endCol,
			);
			const maxCol = Math.max(
				selectedRange.startCol,
				selectedRange.endCol,
			);

			const rows: string[] = [];
			for (let r = minRow; r <= maxRow; r++) {
				const cols: string[] = [];
				for (let c = minCol; c <= maxCol; c++) {
					const cell = dataRef.current[r]?.[c];
					cols.push(
						cell !== undefined ? String(cell.value ?? "") : "",
					);
				}
				rows.push(cols.join("\t"));
			}
			e.clipboardData.setData("text/plain", rows.join("\n"));
		},
		[selectedRange],
	);

	const handlePasteEvent = useCallback(
		(e: React.ClipboardEvent) => {
			if (!selectedRange) return;
			e.preventDefault();
			const tsv = e.clipboardData.getData("text/plain");
			handlePaste(tsv);
		},
		[selectedRange, handlePaste],
	);

	// ── Render ──────────────────────────────────────────────────────────────

	return (
		<div
			ref={wrapperRef}
			tabIndex={0}
			className={`outline-none select-none ${className ?? ""}`}
			onKeyDown={handleWrapperKeyDown}
			onCopy={handleCopyEvent}
			onPaste={handlePasteEvent}
			style={{ cursor: "cell" }}
		>
			<table className="border-collapse w-full text-xs font-mono">
				<thead>
					<tr className="bg-[#303033] text-white">
						{columns.map((col, i) => (
							<th
								key={col.key ?? i}
								className="px-2 py-1 border border-[#444] text-center whitespace-nowrap"
								style={{ width: col.width }}
							>
								{col.title}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.map((row, rowIndex) => (
						<tr
							key={rowIndex}
							className={
								rowIndex % 2 === 0
									? "bg-[#1a1d21]"
									: "bg-[#222224]"
							}
						>
							{row.map((cell, colIndex) => {
								const isEditing =
									editingCell?.row === rowIndex &&
									editingCell?.col === colIndex;
								const isSelected = selectedRange
									? inRange(rowIndex, colIndex, selectedRange)
									: false;
								const inputType = getInputType(
									cell,
									columns[colIndex],
									defaultInputType,
								);

								const extraClasses =
									getCellClassName?.(cell, rowIndex, colIndex) ??
									"";

								return (
									<td
										key={colIndex}
										className={[
											"px-2 py-1 border border-[#444] relative",
											cell?.readOnly
												? "text-gray-400 cursor-default"
												: "text-white cursor-cell",
											isSelected
												? "bg-blue-900/40"
												: "",
											cell?.className ?? "",
											extraClasses,
										].join(" ")}
										style={{
											borderLeft: cell?.stroke
												? "2px solid #C4C4C4"
												: undefined,
										}}
										onMouseDown={(e) => {
											e.preventDefault();
											handleStartSelection(
												rowIndex,
												colIndex,
												e.shiftKey,
											);
										}}
										onMouseEnter={() =>
											handleUpdateSelection(
												rowIndex,
												colIndex,
											)
										}
										onDoubleClick={() => {
											if (!cell?.readOnly) {
												startEdit(rowIndex, colIndex);
											}
										}}
									>
										{isEditing ? (
											<input
												ref={inputRef}
												type="text"
												value={editValue}
												onChange={(e) =>
													setEditValue(e.target.value)
												}
												onKeyDown={(e) => {
													if (
														inputType === "number"
													) {
														const allowed =
															/[0-9,.-]/;
														if (
															e.key.length === 1 &&
															!allowed.test(
																e.key,
															)
														) {
															e.preventDefault();
														}
													}
													if (
														e.key === "Enter"
													) {
														e.preventDefault();
														confirmEdit();
													} else if (
														e.key === "Escape"
													) {
														e.preventDefault();
														cancelEdit();
													}
												}}
												onBlur={confirmEdit}
												className="w-full h-full bg-white text-black px-1 py-0.5 outline-none"
												inputMode={
													inputType === "number"
														? "decimal"
														: "text"
												}
											/>
										) : (
											<span
												className={
													cell?.readOnly
														? "italic opacity-60"
														: ""
												}
											>
												{formatValue(cell?.value ?? "")}
											</span>
										)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
