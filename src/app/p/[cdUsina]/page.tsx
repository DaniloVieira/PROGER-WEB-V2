"use client";

import { ProgramacaoContent } from "@/components/programacao/programacao-content";

// ─── Programação Page (standalone, NO TabShell) ─────────────────────────────
// Rendered outside the (main) group; provides a deep-linkable URL that works
// without the dynamic tab shell (e.g., opened in a new browser tab).

export default function ProgramacaoStandalonePage() {
	return <ProgramacaoContent standalone />;
}
