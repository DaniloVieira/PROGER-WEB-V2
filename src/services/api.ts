import api from "@/lib/api";
import type {
	LoginResponse,
	ProgramacaoResumo,
	PaginatedResponse,
	UsinaResumo,
	UsinaHistoricoResponse,
	ProgramacaoDados,
	RestricaoUsina,
	Produtibilidade,
	DashboardAgregado,
	DadosPainelResponse,
} from "@/types/api";

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(
	username: string,
	password: string,
): Promise<LoginResponse> {
	const { data } = await api.post<LoginResponse>("/auth/login", {
		username,
		password,
	});
	return data;
}

export async function loginWithToken(token: string): Promise<LoginResponse> {
	const { data } = await api.post<LoginResponse>("/auth/login/token", {
		token,
	});
	return data;
}

// ─── Programações ────────────────────────────────────────────────────────────

export async function listProgramacoes(
	params?: Record<string, unknown>,
): Promise<PaginatedResponse<ProgramacaoResumo>> {
	const { data } = await api.get<PaginatedResponse<ProgramacaoResumo>>(
		"/programacoes",
		{ params },
	);
	return data;
}

export async function getProgramacaoDados(
	id: number,
	params?: Record<string, unknown>,
): Promise<ProgramacaoDados> {
	const { data } = await api.get<ProgramacaoDados>(
		`/programacoes/${id}/dados`,
		{ params },
	);
	return data;
}

export async function publicarProgramacao(id: number): Promise<void> {
	await api.post(`/programacoes/${id}/publicar`);
}

// ─── Usinas ──────────────────────────────────────────────────────────────────

export async function listarUsinas(): Promise<UsinaResumo[]> {
	const { data } =
		await api.get<
			Array<{
				cdUsina: string;
				nomeUsina: string;
				tipo: string;
				situacao: string;
				flUsinaEngie: number;
				flUsinaAtv: number;
				nrOrdUsina: number;
			}>
		>("/usinas");
	return data.map((u) => ({
		cdUsina: u.cdUsina,
		nmUsina: u.nomeUsina,
		tipo: u.tipo,
		ativa: u.situacao === "ATIVA",
		flUsinaEngie: u.flUsinaEngie,
		flUsinaAtv: u.flUsinaAtv,
		nrOrdUsina: u.nrOrdUsina,
	}));
}

export async function getUsinaHistorico(
	cdUsina: string,
	params?: Record<string, unknown>,
): Promise<UsinaHistoricoResponse> {
	const { data } = await api.get<UsinaHistoricoResponse>(
		`/usinas/${cdUsina}/historico`,
		{ params },
	);
	return data;
}

export async function getDadosPainel(
	cdUsina: string,
	dtProgramacao: string,
): Promise<DadosPainelResponse> {
	const { data } = await api.get<DadosPainelResponse>(
		"/programacoes/dados-painel",
		{ params: { cdUsina, dtProgramacao } },
	);
	return data;
}

// ─── Restrições ──────────────────────────────────────────────────────────────

export async function getRestricoes(
	cdUsina: string,
	params?: Record<string, unknown>,
): Promise<RestricaoUsina[]> {
	const { data } = await api.get<RestricaoUsina[]>(`/restricoes/${cdUsina}`, {
		params,
	});
	return data;
}

// ─── Produtibilidade ─────────────────────────────────────────────────────────

export async function getProdutibilidade(
	cdUsina: string,
	params?: Record<string, unknown>,
): Promise<Produtibilidade> {
	const { data } = await api.get<Produtibilidade>(
		`/produtibilidade/${cdUsina}`,
		{ params },
	);
	return data;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboard(
	cdUsina: string,
	dtProgramacao: string,
): Promise<DashboardAgregado> {
	const { data } = await api.get<DashboardAgregado>(
		`/dashboard/${cdUsina}/${dtProgramacao}`,
	);
	return data;
}
