"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toISODate } from "@/lib/date-utils";

// ─── ProgerDatePicker ──────────────────────────────────────────────────────
// Datepicker nativo estilizado no tema dark PROGER (react-day-picker não
// está instalado). Inclui botões de navegação prev/next.
// ───────────────────────────────────────────────────────────────────────────

interface ProgerDatePickerProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function ProgerDatePicker({
	value,
	onChange,
	className,
}: ProgerDatePickerProps) {
	const handlePrev = () => {
		const d = value ? new Date(value + "T00:00:00") : new Date();
		d.setDate(d.getDate() - 1);
		onChange(toISODate(d));
	};

	const handleNext = () => {
		const d = value ? new Date(value + "T00:00:00") : new Date();
		d.setDate(d.getDate() + 1);
		onChange(toISODate(d));
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value);
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 rounded-md px-2 py-0.5",
				className,
			)}
			style={{ backgroundColor: "#3c3c3c", minHeight: "30px" }}
		>
			<button
				onClick={handlePrev}
				className="p-1 text-white hover:text-gray-300 transition-colors"
				aria-label="Dia anterior"
			>
				<ChevronLeft className="h-4 w-4" />
			</button>

			<div className="flex items-center gap-1">
				<Calendar className="h-4 w-4 text-white" />
				<input
					type="date"
					value={value}
					onChange={handleInputChange}
					className="bg-transparent text-white text-sm border-none outline-none cursor-pointer"
					style={{ colorScheme: "dark", width: "130px" }}
				/>
			</div>

			<button
				onClick={handleNext}
				className="p-1 text-white hover:text-gray-300 transition-colors"
				aria-label="Próximo dia"
			>
				<ChevronRight className="h-4 w-4" />
			</button>
		</div>
	);
}
