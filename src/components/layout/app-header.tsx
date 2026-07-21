"use client";

import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notifications";
import { useTabStore } from "@/stores/tabs";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── App Header ─────────────────────────────────────────────────────────────
// Header dark estilo PROGER antigo: fundo #090b0d, sombra #33393b, textos claros.
// ──────────────────────────────────────────────────────────────────────────────

export function AppHeader() {
	const { user, logout } = useAuthStore();
	const { notifications, unreadCount, markAllAsRead } = useNotificationStore();
	const { addTab } = useTabStore();
	const router = useRouter();

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	const handleSettings = () => {
		addTab({
			id: "configuracoes",
			title: "⚙️ Configurações",
			path: "/configuracoes",
		});
	};

	return (
		<header
			className="flex items-center justify-between border-b-2 border-[#33393b] bg-[#090b0d] px-6 py-1 text-white"
			style={{
				height: 37,
				boxShadow: "2px 2px 2px #33393b",
				marginBottom: 2,
			}}
		>
			{/* Logo + título */}
			<div className="flex items-center gap-3">
				<div
					className="flex h-[40px] items-center justify-center pr-5"
					style={{ borderRight: "2px solid #33393b" }}
				>
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
						P
					</div>
					<div className="ml-3">
						<h1 className="text-base font-semibold text-white" style={{ marginLeft: 10, marginRight: 8 }}>
							Painel Programação Diária
						</h1>
					</div>
				</div>
			</div>

			{/* Ações */}
			<div className="flex items-center gap-4">
				{/* Notificações */}
				<DropdownMenu>
					<DropdownMenuTrigger className="relative p-2 rounded-lg hover:bg-[#33393b]/30 transition-colors">
						<Bell className="h-5 w-5 text-gray-300" />
						{unreadCount() > 0 && (
							<Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
								{unreadCount()}
							</Badge>
						)}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-80">
						<div className="flex items-center justify-between px-3 py-2 border-b">
							<span className="font-medium text-sm">Notificações</span>
							{notifications.length > 0 && (
								<button
									onClick={markAllAsRead}
									className="text-xs text-blue-600 hover:underline"
								>
									Marcar todas como lidas
								</button>
								)}
						</div>
						{notifications.length === 0 ? (
							<div className="p-4 text-center text-sm text-gray-500">
								Nenhuma notificação
							</div>
						) : (
							notifications.slice(0, 5).map((n) => (
								<DropdownMenuItem
									key={n.id}
									className="flex flex-col items-start gap-1 p-3"
								>
									<span className="text-sm font-medium">{n.title}</span>
									<span className="text-xs text-gray-500">{n.message}</span>
								</DropdownMenuItem>
							))
							)}
						</DropdownMenuContent>
					</DropdownMenu>

				{/* Configurações */}
				<button
					onClick={handleSettings}
					className="p-2 rounded-lg hover:bg-[#33393b]/30 transition-colors"
					title="Configurações"
				>
					<Settings className="h-5 w-5 text-gray-300" />
				</button>

				{/* Usuário */}
				<DropdownMenu>
					<DropdownMenuTrigger
						className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#33393b]/30 transition-colors"
						style={{ borderLeft: "2px solid #33393b" }}
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
							<User className="h-4 w-4" />
						</div>
						<span
							className="text-sm font-medium text-gray-300"
							style={{ fontVariantCaps: "all-small-caps" }}
						>
							{user?.nmUsuario || "Usuário"}
						</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem disabled>
							<span className="text-xs text-gray-500">{user?.cdUsuario}</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout} className="text-red-600">
							<LogOut className="mr-2 h-4 w-4" />
							Sair
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
