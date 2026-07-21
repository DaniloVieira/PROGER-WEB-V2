"use client";

import * as React from "react";
import { ProgerChartCard } from "@/components/proger/proger-chart-card";
import type { ProgerChartCardProps } from "@/components/proger/proger-chart-card";

// ─── UsinaChartGrid ────────────────────────────────────────────────────────
// Grid responsivo de 4 colunas para cards ProgerChartCard.
// Nunca renderize cards diretamente no dashboard — use UsinaChartGrid.
// ────────────────────────────────────────────────────────────────────────────

export interface UsinaChartGridProps {
	usinas: ProgerChartCardProps[];
}

export function UsinaChartGrid({ usinas }: UsinaChartGridProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
			{usinas.map((props, idx) => (
				<ProgerChartCard
					key={props.usina.cdUsina ?? `usina-${idx}`}
					{...props}
				/>
			))}
		</div>
	);
}
