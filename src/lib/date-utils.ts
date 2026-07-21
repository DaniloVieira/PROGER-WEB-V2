// ─── Date Utilities ──────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
	if (!dateStr) return "-";
	const [year, month, day] = dateStr.split("-");
	return `${day}/${month}/${year}`;
}

export function formatDateTime(isoStr: string): string {
	if (!isoStr) return "-";
	const d = new Date(isoStr);
	return d.toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function toISODate(date: Date): string {
	return date.toISOString().split("T")[0];
}

export function todayISO(): string {
	return toISODate(new Date());
}

export function tomorrowISO(): string {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	return toISODate(d);
}

export function prevDayISO(dateStr: string): string {
	const d = new Date(dateStr + "T00:00:00");
	d.setDate(d.getDate() - 1);
	return toISODate(d);
}
