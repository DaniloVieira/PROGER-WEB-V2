"use client";

import * as React from "react";
import {
	ResponsiveContainer,
	ComposedChart,
	ReferenceArea,
	Text,
} from "recharts";

// ─── ColorsDefault (hard-coded from legacy PROGER 2) ───────────────────────

export const ColorsDefault = {
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
	vazaoIncremental?: number;
	vazaoTurbinada?: number;
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

// ─── Number formatters ─────────────────────────────────────────────────────

export const numberFormatterInteger = (value: number) =>
	Number.isFinite(value) ? Math.round(value).toString() : "";

export const numberFormatterDecimal = (value: number) =>
	Number.isFinite(value) ? value.toFixed(2) : "";

// ─── Custom dot label (início, meio, fim) ─────────────────────────────────

export function ProgerLabelStartMiddleEnd(props: {
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

// ─── Hook: encontra o último intervalo de D-1 ─────────────────────────────

export function useUltimoIntervaloD1(
	dados: ProgerChartDataPoint[],
): string | null {
	return React.useMemo(() => {
		for (let i = dados.length - 1; i >= 0; i--) {
			if (dados[i]?.ehDiaAnterior) {
				return dados[i]?.intervaloTempo ?? null;
			}
		}
		return null;
	}, [dados]);
}

// ─── Core ComposedChart wrapper ────────────────────────────────────────────

export interface ProgerChartCoreProps {
	data: ProgerChartDataPoint[];
	height: number;
	children: React.ReactNode;
	referenceArea?: { x1: string; x2: string } | null;
	margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export function ProgerChartCore({
	data,
	height,
	children,
	referenceArea,
	margin,
}: ProgerChartCoreProps) {
	return (
		<ResponsiveContainer width="100%" height={height}>
			<ComposedChart data={data} margin={margin}>
				{referenceArea && (
					<ReferenceArea
						x1={referenceArea.x1}
						x2={referenceArea.x2}
						fill="#1a1a1c"
						fillOpacity={0.55}
						strokeOpacity={0}
					/>
				)}
				{children}
			</ComposedChart>
		</ResponsiveContainer>
	);
}
