"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── ProgerButton ──────────────────────────────────────────────────────────
// Componente customizado que encapsula Button do shadcn/ui.
// Nunca use Button diretamente nas páginas — use ProgerButton.
// ────────────────────────────────────────────────────────────────────────────

type ProgerButtonProps = React.ComponentProps<typeof Button>;

export const ProgerButton = React.forwardRef<
	HTMLButtonElement,
	ProgerButtonProps
>(({ className, ...props }, ref) => {
	return (
		<Button
			ref={ref}
			data-slot="proger-button"
			className={cn("w-full text-lg font-medium transition-colors duration-200", className)}
			style={{
				backgroundColor: "#5d9cec",
				color: "#fff",
				...props.style,
			}}
			{...props}
		/>
	);
});

ProgerButton.displayName = "ProgerButton";
