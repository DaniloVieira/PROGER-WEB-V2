"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── ProgerActionButton ────────────────────────────────────────────────────
// Botão de ação secundário no estilo dark do painel PROGER antigo.
// Use para ações de header como "COPIAR DADOS ONS" e "PUBLICAR".
// ───────────────────────────────────────────────────────────────────────────

type ProgerActionButtonProps = React.ComponentProps<typeof Button> & {
	icon?: React.ReactNode;
};

export const ProgerActionButton = React.forwardRef<
	HTMLButtonElement,
	ProgerActionButtonProps
>(({ className, icon, children, ...props }, ref) => {
	return (
		<Button
			ref={ref}
			data-slot="proger-action-button"
			variant="ghost"
			className={cn(
				"ml-[15px] inline-flex items-center gap-1 rounded-md border-2 border-[#33393b] bg-black text-[11px] font-medium text-[#33393b] transition-colors duration-200 hover:bg-[#33393b] hover:text-white h-[25px] px-3",
				className,
			)}
			{...props}
		>
			{icon}
			{children}
		</Button>
	);
});

ProgerActionButton.displayName = "ProgerActionButton";
