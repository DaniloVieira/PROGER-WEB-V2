"use client";

import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
	ColDef,
	GridReadyEvent,
	CellValueChangedEvent,
} from "ag-grid-community";
import {
	ModuleRegistry,
	ClientSideRowModelModule,
	CsvExportModule,
} from "ag-grid-community";
import {
	EnterpriseCoreModule,
	RowGroupingModule,
	ExcelExportModule,
	RangeSelectionModule,
	ClipboardModule,
	SetFilterModule,
	MultiFilterModule,
	SideBarModule,
	StatusBarModule,
	RichSelectModule,
} from "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { DadoProgramacao } from "@/types/api";

// Register AG Grid modules (community + enterprise features)
ModuleRegistry.registerModules([
	ClientSideRowModelModule,
	CsvExportModule,
	EnterpriseCoreModule,
	RowGroupingModule,
	ExcelExportModule,
	RangeSelectionModule,
	ClipboardModule,
	SetFilterModule,
	MultiFilterModule,
	SideBarModule,
	StatusBarModule,
	RichSelectModule,
]);

// ─── ProgerGrid ──────────────────────────────────────────────────────────────
// Excel-like grid for programação horária with inline editing,
// keyboard navigation, cell validation, and CSV/Excel export.

interface ProgerGridProps {
	data: DadoProgramacao[];
	onDataChange?: (data: DadoProgramacao[]) => void;
	readOnly?: boolean;
}

export function ProgerGrid({
	data,
	onDataChange,
	readOnly = false,
}: ProgerGridProps) {
	const gridRef = useRef<AgGridReact>(null);

	const defaultColDef = useMemo<ColDef>(
		() => ({
			sortable: true,
			filter: true,
			resizable: true,
			editable: !readOnly,
			flex: 1,
			minWidth: 100,
		}),
		[readOnly],
	);

	const columnDefs = useMemo(
		() =>
			[
				{
					headerName: "Hora",
					field: "hora",
					editable: false,
					flex: 0,
					width: 80,
					minWidth: 70,
					cellStyle: {
						textAlign: "center" as const,
						fontWeight: "bold" as const,
					},
					valueFormatter: (params: { value: unknown }) =>
						`${String(params.value).padStart(2, "0")}h`,
				},
				{
					headerName: "Vazão Turbinada (m³/s)",
					field: "vazaoTurbinada",
					cellEditor: "agNumberCellEditor",
					cellEditorParams: { min: 0, precision: 1 },
					type: "numericColumn",
				},
				{
					headerName: "Vazão Defluente (m³/s)",
					field: "vazaoDefluente",
					cellEditor: "agNumberCellEditor",
					cellEditorParams: { min: 0, precision: 1 },
					type: "numericColumn",
				},
				{
					headerName: "Vazão Afluente (m³/s)",
					field: "vazaoAfluente",
					cellEditor: "agNumberCellEditor",
					cellEditorParams: { min: 0, precision: 1 },
					type: "numericColumn",
				},
				{
					headerName: "Nível Reservatório (m)",
					field: "nivelReservatorio",
					cellEditor: "agNumberCellEditor",
					cellEditorParams: { min: 0, precision: 2 },
					type: "numericColumn",
				},
				{
					headerName: "Volume (%)",
					field: "volume",
					cellEditor: "agNumberCellEditor",
					cellEditorParams: { min: 0, max: 100, precision: 1 },
					type: "numericColumn",
					valueFormatter: (params: { value: number | null }) =>
						`${params.value?.toFixed(1)}%`,
				},
				{
					headerName: "Geração (MW)",
					field: "geracao",
					editable: false,
					type: "numericColumn",
					cellStyle: {
						textAlign: "right" as const,
						backgroundColor: "#f0f4ff",
					},
					valueFormatter: (params: { value: number | null }) =>
						params.value?.toFixed(2) ?? "-",
				},
			] as ColDef[],
		[],
	);

	const onGridReady = useCallback((params: GridReadyEvent) => {
		params.api.sizeColumnsToFit();
	}, []);

	const onCellValueChanged = useCallback(
		(event: CellValueChangedEvent) => {
			if (onDataChange && event.data) {
				const updatedData: DadoProgramacao[] = [];
				event.api.forEachNode((node) => {
					updatedData.push(node.data);
				});
				onDataChange(updatedData);
			}
		},
		[onDataChange],
	);

	const rowData = useMemo(() => data.map((d) => ({ ...d })), [data]);

	return (
		<div className="ag-theme-alpine h-full w-full" style={{ minHeight: 400 }}>
			<AgGridReact
				ref={gridRef}
				rowData={rowData}
				columnDefs={columnDefs}
				defaultColDef={defaultColDef}
				onGridReady={onGridReady}
				onCellValueChanged={onCellValueChanged}
				rowSelection="multiple"
				undoRedoCellEditing={!readOnly}
				animateRows
			/>
		</div>
	);
}
