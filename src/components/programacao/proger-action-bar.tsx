"use client";

import * as React from "react";
import { ProgerActionButton } from "@/components/proger/proger-action-button";
import {
	Copy,
	Upload,
	Play,
	RotateCcw,
	Check,
	Import,
	FileText,
} from "lucide-react";

// ─── ProgerActionBar ────────────────────────────────────────────────────────
// Barra de botões de ação acima da grid de programação.
// Botões: Copiar ONS, Publicar, Simular, Reverter, Aceitar, Importar Manual, Gerar PDP.
// ───────────────────────────────────────────────────────────────────────────

export interface ProgerActionBarProps {
	onCopiarONS?: () => void;
	onPublicar?: () => void;
	onSimular?: () => void;
	onReverter?: () => void;
	onAceitar?: () => void;
	onImportarManual?: () => void;
	onGerarPDP?: () => void;
	loading?: boolean;
}

export function ProgerActionBar({
	onCopiarONS,
	onPublicar,
	onSimular,
	onReverter,
	onAceitar,
	onImportarManual,
	onGerarPDP,
	loading,
}: ProgerActionBarProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<ProgerActionButton
				icon={<Copy className="h-3 w-3" />}
				onClick={onCopiarONS}
				disabled={loading}
				data-testid="btn-copiar-ons"
			>
				COPIAR ONS
			</ProgerActionButton>

			<ProgerActionButton
				icon={<Upload className="h-3 w-3" />}
				onClick={onPublicar}
				disabled={loading}
				data-testid="btn-publicar"
			>
				PUBLICAR
			</ProgerActionButton>

			<ProgerActionButton
				icon={<Play className="h-3 w-3" />}
				onClick={onSimular}
				disabled={loading}
				data-testid="btn-simular"
			>
				SIMULAR
			</ProgerActionButton>

			<ProgerActionButton
				icon={<RotateCcw className="h-3 w-3" />}
				onClick={onReverter}
				disabled={loading}
				data-testid="btn-reverter"
			>
				REVERTER
			</ProgerActionButton>

			<ProgerActionButton
				icon={<Check className="h-3 w-3" />}
				onClick={onAceitar}
				disabled={loading}
				data-testid="btn-aceitar"
			>
				ACEITAR
			</ProgerActionButton>

			<ProgerActionButton
				icon={<Import className="h-3 w-3" />}
				onClick={onImportarManual}
				disabled={loading}
				data-testid="btn-importar"
			>
				IMPORTAR MANUAL
			</ProgerActionButton>

			<ProgerActionButton
				icon={<FileText className="h-3 w-3" />}
				onClick={onGerarPDP}
				disabled={loading}
				data-testid="btn-gerar-pdp"
			>
				GERAR PDP
			</ProgerActionButton>
		</div>
	);
}
