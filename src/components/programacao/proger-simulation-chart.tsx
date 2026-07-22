"use client";

import * as React from "react";
import {
	XAxis,
	YAxis,
	Line,
	Bar,
	Area,
	Legend,
} from "recharts";
import {
	ProgerChartCore,
	ColorsDefault,
	ProgerLabelStartMiddleEnd,
	numberFormatterInteger,
	numberFormatterDecimal,
	useUltimoIntervaloD1,
} from "@/components/proger/proger-chart-core";
import type {
	ProgerChartDataPoint,
	ProgerUsinaMontante,
} from "@/components/proger/proger-chart-core";
import { ProgerTooltip } from "@/components/proger/proger-tooltip";
import { Button } from "@/components/ui/button";

export interface ProgerSimulationChartProps {
	nmUsina: string;
	dadosGrafico: ProgerChartDataPoint[];
	eixoVazaoGeracao: number[];
	eixoNivelRes: number[];
	eixoDispGeracao: number[];
	usinasMontantes?: ProgerUsinaMontante[];
	usinaCd?: string;
	onsPainel?: boolean;
}

export function ProgerSimulationChart({
	nmUsina,
	dadosGrafico,
	eixoVazaoGeracao,
	eixoNivelRes,
	eixoDispGeracao,
	usinasMontantes = [],
	usinaCd,
	onsPainel = false,
}: ProgerSimulationChartProps) {
	const ultimoIntervaloD1 = useUltimoIntervaloD1(dadosGrafico);

	const hasMontante1 =
		dadosGrafico.length > 0 && !!dadosGrafico[0].cdUsinaMontante1;
	const hasMontante2 =
		dadosGrafico.length > 0 && !!dadosGrafico[0].cdUsinaMontante2;

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

	const referenceArea = ultimoIntervaloD1
		? { x1: "00:00", x2: ultimoIntervaloD1 }
		: null;

	return (
		<div className="flex flex-col w-full gap-1">
			{/* Header com título e botão ONS */}
			<div className="relative flex items-center justify-center bg-[#222224] border-2 border-[#303033] border-b-0 py-2 px-4">
				<h3 className="text-white text-sm font-semibold tracking-wide uppercase text-center">
					UHE {nmUsina} — SIMULAÇÃO HIDROENERGÉTICA - PROGRAMAÇÃO
				</h3>
				{onsPainel && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<ProgerTooltip content="Dados do ONS" position="left">
							<Button
								variant="outline"
								size="sm"
								className="h-6 px-2 text-[10px] border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 bg-transparent"
							>
								ONS
							</Button>
						</ProgerTooltip>
					</div>
				)}
			</div>

			{/* Top chart — vazões + níveis */}
			<div className="bg-[#222224] border-2 border-[#303033] p-1">
				<ProgerChartCore
					data={dadosGrafico}
					height={240}
					referenceArea={referenceArea}
				>
					<XAxis
						dataKey="intervaloTempo"
						stroke="#f5f7fa"
						tick={{ fontSize: 10 }}
						interval="preserveStartEnd"
					/>
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
						width={50}
						label={{
							value: "[m³/s]",
							angle: -90,
							position: "insideLeft",
							offset: 10,
							fill: ColorsDefault.axis,
							fontSize: 10,
						}}
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
						width={50}
						label={{
							value: "[m]",
							angle: 90,
							position: "insideRight",
							offset: 10,
							fill: ColorsDefault.axis,
							fontSize: 10,
						}}
					/>
					<YAxis
						yAxisId="dadoVerificado"
						hide
						domain={[0, 1]}
						width={30}
					/>
					<Legend
						wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
						iconType="plainline"
					/>
					<Line
						yAxisId="right"
						type="monotone"
						dataKey="nivelMaximoReservatorio"
						stroke={ColorsDefault.nivelMaximoReservatorio}
						strokeDasharray="3 3"
						dot={false}
						isAnimationActive={false}
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
							name={usinasMontantes[0]?.nmUsina ?? "Montante 1"}
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
							name={usinasMontantes[1]?.nmUsina ?? "Montante 2"}
						/>
					)}
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="vazaoAfluente"
						stroke={ColorsDefault.vazaoAfluente}
						dot={false}
						isAnimationActive={false}
						name="Vazão Afluente [m³/s]"
					/>
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="vazaoVertida"
						stroke={ColorsDefault.vazaoVertida}
						dot={false}
						isAnimationActive={false}
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
						name="Dados Verificados"
					/>
				</ProgerChartCore>
			</div>

			{/* Bottom chart — geração / disponibilidade */}
			<div className="bg-[#222224] border-2 border-t-0 border-[#303033] p-1">
				<ProgerChartCore
					data={dadosGrafico}
					height={100}
					referenceArea={referenceArea}
					margin={{ left: 9, right: 35 }}
				>
					<XAxis
						dataKey="intervaloTempo"
						stroke="#f5f7fa"
						tick={{ fontSize: 10 }}
						interval="preserveStartEnd"
					/>
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
						width={50}
						label={{
							value: "[MW]",
							angle: -90,
							position: "insideLeft",
							offset: 10,
							fill: ColorsDefault.axis,
							fontSize: 10,
						}}
					/>
					<YAxis
						yAxisId="dadoVerificado"
						hide
						domain={[0, 1]}
						width={30}
					/>
					<Legend
						wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
						iconType="plainline"
					/>
					<Bar
						yAxisId="left"
						dataKey="geracaoRef"
						barSize={10}
						fill={ColorsDefault.geracaoMwRef}
						minPointSize={10}
						isAnimationActive={false}
						name={`Geração ${usinaCd ?? nmUsina} [MW]`}
					/>
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="dispGeracaoRef"
						stroke={ColorsDefault.disponibilidade}
						strokeDasharray="3 3"
						dot={false}
						isAnimationActive={false}
						name="Disponibilidade [MW]"
					/>
					<Area
						yAxisId="dadoVerificado"
						type="monotone"
						dataKey="dadosVerificados"
						fill={ColorsDefault.dadosVerificados}
						stroke="#505050"
						isAnimationActive={false}
						name="Dados Verificados"
					/>
				</ProgerChartCore>
			</div>
		</div>
	);
}
