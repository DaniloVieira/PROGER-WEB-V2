"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function ConfiguracoesPage() {
	return (
		<div className="p-6 space-y-6">
			<h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
			<p className="text-sm text-gray-500">
				Configurações do sistema (em construção)
			</p>

			<Card>
				<CardHeader>
					<CardTitle>Preferências</CardTitle>
					<CardDescription>
						Configurações de usuário e preferências do sistema.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-gray-500 text-sm">
						Módulo em desenvolvimento. As configurações incluem:
					</p>
					<ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
						<li>Perfil de acesso e domínios</li>
						<li>Preferências de exibição (timezone, unidades)</li>
						<li>Configuração de notificações</li>
						<li>Gestão de usinas favoritas</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
