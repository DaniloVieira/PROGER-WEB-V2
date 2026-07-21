"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { getProgramacaoDados, getRestricoes } from "@/services/api";
import { ProgerGrid } from "@/components/grid/proger-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { DadoProgramacao } from "@/types/api";

// ─── Programação Page ────────────────────────────────────────────────────────

export default function ProgramacaoPage() {
	const params = useParams();
	const cdUsina = params.cdUsina as string;

	const { data: programacao, isLoading: loadingProg } = useQuery({
		queryKey: ["programacao-dados", cdUsina],
		queryFn: () => getProgramacaoDados(1), // TODO: get real cdProgramacao from list
		enabled: !!cdUsina,
	});

	const { data: restricoes } = useQuery({
		queryKey: ["restricoes", cdUsina],
		queryFn: () => getRestricoes(cdUsina),
		enabled: !!cdUsina,
	});

	const handleDataChange = (newData: DadoProgramacao[]) => {
		// TODO: dispatch update via API
		console.log("Data changed:", newData);
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Link href="/dashboard">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-1" />
						Voltar
					</Button>
				</Link>
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Programação — {cdUsina}
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Edição de programação horária
					</p>
				</div>
			</div>

			{/* Restrictions alerts */}
			{restricoes && restricoes.length > 0 && (
				<Card className="border-amber-200 bg-amber-50">
					<CardHeader className="pb-2">
						<CardTitle className="text-base flex items-center gap-2 text-amber-700">
							<AlertTriangle className="h-5 w-5" />
							Restrições Ativas ({restricoes.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{restricoes.map((r, i) => (
								<Badge
									key={i}
									variant="outline"
									className="border-amber-300 text-amber-700"
								>
									{r.tipo}: {r.valor} {r.unidade}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Grid */}
			<Card>
				<CardHeader>
					<CardTitle>Dados Horários</CardTitle>
				</CardHeader>
				<CardContent>
					{loadingProg ? (
						<Skeleton className="h-96 w-full rounded-lg" />
					) : programacao?.dados ? (
						<ProgerGrid
							data={programacao.dados}
							onDataChange={handleDataChange}
						/>
					) : (
						<div className="text-center py-12 text-gray-500">
							Nenhuma programação encontrada para esta usina.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
