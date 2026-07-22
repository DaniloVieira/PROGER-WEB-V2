"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
	useProgramacaoQuery,
	useUpdateProgramacaoDadosMutation,
	usePublicarProgramacaoMutation,
	useCalcularHidraulicoMutation,
} from "@/hooks/use-programacao";
import { useTabStore } from "@/stores/tabs";
import { useSheetStore } from "@/stores/sheet";
import { ProgerResumoHeader } from "@/components/programacao/proger-resumo-header";
import { ProgerSimulationChart } from "@/components/programacao/proger-simulation-chart";
import { ProgerActionBar } from "@/components/programacao/proger-action-bar";
import { ProgerSheet } from "@/components/sheet/proger-sheet";
import { ProgerSkeleton } from "@/components/proger/proger-skeleton";
import { ProgerDatePicker } from "@/components/proger/proger-date-picker";
import { ProgerConfirmDialog } from "@/components/proger/proger-confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type {
	ProgerChartDataPoint,
	ProgerUsinaMontante,
} from "@/components/proger/proger-chart-core";
import type {
	ProgerSheetCellData,
	ProgerSheetChange,
	ProgerSheetColumn,
} from "@/components/sheet/proger-sheet-types";
import type { DadoProgramacao, DadosPainelItem } from "@/types/api";
import { tomorrowISO } from "@/lib/date-utils";

export interface ProgramacaoContentProps {
	standalone?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIntervalo(periodo: number): string {
	const startMin = periodo * 30;
	const endMin = startMin + 30;
	const startHour = Math.floor(startMin / 60);
	const startMinStr = String(startMin % 60).padStart(2, "0");
	const endHour = Math.floor(endMin / 60) % 24;
	const endMinStr = String(endMin % 60).padStart(2, "0");
	return `${String(startHour).padStart(2, "0")}:${startMinStr}-${String(endHour).padStart(2, "0")}:${endMinStr}`;
}

function formatIntervaloTempo(index: number): string {
	const totalMinutes = index * 30;
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function mapearDadosPainelParaChart(
	items: DadosPainelItem[],
	dataSelecionada: string,
): ProgerChartDataPoint[] {
	return items.map((item, index) => ({
		intervaloTempo: formatIntervaloTempo(index),
		vazaoAfluente: item.vazaoAfluente,
		vazaoVertida: item.vazaoVertida,
		vazaoDefluente: item.vazaoDefluente,
		nivelReservatorio: item.nivelReservatorio,
		nivelMaximoReservatorio: item.nivelMaximoReservatorio,
		nivelMinimoReservatorio: item.nivelMinimoReservatorio,
		geracaoRef: item.geracaoMW,
		dispGeracaoRef: item.disponivel,
		dadosVerificados: item.dadosVerificados ? 1 : 0,
		ehDiaAnterior: item.dtProgramacao !== dataSelecionada,
	}));
}

function fallbackEixo(values: number[]): number[] {
	if (values.length === 0) return [0, 1, 2, 3, 4];
	const min = Math.min(...values);
	const max = Math.max(...values);
	if (min === max) return [min];
	const step = (max - min) / 4;
	return Array.from({ length: 5 }, (_, i) =>
		Number((min + step * i).toFixed(2)),
	);
}

// ─── Sheet Columns ───────────────────────────────────────────────────────────

const SHEET_COLUMNS: ProgerSheetColumn[] = [
	{ key: "intervalo", title: "Intervalo", width: 90, readOnly: true },
	{
		key: "geracaoMWOns",
		title: "Geração ONS [MW]",
		width: 110,
		inputType: "number",
		readOnly: true,
	},
	{
		key: "geracaoMW",
		title: "Geração [MW]",
		width: 110,
		inputType: "number",
	},
	{
		key: "vazaoVertida",
		title: "Qvert [m³/s]",
		width: 115,
		inputType: "number",
	},
	{
		key: "vazaoIncremental",
		title: "Qincr [m³/s]",
		width: 115,
		inputType: "number",
	},
	{
		key: "vazaoAfluente",
		title: "Qaflu [m³/s]",
		width: 115,
		inputType: "number",
		readOnly: true,
	},
	{
		key: "vazaoTurbinada",
		title: "Qturb [m³/s]",
		width: 115,
		inputType: "number",
		readOnly: true,
	},
	{
		key: "vazaoDefluente",
		title: "Qdefl [m³/s]",
		width: 115,
		inputType: "number",
		readOnly: true,
	},
	{
		key: "nivelReservatorio",
		title: "Nível [m]",
		width: 100,
		inputType: "number",
		readOnly: true,
	},
	{
		key: "volumeTotal",
		title: "Volume [hm³]",
		width: 115,
		inputType: "number",
		readOnly: true,
	},
	{
		key: "disponivel",
		title: "Disp [MW]",
		width: 100,
		inputType: "number",
		readOnly: true,
	},
];

const COL_GERACAO_ONS = 1;
const COL_GERACAO = 2;
const COL_QVERT = 3;
const COL_QINCR = 4;

// ─── convertToSheetData ─────────────────────────────────────────────────────

function convertToSheetData(dados: DadoProgramacao[]): ProgerSheetCellData[][] {
	const sorted = [...dados].sort((a, b) => a.periodo - b.periodo);
	const rows: ProgerSheetCellData[][] = [];

	for (let i = 0; i < 48; i++) {
		const dado = sorted[i] ?? {
			periodo: i,
			geracaoMW: 0,
			vazaoVertida: 0,
			vazaoIncremental: 0,
			nivelReservatorio: 0,
			volumeTotal: 0,
			vazaoTurbinada: 0,
			vazaoDefluente: 0,
			vazaoAfluente: 0,
			dadosVerificados: false,
		};

		rows.push([
			{
				value: formatIntervalo(dado.periodo),
				readOnly: true,
				inputType: "text",
			},
			{
				value: dado.geracaoMWOns ?? 0,
				readOnly: true,
				inputType: "number",
				isOns: true,
			},
			{ value: dado.geracaoMW, inputType: "number" },
			{ value: dado.vazaoVertida, inputType: "number" },
			{ value: dado.vazaoIncremental, inputType: "number" },
			{
				value: dado.vazaoAfluente,
				readOnly: true,
				inputType: "number",
			},
			{
				value: dado.vazaoTurbinada,
				readOnly: true,
				inputType: "number",
			},
			{
				value: dado.vazaoDefluente,
				readOnly: true,
				inputType: "number",
			},
			{
				value: dado.nivelReservatorio,
				readOnly: true,
				inputType: "number",
			},
			{
				value: dado.volumeTotal,
				readOnly: true,
				inputType: "number",
			},
			{
				value: dado.disponivel ?? 0,
				readOnly: true,
				inputType: "number",
			},
		]);
	}

	// Footer row — averages
	const n = sorted.length || 1;
	const avg = (key: keyof DadoProgramacao) =>
		sorted.reduce(
			(s, d) =>
				s +
				(typeof d[key] === "number" ? (d[key] as number) : 0),
			0,
		) / n;

	rows.push([
		{
			value: "Média",
			readOnly: true,
			inputType: "text",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("geracaoMWOns"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("geracaoMW"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("vazaoVertida"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("vazaoIncremental"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("vazaoAfluente"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("vazaoTurbinada"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("vazaoDefluente"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("nivelReservatorio"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("volumeTotal"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
		{
			value: avg("disponivel"),
			readOnly: true,
			inputType: "number",
			className: "font-bold bg-[#303033] text-white",
		},
	]);

	return rows;
}

// ─── getCellClassName ───────────────────────────────────────────────────────

function getCellClassName(
	cell: ProgerSheetCellData,
	_row: number,
	col: number,
): string {
	if (cell.readOnly) return "";
	const classes: string[] = [];

	if (cell.isManual) classes.push("text-blue-400");
	if (cell.isOns) classes.push("text-[#42A5F5]");

	if (col > 0 && typeof cell.value === "number") {
		if (cell.value < 0) classes.push("text-red-500");
		else if (cell.value === 0) classes.push("text-gray-400");
	}

	return classes.join(" ");
}

// ─── extractPayloadFromSheet ────────────────────────────────────────────────

function extractPayloadFromSheet(
	sheetData: ProgerSheetCellData[][],
	dtAlteracao?: string,
) {
	const dados: Array<{
		periodo: number;
		geracaoMW: number;
		vazaoVertida: number;
		vazaoIncremental: number;
	}> = [];
	for (let r = 0; r < Math.min(sheetData.length - 1, 48); r++) {
		const row = sheetData[r];
		dados.push({
			periodo: r,
			geracaoMW:
				typeof row[COL_GERACAO]?.value === "number"
					? (row[COL_GERACAO].value as number)
					: 0,
			vazaoVertida:
				typeof row[COL_QVERT]?.value === "number"
					? (row[COL_QVERT].value as number)
					: 0,
			vazaoIncremental:
				typeof row[COL_QINCR]?.value === "number"
					? (row[COL_QINCR].value as number)
					: 0,
		});
	}
	return { dados, dtAlteracao };
}

// ─── Component ─────────────────────────────────────────────────────────────

export function ProgramacaoContent(props: ProgramacaoContentProps) {
	const { standalone } = props;
	const params = useParams();
	const cdUsina = params.cdUsina as string;

	const [dtProgramacao, setDtProgramacao] = useState(tomorrowISO());
	const [confirmAction, setConfirmAction] = useState<
		"publicar" | "reverter" | null
	>(null);
	const [sheetData, setSheetData] = useState<ProgerSheetCellData[][]>([]);

	const {
		data: completa,
		isLoading: loadingCompleta,
		error: errorCompleta,
	} = useProgramacaoQuery(cdUsina, dtProgramacao);

	const updateMutation = useUpdateProgramacaoDadosMutation();
	const publicarMutation = usePublicarProgramacaoMutation();
	const calcularMutation = useCalcularHidraulicoMutation();

	const programacao = completa?.programacao;
	const dadosProgramacao = completa?.dados;
	const painel = completa?.painel;

	// Sync server data → local sheet state; clear undo stack on new load
	useEffect(() => {
		if (dadosProgramacao?.dados) {
			setSheetData(convertToSheetData(dadosProgramacao.dados));
			useSheetStore.getState().clear(cdUsina);
			useTabStore.getState().setTabDirty(cdUsina, false);
		}
	}, [dadosProgramacao, cdUsina]);

	// Show error toast if query fails
	useEffect(() => {
		if (errorCompleta) {
			toast.error(errorCompleta.message);
		}
	}, [errorCompleta]);

	const handleCellsChanged = useCallback(
		(changes: ProgerSheetChange[]) => {
			setSheetData((prev) => {
				const next = prev.map((row) =>
					row.map((cell) => ({ ...cell })),
				);
				for (const change of changes) {
					if (next[change.row]?.[change.col]) {
						next[change.row][change.col] = {
							...next[change.row][change.col],
							value: change.nextValue,
							isManual: true,
						};
					}
				}
				return next;
			});
			useTabStore.getState().setTabDirty(cdUsina, true);
		},
		[cdUsina],
	);

	const handleCopiarONS = useCallback(() => {
		if (!dadosProgramacao?.dados) return;
		setSheetData((prev) => {
			const next = prev.map((row) =>
				row.map((cell) => ({ ...cell })),
			);
			for (let r = 0; r < Math.min(next.length - 1, 48); r++) {
				const onsGeracao = next[r][COL_GERACAO_ONS];
				const geracao = next[r][COL_GERACAO];
				if (
					geracao &&
					!geracao.readOnly &&
					onsGeracao &&
					geracao.value !== onsGeracao.value
				) {
					next[r][COL_GERACAO] = {
						...geracao,
						value: onsGeracao.value,
						isManual: true,
					};
				}
			}
			return next;
		});
		useTabStore.getState().setTabDirty(cdUsina, true);
		toast.success("Dados ONS copiados para a programação.");
	}, [cdUsina, dadosProgramacao]);

	const handleSimular = useCallback(() => {
		if (!programacao || !dadosProgramacao?.dados) {
			toast.info("Nenhuma programação carregada para simulação.");
			return;
		}
		const payload = {
			cdUsina,
			coefConvMin: 1,
			volumeInicialHm3: 0,
			curvaCotaVolume: [],
			periodos: dadosProgramacao.dados.map((d) => ({
				periodo: d.periodo,
				geracaoMW: d.geracaoMW,
				vazaoVertida: d.vazaoVertida,
				vazaoIncremental: d.vazaoIncremental,
			})),
		};
		calcularMutation.mutate(payload);
	}, [cdUsina, programacao, dadosProgramacao, calcularMutation]);

	const handleAceitar = useCallback(() => {
		if (!programacao) {
			toast.error("Nenhuma programação carregada.");
			return;
		}
		const { dados, dtAlteracao } = extractPayloadFromSheet(
			sheetData,
			dadosProgramacao?.dtAlteracao,
		);
		updateMutation.mutate(
			{
				cdProgramacao: programacao.cdProgramacao,
				dados,
				dtAlteracao,
			},
			{
				onSuccess: () => {
					useTabStore.getState().setTabDirty(cdUsina, false);
				},
			},
		);
	}, [cdUsina, programacao, sheetData, dadosProgramacao, updateMutation]);

	const handlePublicar = useCallback(() => {
		setConfirmAction("publicar");
	}, []);

	const handleReverter = useCallback(() => {
		setConfirmAction("reverter");
	}, []);

	const executeConfirm = useCallback(() => {
		if (confirmAction === "publicar") {
			if (!programacao) {
				toast.error("Nenhuma programação carregada.");
				return;
			}
			publicarMutation.mutate(programacao.cdProgramacao, {
				onSuccess: () => {
					useTabStore.getState().setTabDirty(cdUsina, false);
				},
			});
		} else if (confirmAction === "reverter") {
			if (dadosProgramacao?.dados) {
				setSheetData(convertToSheetData(dadosProgramacao.dados));
				useSheetStore.getState().clear(cdUsina);
				useTabStore.getState().setTabDirty(cdUsina, false);
				toast.success("Alterações revertidas.");
			}
		}
		setConfirmAction(null);
	}, [confirmAction, programacao, cdUsina, dadosProgramacao, publicarMutation]);

	const handleImportarManual = useCallback(() => {
		toast.info("Importação manual será implementada na próxima fase.");
	}, []);

	const handleGerarPDP = useCallback(() => {
		toast.info("Geração de PDP será implementada na próxima fase.");
	}, []);

	// Chart data (full: D-1 + D)
	const chartData = useMemo(() => {
		if (!painel?.dados) return [];
		return mapearDadosPainelParaChart(painel.dados, dtProgramacao);
	}, [painel, dtProgramacao]);

	// Resumo data (only selected date D)
	const resumoData = useMemo(() => {
		return (
			painel?.dados?.filter((d) => d.dtProgramacao === dtProgramacao) ??
			[]
		);
	}, [painel, dtProgramacao]);

	const eixoVazaoGeracao = useMemo(() => {
		if (
			painel?.eixoVazaoGeracao &&
			painel.eixoVazaoGeracao.length > 0
		) {
			return painel.eixoVazaoGeracao;
		}
		return fallbackEixo(chartData.map((d) => d.vazaoAfluente ?? 0));
	}, [painel, chartData]);

	const eixoNivelRes = useMemo(() => {
		if (painel?.eixoNivelRes && painel.eixoNivelRes.length > 0) {
			return painel.eixoNivelRes;
		}
		return fallbackEixo(
			chartData.map((d) => d.nivelReservatorio ?? 0),
		);
	}, [painel, chartData]);

	const eixoDispGeracao = useMemo(() => {
		if (
			painel?.eixoDispGeracao &&
			painel.eixoDispGeracao.length > 0
		) {
			return painel.eixoDispGeracao;
		}
		return fallbackEixo(chartData.map((d) => d.geracaoRef ?? 0));
	}, [painel, chartData]);

	const usinasMontantes: ProgerUsinaMontante[] = useMemo(() => {
		// TODO: montantes should be resolved from a dedicated endpoint
		return [];
	}, []);

	const sheetColumns = useMemo(() => SHEET_COLUMNS, []);

	const isLoading =
		loadingCompleta ||
		updateMutation.isPending ||
		publicarMutation.isPending ||
		calcularMutation.isPending;

	return (
		<div className={`${standalone ? "" : "p-4"} space-y-4`}>
			{/* Header */}
			<div className="flex items-center gap-4 flex-wrap">
				{standalone && (
					<Link href="/dashboard">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-1" />
							Voltar
						</Button>
					</Link>
				)}
				<div className="flex-1 min-w-[200px]">
					<h2 className="text-xl font-bold text-white">
						Programação — {cdUsina}
					</h2>
					{painel && (
						<p className="text-sm text-gray-400 mt-0.5">
							Data: {dtProgramacao} | Situação:{" "}
							<Badge
								variant="outline"
								className="text-xs"
							>
								{programacao?.situacao ?? "—"}
							</Badge>
						</p>
					)}
				</div>

				<ProgerDatePicker
					value={dtProgramacao}
					onChange={setDtProgramacao}
				/>

				<Button
					variant="ghost"
					size="sm"
					className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
					onClick={handleAceitar}
					disabled={isLoading}
				>
					<Save className="h-4 w-4 mr-1" />
					Salvar
				</Button>
			</div>

			{/* 2-column layout: charts 70% + grid 30% */}
			<div className="grid grid-cols-1 xl:grid-cols-[7fr_3fr] lg:grid-cols-[3fr_2fr] gap-4">
				{/* Left column — Charts */}
				<div className="space-y-4 min-w-0">
					{loadingCompleta ? (
						<>
							<ProgerSkeleton className="h-28 w-full rounded-xl" />
							<ProgerSkeleton className="h-[340px] w-full rounded-xl" />
						</>
					) : errorCompleta ? (
						<Card className="bg-[#222224] border-[#303033] text-white p-6">
							<div className="flex items-center gap-2 text-red-400">
								<AlertTriangle className="h-5 w-5" />
								<span>
									Erro ao carregar programação.
								</span>
							</div>
							<p className="text-sm text-gray-400 mt-2">
								{errorCompleta.message}
							</p>
						</Card>
					) : (
						<>
							<ProgerResumoHeader
								data={resumoData}
								className="w-full"
							/>
							<ProgerSimulationChart
								nmUsina={cdUsina}
								dadosGrafico={chartData}
								eixoVazaoGeracao={eixoVazaoGeracao}
								eixoNivelRes={eixoNivelRes}
								eixoDispGeracao={eixoDispGeracao}
								usinasMontantes={usinasMontantes}
								usinaCd={cdUsina}
								onsPainel={painel?.onsPainel ?? painel?.nsPainel ?? false}
							/>
						</>
					)}
				</div>

				{/* Right column — Grid */}
				<div className="space-y-4 min-w-0">
					<ProgerActionBar
						onCopiarONS={handleCopiarONS}
						onPublicar={handlePublicar}
						onSimular={handleSimular}
						onReverter={handleReverter}
						onAceitar={handleAceitar}
						onImportarManual={handleImportarManual}
						onGerarPDP={handleGerarPDP}
						loading={isLoading}
					/>

					<Card className="overflow-hidden border-[#303033] bg-[#1a1d21]">
						<CardHeader className="bg-[#1a1d21] border-b border-[#303033] py-2 px-3">
							<CardTitle className="text-white text-xs font-semibold uppercase tracking-wider">
								Dados Horários
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0 bg-[#1a1d21] overflow-x-auto">
							{loadingCompleta ? (
								<Skeleton className="h-[600px] w-full rounded-none" />
							) : sheetData.length > 0 ? (
								<ProgerSheet
									data={sheetData}
									columns={sheetColumns}
									sheetId={cdUsina}
									onCellsChanged={handleCellsChanged}
									getCellClassName={getCellClassName}
									className="max-h-[calc(100vh-240px)] overflow-auto"
								/>
							) : (
								<div className="text-center py-12 text-gray-500 text-sm">
									Nenhuma programação encontrada para
									esta usina.
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Confirm dialogs */}
			<ProgerConfirmDialog
				open={confirmAction === "publicar"}
				onOpenChange={(open) => !open && setConfirmAction(null)}
				title="Publicar Programação"
				description={`Deseja publicar a programação de ${cdUsina} para ${dtProgramacao}?`}
				confirmText="PUBLICAR"
				onConfirm={executeConfirm}
			/>
			<ProgerConfirmDialog
				open={confirmAction === "reverter"}
				onOpenChange={(open) => !open && setConfirmAction(null)}
				title="Reverter Alterações"
				description="Deseja descartar todas as alterações não salvas?"
				confirmText="REVERTER"
				onConfirm={executeConfirm}
			/>
		</div>
	);
}
