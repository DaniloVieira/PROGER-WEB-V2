"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ─── ProgerConfirmDialog ─────────────────────────────────────────────────
// Dialogo de confirmação estilizado para o tema dark PROGER.
// ───────────────────────────────────────────────────────────────────────────

interface ProgerConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
}

export function ProgerConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	onConfirm,
}: ProgerConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="bg-[#222224] border-[#303033] text-white sm:max-w-sm"
			>
				<DialogHeader>
					<DialogTitle className="text-white">{title}</DialogTitle>
					<DialogDescription className="text-[#B4B4B5]">
						{description}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="border-t border-[#303033] bg-transparent">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="border-[#303033] bg-transparent text-white hover:bg-[#303033] hover:text-white"
					>
						{cancelText}
					</Button>
					<Button
						onClick={() => {
							onConfirm();
							onOpenChange(false);
						}}
						className="bg-[#5d9cec] text-white hover:bg-[#5d9cec]/80"
					>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
