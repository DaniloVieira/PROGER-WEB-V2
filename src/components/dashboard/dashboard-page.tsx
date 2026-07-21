"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { listarUsinas, getDadosPainel } from "@/services/api";
import { useTabStore } from "@/stores/tabs";
import { ProgerSkeleton } from "@/components/proger/proger-skeleton";
import { ProgerDatePicker } from "@/components/proger/proger-date-picker";
import { ProgerActionButton } from "@/components/proger/proger-action-button";
import { ProgerConfirmDialog } from "@/components/proger/proger-confirm-dialog";
import { ProgerChartCard } from "@/components/proger/proger-chart-card";
import { toast } from "sonner";
import { Copy, Monitor } from "lucide-react";
import { tomorrowISO } from "@/lib/date-utils";
import type { DadosPainelItem } from "@/types/api";
import type { ProgerChartDataPoint } from "@/components/proger/proger-chart-card";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatIntervaloTempo(index: number): string {
	const totalMinutes = index * 30;
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function mapearHistoricoParaChart(
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

// ─── Dashboard Page ────────────────────────────────────────────────────────

export function DashboardPage() {
	const { addTab } = useTabStore();
	const [date, setDate] = useState(tomorrowISO());
	const [confirmAction, setConfirmAction] = useState<"ons" | "publicar" | null>(
		null,
	);

	const { data: usinas, isLoading: loadingUsinas } = useQuery({
		queryKey: ["usinas"],
		queryFn: listarUsinas,
	});

	// Busca dados agregados do painel (programação + historiador) de D-1 + D de cada usina
	const historicoQueries = useQueries({
		queries:
			usinas?.map((usina) => ({
				queryKey: ["dados-painel", usina.cdUsina, date],
				queryFn: () => getDadosPainel(usina.cdUsina, date),
				enabled: !!usina.cdUsina && !!date,
			})) ?? [],
	});

	const isLoadingHistorico = historicoQueries.some((q) => q.isLoading);

	const usinasComDados = useMemo(() => {
		if (!usinas) return [];
		const fallbackEixo = (values: number[]): number[] => {
			if (values.length === 0) return [0, 1, 2, 3, 4];
			const min = Math.min(...values);
			const max = Math.max(...values);
			if (min === max) return [min];
			const step = (max - min) / 4;
			return Array.from({ length: 5 }, (_, i) =>
				Number((min + step * i).toFixed(2)),
			);
		};

		console.log("usinasComDados", usinas, historicoQueries);

		return usinas.map((usina, index) => {
			const historico = historicoQueries[index]?.data?.dados ?? [];
			const dadosGrafico = mapearHistoricoParaChart(historico, date);
			const apiResponse = historicoQueries[index]?.data;

			const eixoVazaoGeracao =
				apiResponse?.eixoVazaoGeracao && apiResponse.eixoVazaoGeracao.length > 0
					? apiResponse.eixoVazaoGeracao
					: fallbackEixo(dadosGrafico.map((d) => d.vazaoAfluente ?? 0));
			const eixoNivelRes =
				apiResponse?.eixoNivelRes && apiResponse.eixoNivelRes.length > 0
					? apiResponse.eixoNivelRes
					: fallbackEixo(dadosGrafico.map((d) => d.nivelReservatorio ?? 0));
			const eixoDispGeracao =
				apiResponse?.eixoDispGeracao && apiResponse.eixoDispGeracao.length > 0
					? apiResponse.eixoDispGeracao
					: fallbackEixo(dadosGrafico.map((d) => d.geracaoRef ?? 0));

			return {
				usina,
				dadosGrafico,
				eixoVazaoGeracao,
				eixoNivelRes,
				eixoDispGeracao,
				alertasRestricoesPainel: apiResponse?.alertasRestricoesPainel,
				onsPainel: apiResponse?.onsPainel,
			};
		});
	}, [usinas, historicoQueries]);

	const handleCopyONS = () => setConfirmAction("ons");
	const handlePublicar = () => setConfirmAction("publicar");

	const executeAction = () => {
		if (confirmAction === "ons") {
			toast.success("Dados ONS copiados com sucesso!");
		} else if (confirmAction === "publicar") {
			toast.success("Programação publicada com sucesso!");
		}
		setConfirmAction(null);
	};

	const confirmTitle = confirmAction === "ons" ? "Copiar ONS" : "Publicar";
	const confirmDescription =
		confirmAction === "ons"
			? `Deseja copiar os dados ONS para a data selecionada (${date})?`
			: `Deseja publicar a programação para a data selecionada (${date})?`;
	const confirmText = confirmAction === "ons" ? "COPIAR DADOS ONS" : "PUBLICAR";

	return (
		<div
			className="p-4 space-y-4"
			style={{ backgroundColor: "#090b0d", minHeight: "100%" }}
		>
			{/* Top control bar */}
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-base font-semibold text-white whitespace-nowrap">
					Painel Programação Diária
				</h1>

				<ProgerDatePicker value={date} onChange={setDate} />

				<div className="ml-auto flex items-center gap-3">
					<ProgerActionButton
						icon={<Copy className="h-3 w-3" />}
						onClick={handleCopyONS}
					>
						COPIAR DADOS ONS
					</ProgerActionButton>

					<ProgerActionButton
						icon={<Monitor className="h-3 w-3" />}
						onClick={handlePublicar}
					>
						PUBLICAR
					</ProgerActionButton>
				</div>
			</div>

			{/* Chart grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
				{loadingUsinas || isLoadingHistorico ? (
					Array.from({ length: 8 }).map((_, i) => (
						<div
							key={`skel-${i}`}
							className="rounded-md border-2 border-[#303033] p-3 space-y-2"
						>
							<ProgerSkeleton className="h-4 w-24" />
							<ProgerSkeleton className="h-[145px] w-full" />
							<ProgerSkeleton className="h-[55px] w-full" />
						</div>
					))
				) : usinasComDados.length > 0 ? (
					usinasComDados.map((item) => (
						<div
							key={item.usina.cdUsina}
							// className="rounded-md border-2 border-[#303033] overflow-hidden"
							className="overflow-hidden"
							// style={{ backgroundColor: "#222224" }}
						>
							<ProgerChartCard
								usina={item.usina}
								dadosGrafico={item.dadosGrafico}
								eixoVazaoGeracao={item.eixoVazaoGeracao}
								eixoNivelRes={item.eixoNivelRes}
								eixoDispGeracao={item.eixoDispGeracao}
								alertasRestricoesPainel={item.alertasRestricoesPainel}
								onsPainel={item.onsPainel}
								onUsinaClick={(u) =>
									addTab({
										id: `usina-${u.cdUsina}`,
										title: u.cdUsina,
										path: `/programacao/${u.cdUsina}`,
									})
								}
							/>
						</div>
					))
				) : (
					<div className="col-span-full text-center text-sm text-[#B4B4B5] py-12">
						Nenhuma usina encontrada.
					</div>
				)}
			</div>

			<ProgerConfirmDialog
				open={confirmAction !== null}
				onOpenChange={(open) => !open && setConfirmAction(null)}
				title={confirmTitle}
				description={confirmDescription}
				confirmText={confirmText}
				onConfirm={executeAction}
			/>
		</div>
	);
}
