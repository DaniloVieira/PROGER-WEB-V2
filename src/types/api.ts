// ─── API Response Types ─────────────────────────────────────────────────────

export interface ProgramacaoResumo {
	cdProgramacao: number;
	cdUsina: string;
	dtProgramacao: string;
	situacao: "EM_EDICAO" | "PUBLICADA" | "CANCELADA";
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	size: number;
}

export interface UsinaResumo {
	cdUsina: string;
	nmUsina: string;
	tipo: string;
	potencia?: number;
	ativa: boolean;
	flUsinaEngie?: number;
	flUsinaAtv?: number;
	nrOrdUsina?: number;
}

export interface UsinaHistoricoItem {
	dtProgramacao: string;
	periodo: number;
	geracaoMW: number;
	vazaoVertida: number;
	vazaoIncremental: number;
	nivelReservatorio: number;
	volumeTotal: number;
	vazaoTurbinada: number;
	vazaoDefluente: number;
	vazaoAfluente: number;
	dadosVerificados: boolean;
}

export interface UsinaHistoricoResponse {
	cdUsina: string;
	historico: UsinaHistoricoItem[];
}

export interface DadosPainelItem {
	dtProgramacao: string;
	periodo: number;
	geracaoMW: number;
	disponivel: number;
	vazaoVertida: number;
	vazaoIncremental: number;
	nivelReservatorio: number;
	nivelMaximoReservatorio?: number;
	nivelMinimoReservatorio?: number;
	volumeTotal: number;
	vazaoTurbinada: number;
	vazaoDefluente: number;
	vazaoAfluente: number;
	dadosVerificados: boolean;
}

export interface AlertaRestricaoItem {
	cdTpRestricao: number;
	descricao: string;
}

export interface AlertasRestricoesPainel {
	geracao: AlertaRestricaoItem[];
	hidrico: AlertaRestricaoItem[];
	nivel: AlertaRestricaoItem[];
}

export interface DadosPainelResponse {
	cdUsina: string;
	dados: DadosPainelItem[];
	eixoVazaoGeracao?: number[];
	eixoNivelRes?: number[];
	eixoDispGeracao?: number[];
	alertasRestricoesPainel?: AlertasRestricoesPainel;
	onsPainel?: boolean;
}

export interface ProgramacaoDados {
	cdProgramacao: number;
	cdUsina: string;
	dtProgramacao: string;
	dados: DadoProgramacao[];
}

export interface DadoProgramacao {
	hora: number;
	vazaoTurbinada: number;
	vazaoDefluente: number;
	vazaoAfluente: number;
	nivelReservatorio: number;
	volume: number;
	geracao: number;
}

export interface RestricaoUsina {
	cdUsina: string;
	tipo: string;
	valor: number;
	unidade: string;
	dtInicio: string;
	dtFim: string;
	ativa: boolean;
}

export interface Produtibilidade {
	cdUsina: string;
	dtInicio: string;
	dtFim: string;
	valor: number;
}

export interface DashboardData {
	programacao: ProgramacaoResumo | null;
	restricoes: RestricaoUsina[];
	usina: UsinaResumo;
}

export interface UsuarioInfo {
	cdUsuario: string;
	nmUsuario: string;
	perfis: string[];
	dominios: string[];
}

export interface LoginResponse {
	access_token: string;
	user: UsuarioInfo;
}

export interface DashboardAgregado {
	programacao: ProgramacaoResumo | null;
	programacaoDados: ProgramacaoDados | null;
	restricoes: RestricaoUsina[];
	usina: UsinaResumo;
	produtibilidade: Produtibilidade | null;
}
