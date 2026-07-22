"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	listProgramacoes,
	getProgramacaoDados,
	getDadosPainel,
	updateProgramacaoDados,
	publicarProgramacao,
	calcularHidraulico,
} from "@/services/api";
import type {
	ProgramacaoResumo,
	ProgramacaoDados,
	DadosPainelResponse,
	CalcularHidraulicoRequest,
	CalcularHidraulicoResponse,
} from "@/types/api";
import { toast } from "sonner";

// ─── useProgramacaoQuery ────────────────────────────────────────────────────
// Resolve cdUsina + dtProgramacao → cdProgramacao via listagem, depois busca
// dados da programação e dados do painel em paralelo.

export interface ProgramacaoCompleta {
	programacao: ProgramacaoResumo;
	dados: ProgramacaoDados;
	painel: DadosPainelResponse;
}

export function useProgramacaoQuery(cdUsina: string, dtProgramacao: string) {
	return useQuery<ProgramacaoCompleta, Error>({
		queryKey: ["programacao-completa", cdUsina, dtProgramacao],
		queryFn: async () => {
			const list = await listProgramacoes({
				cdUsina,
				dtProgramacao,
				page: 1,
				size: 1,
			});
			const prog = list.items[0];
			if (!prog) {
				throw new Error(
					`Programação não encontrada para ${cdUsina} em ${dtProgramacao}`,
				);
			}
			const [dados, painel] = await Promise.all([
				getProgramacaoDados(prog.cdProgramacao),
				getDadosPainel(cdUsina, dtProgramacao),
			]);
			return { programacao: prog, dados, painel };
		},
		enabled: !!cdUsina && !!dtProgramacao,
		staleTime: 60_000,
	});
}

// ─── useUpdateProgramacaoDadosMutation ─────────────────────────────────────

export interface UpdateProgramacaoPayload {
	cdProgramacao: number;
	dados: Array<{
		periodo: number;
		geracaoMW?: number;
		vazaoVertida?: number;
		vazaoIncremental?: number;
	}>;
	dtAlteracao?: string;
}

export function useUpdateProgramacaoDadosMutation() {
	const queryClient = useQueryClient();

	return useMutation<
		{ cdProgramacao: number; situacao: string; mensagem: string },
		Error,
		UpdateProgramacaoPayload
	>({
		mutationFn: (payload) =>
			updateProgramacaoDados(payload.cdProgramacao, {
				dados: payload.dados,
				dtAlteracao: payload.dtAlteracao,
			}),
		onSuccess: (_data, variables) => {
			toast.success("Dados salvos com sucesso!");
			queryClient.invalidateQueries({
				queryKey: ["programacao-completa"],
			});
			queryClient.invalidateQueries({
				queryKey: ["programacao-dados", variables.cdProgramacao],
			});
		},
		onError: (error) => {
			toast.error(`Erro ao salvar dados: ${error.message}`);
		},
	});
}

// ─── usePublicarProgramacaoMutation ─────────────────────────────────────────

export function usePublicarProgramacaoMutation() {
	const queryClient = useQueryClient();

	return useMutation<void, Error, number>({
		mutationFn: (cdProgramacao) => publicarProgramacao(cdProgramacao),
		onSuccess: () => {
			toast.success("Programação publicada com sucesso!");
			queryClient.invalidateQueries({
				queryKey: ["programacao-completa"],
			});
		},
		onError: (error) => {
			toast.error(`Erro ao publicar: ${error.message}`);
		},
	});
}

// ─── useCalcularHidraulicoMutation ─────────────────────────────────────────

export function useCalcularHidraulicoMutation() {
	return useMutation<CalcularHidraulicoResponse, Error, CalcularHidraulicoRequest>({
		mutationFn: (payload) => calcularHidraulico(payload),
		onSuccess: () => {
			toast.success("Cálculo hidráulico concluído!");
		},
		onError: (error) => {
			toast.error(`Erro no cálculo hidráulico: ${error.message}`);
		},
	});
}
