"use client";

import * as React from "react";
import { useMemo } from "react";
import {
	ResponsiveContainer,
	ComposedChart,
	XAxis,
	YAxis,
	Line,
	Bar,
	Area,
	ReferenceArea,
	Text,
} from "recharts";
import { Pill, Zap, Droplets, Check } from "lucide-react";
import type { UsinaResumo, AlertasRestricoesPainel } from "@/types/api";

// ─── ColorsDefault (hard-coded from legacy PROGER 2) ───────────────────────

const ColorsDefault = {
	nivelMaximoReservatorio: "#C00000",
	nivelMinimoReservatorio: "#C00000",
	geracaoMontante: "#BDBDC3",
	geracaoMontante2: "#7e7e82",
	geracaoMontanteStroke: "#505264",
	vazaoAfluente: "#00ace6",
	vazaoVertida: "#00ff99",
	vazaoVaoLivre: "#ffa600",
	nivelReservatorio: "white",
	dadosVerificados: "#505050",
	geracaoMwRef: "#8FAADC",
	disponibilidade: "#ff0000",
	axis: "#B4B4B5",
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProgerChartDataPoint {
	intervaloTempo: string;
	vazaoAfluente?: number;
	vazaoVertida?: number;
	vazaoDefluente?: number;
	vazaoDefluenteMontante1?: number;
	vazaoDefluenteMontante2?: number;
	nivelMaximoReservatorio?: number;
	nivelMinimoReservatorio?: number;
	geracaoMontante1?: number;
	geracaoMontante2?: number;
	nivelReservatorio?: number;
	dadosVerificados?: number;
	geracaoRef?: number;
	dispGeracaoRef?: number;
	cdUsinaMontante1?: string;
	cdUsinaMontante2?: string;
	ehDiaAnterior?: boolean;
}

export interface ProgerUsinaMontante {
	cdUsina: string;
	nmUsina: string;
}

export interface ProgerChartCardProps {
	usina: UsinaResumo;
	dadosGrafico: ProgerChartDataPoint[];
	eixoVazaoGeracao: number[];
	eixoNivelRes: number[];
	eixoDispGeracao: number[];
	usinasMontantes?: ProgerUsinaMontante[];
	alertasRestricoesPainel?: AlertasRestricoesPainel;
	publicado?: boolean;
	miniLoading?: boolean;
	onUsinaClick?: (usina: UsinaResumo) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getMedByProp(
	dados: ProgerChartDataPoint[],
	param: keyof ProgerChartDataPoint,
	fixed = 0,
): string {
	let sum = 0;
	let counter = 0;
	let count = 0;
	for (const dado of dados) {
		if (counter > 47) {
			const val = dado[param];
			if (typeof val === "number") {
				sum += val;
				count += 1;
			}
		}
		counter += 1;
	}
	if (sum > 0 && count > 0) sum /= count;
	return Number.isFinite(sum) ? sum.toFixed(fixed) : "0";
}

const numberFormatterInteger = (value: number) =>
	Number.isFinite(value) ? Math.round(value).toString() : "";

const numberFormatterDecimal = (value: number) =>
	Number.isFinite(value) ? value.toFixed(2) : "";

// ─── Custom dot label (início, meio, fim) ──────────────────────────────────

function ProgerLabelStartMiddleEnd(props: {
	cx?: number;
	cy?: number;
	index?: number;
	value?: number;
	stroke?: string;
	fontSize?: number;
}) {
	const { cx = 0, cy = 0, index = 0, value, stroke, fontSize = 10 } = props;

	if (index === 0) {
		return (
			<Text
				x={cx + 15}
				y={cy}
				dy={-4}
				fill={stroke}
				fontSize={fontSize}
				textAnchor="middle"
			>
				{value !== undefined ? value.toFixed(2) : ""}
			</Text>
		);
	}
	if (index === 47) {
		return (
			<Text
				x={cx}
				y={cy}
				dy={-4}
				fill={stroke}
				fontSize={fontSize}
				textAnchor="middle"
			>
				{value !== undefined ? value.toFixed(2) : ""}
			</Text>
		);
	}
	if (index === 95) {
		return (
			<Text
				x={cx - 15}
				y={cy}
				dy={-4}
				fill={stroke}
				fontSize={fontSize}
				textAnchor="middle"
			>
				{value !== undefined ? value.toFixed(2) : ""}
			</Text>
		);
	}
	return null;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ChartHeaderMetric({
	label,
	sub,
	value,
}: {
	label: string;
	sub: string;
	value: string;
}) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				textAlign: "center",
				width: 45,
				gap: "5px 0px",
			}}
		>
			<p style={{ margin: 0 }}>{label}</p>
			<p style={{ margin: 0 }}>{sub}</p>
			<p
				style={{
					margin: 0,
					backgroundColor: "#303033",
					color: "white",
					borderRadius: 20,
					height: 18,
					lineHeight: "18px",
				}}
			>
				{value}
			</p>
		</div>
	);
}

// ─── Main Component ────────────────────────────────────────────────────────

export function ProgerChartCard({
	usina,
	dadosGrafico,
	eixoVazaoGeracao,
	eixoNivelRes,
	eixoDispGeracao,
	usinasMontantes = [],
	alertasRestricoesPainel,
	publicado,
	onUsinaClick,
}: ProgerChartCardProps) {
	const hasMontante1 =
		dadosGrafico.length > 0 && !!dadosGrafico[0].cdUsinaMontante1;
	const hasMontante2 =
		dadosGrafico.length > 0 && !!dadosGrafico[0].cdUsinaMontante2;

	// Encontra o último intervalo de D-1 para a área escura do historiador
	const ultimoIntervaloD1 = useMemo(() => {
		for (let i = dadosGrafico.length - 1; i >= 0; i--) {
			if (dadosGrafico[i]?.ehDiaAnterior) {
				return dadosGrafico[i]?.intervaloTempo ?? "23:30";
			}
		}
		return null;
	}, [dadosGrafico]);

	const headerMetrics = useMemo(() => {
		const m1 = usinasMontantes[0];
		const m2 = usinasMontantes[1];
		return [
			{
				label: "Ger. Média",
				sub: usina.cdUsina,
				value: getMedByProp(dadosGrafico, "geracaoRef"),
			},
			{
				label: "Vazão Def.",
				sub: usina.cdUsina,
				value: getMedByProp(dadosGrafico, "vazaoDefluente"),
			},
			{
				label: "Ger. Média",
				sub: m1?.cdUsina ?? "-",
				value: m1 ? getMedByProp(dadosGrafico, "geracaoMontante1") : "-",
			},
			{
				label: "Vazão Def.",
				sub: m1?.cdUsina ?? "-",
				value: m1 ? getMedByProp(dadosGrafico, "vazaoDefluenteMontante1") : "-",
			},
			{
				label: "Ger. Média",
				sub: m2?.cdUsina ?? "-",
				value: m2 ? getMedByProp(dadosGrafico, "geracaoMontante2") : "-",
			},
			{
				label: "Vazão Def.",
				sub: m2?.cdUsina ?? "-",
				value: m2 ? getMedByProp(dadosGrafico, "vazaoDefluenteMontante2") : "-",
			},
			{
				label: "Nível",
				sub: "Inicial",
				value: getMedByProp(dadosGrafico, "nivelMaximoReservatorio", 2),
			},
			{
				label: "Nível",
				sub: "Final",
				value: getMedByProp(dadosGrafico, "nivelMinimoReservatorio", 2),
			},
		];
	}, [dadosGrafico, usina, usinasMontantes]);

	const leftDomain: [number, number] = [
		eixoVazaoGeracao[0] ?? 0,
		eixoVazaoGeracao[eixoVazaoGeracao.length - 1] ?? 0,
	];

	const rightDomain: [number, number] = [
		eixoNivelRes[0] ?? 0,
		eixoNivelRes[eixoNivelRes.length - 1] ?? 0,
	];

	const bottomDomain: [number, number] = [
		eixoDispGeracao[0] ?? 0,
		eixoDispGeracao[eixoDispGeracao.length - 1] ?? 0,
	];

	return (
		<div
			className="proger-chart-card-wrapper"
			style={{
				margin: "10px 5px",
				display: "flex",
				flexDirection: "row",
			}}
		>
			{/* ── Left rail ── */}
			<div
				style={{
					width: 30,
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
				}}
			>
				<div
					style={{
						height: 117,
						width: 30,
						display: "flex",
						flexDirection: "column",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					{alertasRestricoesPainel?.nivel?.length ? (
						<span title={alertasRestricoesPainel.nivel.map(a => a.descricao).join("\n")} style={{ color: "red", cursor: "help" }}>
							<Pill size={18} />
						</span>
					) : (
						<span style={{ color: "transparent" }}><Pill size={18} /></span>
					)}
					{alertasRestricoesPainel?.geracao?.length ? (
						<span title={alertasRestricoesPainel.geracao.map(a => a.descricao).join("\n")} style={{ color: "red", cursor: "help" }}>
							<Zap size={18} />
						</span>
					) : (
						<span style={{ color: "transparent" }}><Zap size={18} /></span>
					)}
					{alertasRestricoesPainel?.hidrico?.length ? (
						<span title={alertasRestricoesPainel.hidrico.map(a => a.descricao).join("\n")} style={{ color: "red", cursor: "help" }}>
							<Droplets size={18} />
						</span>
					) : (
						<span style={{ color: "transparent" }}><Droplets size={18} /></span>
					)}
					<div style={{ fontSize: 10 }}>
						<span style={{ color: "transparent" }}>
							ONS
						</span>
					</div>
					{publicado && (
						<div
							style={{
								color: "#50c878",
								display: "flex",
								alignItems: "center",
							}}
						>
							<Check size={14} />
						</div>
					)}
				</div>

				{/* Rotated usina name tab */}
				<div
					onClick={() => onUsinaClick?.(usina)}
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 1,
						backgroundColor: "#303033",
						width: 160,
						height: 30,
						padding: "3px 15px 0 15px",
						borderTopLeftRadius: "15px 17px",
						borderTopRightRadius: "15px 17px",
						transform: "rotate(-90deg)",
						transformOrigin: "9.6% 51%",
						cursor: onUsinaClick ? "pointer" : "default",
					}}
				>
					<span
						style={{
							fontSize: "0.9rem",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							color: "white",
							margin: 0,
						}}
					>
						{usina.nmUsina}
					</span>
				</div>
			</div>

			{/* ── Chart content ── */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					flex: 1,
					minWidth: 0,
					width: "100%",
				}}
			>
				{/* Header metrics */}
				<div
					style={{
						fontSize: "8.5px",
						height: 50,
						width: "100%",
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
						marginBottom: 6,
						padding: "0 4px",
					}}
				>
					{headerMetrics.map((m, i) => (
						<ChartHeaderMetric
							key={i}
							label={m.label}
							sub={m.sub}
							value={m.value}
						/>
					))}
				</div>

				{/* Top chart (Grafico1-like) */}
				<div
					style={{
						backgroundColor: "#222224",
						width: "100%",
						border: "2px solid #303033",
						padding: "5px 1px",
					}}
				>
					<ResponsiveContainer width="100%" height={160}>
						<ComposedChart data={dadosGrafico}>
							<XAxis dataKey="intervaloTempo" stroke="#f5f7fa" hide />
							<YAxis
								yAxisId="left"
								stroke={ColorsDefault.axis}
								allowDecimals={false}
								tick={{ fontSize: 10 }}
								axisLine={false}
								interval="preserveStartEnd"
								tickLine={false}
								dataKey="vazaoAfluente"
								tickFormatter={numberFormatterInteger}
								domain={leftDomain}
								ticks={eixoVazaoGeracao}
								width="auto"
							/>
							<YAxis
								yAxisId="right"
								stroke={ColorsDefault.axis}
								allowDecimals
								tick={{ fontSize: 10 }}
								axisLine={false}
								interval="preserveStartEnd"
								tickLine={false}
								dataKey="nivelMaximoReservatorio"
								orientation="right"
								tickFormatter={numberFormatterDecimal}
								domain={rightDomain}
								ticks={eixoNivelRes}
								width="auto"
							/>
							<YAxis
								yAxisId="dadoVerificado"
								hide
								domain={[0, 1]}
								width="auto"
							/>
							{ultimoIntervaloD1 && (
								<ReferenceArea
									x1="00:00"
									x2={ultimoIntervaloD1}
									fill="#1a1a1c"
									fillOpacity={0.55}
									strokeOpacity={0}
								/>
							)}
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="nivelMaximoReservatorio"
								stroke={ColorsDefault.nivelMaximoReservatorio}
								strokeDasharray="3 3"
								dot={false}
								isAnimationActive={false}
								activeDot={false}
								name="Nível Máximo [m]"
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="nivelMinimoReservatorio"
								stroke={ColorsDefault.nivelMinimoReservatorio}
								strokeDasharray="3 3"
								dot={false}
								isAnimationActive={false}
								activeDot={false}
								name="Nível Mínimo [m]"
							/>
							{hasMontante1 && (
								<Bar
									yAxisId="left"
									dataKey="geracaoMontante1"
									barSize={10}
									fill={
										hasMontante2
											? ColorsDefault.geracaoMontante
											: ColorsDefault.geracaoMontante2
									}
									stackId="stack01"
									fillOpacity={0.4}
									minPointSize={10}
									isAnimationActive={false}
									activeDot={false}
								/>
							)}
							{hasMontante2 && (
								<Bar
									yAxisId="left"
									dataKey="geracaoMontante2"
									stackId="stack01"
									barSize={10}
									fill={ColorsDefault.geracaoMontante2}
									fillOpacity={0.4}
									minPointSize={10}
									isAnimationActive={false}
									activeDot={false}
								/>
							)}
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="vazaoAfluente"
								stroke={ColorsDefault.vazaoAfluente}
								dot={false}
								isAnimationActive={false}
								activeDot={false}
								name="Vazão Afluente [m³/s]"
							/>
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="vazaoVertida"
								stroke={ColorsDefault.vazaoVertida}
								dot={false}
								isAnimationActive={false}
								activeDot={false}
								name="Vazão Vertida [m³/s]"
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="nivelReservatorio"
								stroke={ColorsDefault.nivelReservatorio}
								strokeDasharray="7 7"
								strokeWidth={2}
								dot={<ProgerLabelStartMiddleEnd />}
								isAnimationActive={false}
								activeDot={false}
								name="Nível do Reservatório [m]"
							/>
							<Area
								yAxisId="dadoVerificado"
								type="monotone"
								dataKey="dadosVerificados"
								fill={ColorsDefault.dadosVerificados}
								stroke="#505050"
								strokeOpacity={0.1}
								isAnimationActive={false}
								activeDot={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>

				{/* Bottom chart (Grafico2-like) */}
				<div
					style={{
						backgroundColor: "#222224",
						width: "100%",
						borderBottom: "2px solid #303033",
						borderLeft: "2px solid #303033",
						borderRight: "2px solid #303033",
						padding: "5px 1px",
					}}
				>
					<ResponsiveContainer width="100%" height={70}>
						<ComposedChart data={dadosGrafico} margin={{ left: 9, right: 35 }}>
							<XAxis dataKey="intervaloTempo" stroke="#f5f7fa" hide />
							<YAxis
								yAxisId="left"
								axisLine={false}
								tickLine={false}
								type="number"
								stroke={ColorsDefault.axis}
								allowDecimals={false}
								minTickGap={0}
								tick={{ fontSize: 10 }}
								tickFormatter={numberFormatterInteger}
								domain={bottomDomain}
								ticks={eixoDispGeracao}
								width="auto"
							/>
							<YAxis
								yAxisId="dadoVerificado"
								hide
								domain={[0, 1]}
								width="auto"
							/>
							{ultimoIntervaloD1 && (
								<ReferenceArea
									x1="00:00"
									x2={ultimoIntervaloD1}
									fill="#1a1a1c"
									fillOpacity={0.55}
									strokeOpacity={0}
								/>
							)}
							<Bar
								yAxisId="left"
								dataKey="geracaoRef"
								barSize={10}
								fill={ColorsDefault.geracaoMwRef}
								minPointSize={10}
								isAnimationActive={false}
								activeDot={false}
							/>
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="dispGeracaoRef"
								stroke={ColorsDefault.disponibilidade}
								strokeDasharray="3 3"
								dot={false}
								isAnimationActive={false}
								activeDot={false}
							/>
							<Area
								yAxisId="dadoVerificado"
								type="monotone"
								dataKey="dadosVerificados"
								fill={ColorsDefault.dadosVerificados}
								stroke="#505050"
								isAnimationActive={false}
								activeDot={false}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
