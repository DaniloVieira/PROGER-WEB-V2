"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── ProgerInput ─────────────────────────────────────────────────────────────
// Componente customizado que encapsula Label + Input + mensagem de erro.
// Nunca use Input/Label diretamente nas páginas — use ProgerInput.
// ────────────────────────────────────────────────────────────────────────────

interface ProgerInputProps extends React.ComponentProps<"input"> {
	label: string;
	error?: string;
	registerProps?: Record<string, unknown>;
}

export const ProgerInput = React.forwardRef<HTMLInputElement, ProgerInputProps>(
	({ label, error, className, registerProps, ...props }, ref) => {
		const inputId = props.id ?? props.name ?? `proger-input-${label}`;

		return (
			<div className="space-y-2">
				<Label
					htmlFor={inputId}
					style={{ color: "#f4ede8" }}
					className="text-sm leading-none font-medium"
				>
					{label}
				</Label>
				<Input
					ref={ref}
					id={inputId}
					data-slot="proger-input"
					className={cn(
						"border-[#2c3035] bg-[#232129] text-white placeholder:text-[#666360]/55 focus-visible:ring-[#5d9cec]",
						className,
					)}
					{...registerProps}
					{...props}
				/>
				{error && <p className="text-sm text-red-400">{error}</p>}
			</div>
		);
	},
);

ProgerInput.displayName = "ProgerInput";
