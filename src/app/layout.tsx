import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "PROGER v2.0",
	description: "Programação de Geração Energética",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR">
			<body className="antialiased overflow-hidden">{children}</body>
		</html>
	);
}
