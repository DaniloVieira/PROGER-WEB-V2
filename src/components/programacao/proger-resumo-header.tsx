"use client";

import { cn } from "@/lib/utils";
import type { DadosPainelItem } from "@/types/api";

export interface ProgerResumoHeaderProps {
	data: Array<Partial<DadosPainelItem>>;
	className?: string;
}

function getAvg(
	data: Array<Partial<DadosPainelItem>>,
	key: keyof DadosPainelItem,
	fixed = 0,
): string {
	let sum = 0;
	let count = 0;
	for (const d of data) {
		const val = d[key];
		if (typeof val === "number" && Number.isFinite(val)) {
			sum += val;
			count += 1;
		}
	}
	if (count === 0) return "-";
	const avg = sum / count;
	return Number.isFinite(avg) ? avg.toFixed(fixed) : "-";
}

function getFirst(
	data: Array<Partial<DadosPainelItem>>,
	key: keyof DadosPainelItem,
	fixed = 2,
): string {
	const val = data[0]?.[key];
	if (typeof val === "number" && Number.isFinite(val)) {
		return val.toFixed(fixed);
	}
	return "-";
}

function getLast(
	data: Array<Partial<DadosPainelItem>>,
	key: keyof DadosPainelItem,
	fixed = 2,
): string {
	const val = data[data.length - 1]?.[key];
	if (typeof val === "number" && Number.isFinite(val)) {
		return val.toFixed(fixed);
	}
	return "-";
}

function getVariacao(
	data: Array<Partial<DadosPainelItem>>,
	key: keyof DadosPainelItem,
	fixed = 2,
): string {
	const inicial = data[0]?.[key];
	const final = data[data.length - 1]?.[key];
	if (
		typeof inicial === "number" &&
		Number.isFinite(inicial) &&
		typeof final === "number" &&
		Number.isFinite(final)
	) {
		return (final - inicial).toFixed(fixed);
	}
	return "-";
}

export function ProgerResumoHeader({
	data,
	className,
}: ProgerResumoHeaderProps) {
	if (!data || data.length === 0) {
		return (
			<div
				className={cn(
					"bg-[#222224] rounded-xl border border-[#303033] p-4 text-gray-400 text-sm",
					className,
				)}
			>
				Nenhum dado disponível
			</div>
		);
	}

	const metrics = [
		{
			label: "Vazão Defluente Montante",
			unit: "m³/s",
			value: "-",
		},
		{
			label: "Vazão Incremental",
			unit: "m³/s",
			value: getAvg(data, "vazaoIncremental", 0),
		},
		{
			label: "Vazão Afluente",
			unit: "m³/s",
			value: getAvg(data, "vazaoAfluente", 0),
		},
		{
			label: "Vazão Turbinada",
			unit: "m³/s",
			value: getAvg(data, "vazaoTurbinada", 0),
		},
		{
			label: "Vazão Vertida Total",
			unit: "m³/s",
			value: getAvg(data, "vazaoVertida", 0),
		},
		{
			label: "Vazão Defluente",
			unit: "m³/s",
			value: getAvg(data, "vazaoDefluente", 0),
		},
		{
			label: "Nível Inicial do Reservatório",
			unit: "m",
			value: getFirst(data, "nivelReservatorio", 2),
		},
		{
			label: "Nível Final do Reservatório",
			unit: "m",
			value: getLast(data, "nivelReservatorio", 2),
		},
		{
			label: "Variação Nível do Reservatório",
			unit: "m",
			value: getVariacao(data, "nivelReservatorio", 2),
		},
		{
			label: "Geração Média Diária",
			unit: "MW",
			value: getAvg(data, "geracaoMW", 0),
		},
		{
			label: "Vol. Útil Final",
			unit: "%",
			value: "-",
		},
	];

	return (
		<div
			className={cn(
				"bg-[#222224] rounded-xl border border-[#303033] overflow-hidden",
				className,
			)}
		>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px bg-[#303033]">
				{metrics.map((m, i) => (
					<div
						key={i}
						className="bg-[#222224] p-3 flex flex-col items-center justify-center text-center"
					>
						<span className="text-[10px] text-gray-400 uppercase tracking-wider leading-tight">
							{m.label}
						</span>
						<span className="text-[10px] text-gray-500 mt-0.5">
							[{m.unit}]
						</span>
						<span className="mt-1.5 text-sm font-semibold text-white bg-[#303033] rounded-full px-3 py-0.5 min-w-[3rem]">
							{m.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
