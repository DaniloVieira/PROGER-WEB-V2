"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth";
import { login } from "@/services/api";
import { ProgerInput } from "@/components/proger/proger-input";
import { ProgerButton } from "@/components/proger/proger-button";
import { toast } from "sonner";
import Image from "next/image";

// ─── Login Schema ────────────────────────────────────────────────────────────

const loginSchema = z.object({
	usuario: z.string().min(1, "Informe seu usuário"),
	senha: z.string().min(1, "Informe sua senha"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Background aleatório ────────────────────────────────────────────────────

const BACKGROUNDS = [
	"/images/background/background1.jpg",
	"/images/background/background2.jpg",
	"/images/background/background3.jpg",
	"/images/background/background4.jpg",
	"/images/background/background5.jpg",
	"/images/background/background6.jpg",
	"/images/background/background7.jpg",
	"/images/background/background8.jpg",
	"/images/background/background9.jpg",
	"/images/background/background10.jpg",
	"/images/background/background11.jpg",
	"/images/background/background12.jpg",
	"/images/background/background13.jpg",
	"/images/background/background14.jpg",
];

function RandomBackground() {
	const [current, setCurrent] = useState(0);

	useEffect(() => {
		// Sorteia a imagem inicial apenas no cliente para evitar hydration mismatch
		setCurrent(Math.floor(Math.random() * BACKGROUNDS.length));

		const interval = setInterval(() => {
			setCurrent((prev) => (prev + 1) % BACKGROUNDS.length);
		}, 15000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="animate-appear-from-right relative hidden flex-1 overflow-hidden md:block">
			{BACKGROUNDS.map((src, index) => (
				<div
					key={src}
					className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
					style={{
						backgroundImage: `url(${src})`,
						opacity: index === current ? 1 : 0,
					}}
				/>
			))}
		</div>
	);
}

// ─── Login Page ──────────────────────────────────────────────────────────────

export function LoginPage() {
	const router = useRouter();
	const { setAuth } = useAuthStore();
	const [loading, setLoading] = useState(false);

	const loginForm = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
		defaultValues: { usuario: "", senha: "" },
	});

	const handleLogin = async (data: LoginForm) => {
		setLoading(true);
		try {
			const response = await login(data.usuario, data.senha);
			setAuth(response.access_token, response.user);
			toast.success(`Bem-vindo(a), ${response.user.nmUsuario}!`);
			router.push("/dashboard");
		} catch (error) {
			let message = "Erro ao fazer login. Verifique suas credenciais.";
			if (
				error &&
				typeof error === "object" &&
				"response" in error &&
				error.response &&
				typeof error.response === "object" &&
				"data" in error.response &&
				error.response.data &&
				typeof error.response.data === "object" &&
				"message" in error.response.data &&
				typeof error.response.data.message === "string"
			) {
				message = error.response.data.message;
			} else if (
				error &&
				typeof error === "object" &&
				"message" in error &&
				typeof error.message === "string"
			) {
				message = error.message;
			}
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex h-screen w-full items-stretch overflow-hidden">
			{/* Painel Esquerdo — Formulário */}
			<div
				className="animate-appear-from-left flex flex-col items-center overflow-auto"
				style={{
					width: "36%",
					minWidth: "340px",
					backgroundColor: "#090b0d",
					paddingTop: "30px",
				}}
			>
				<div className="flex w-full flex-col items-center px-6">
					{/* Logo Engie */}
					<div
						className="flex w-full justify-center"
						style={{ margin: "30px 0", minHeight: 50 }}
					>
						<Image
							src="/images/logoEngie.png"
							alt="Logo Engie"
							width={120}
							height={50}
							className="object-contain"
							priority
						/>
					</div>

					{/* Logo PROGER */}
					<div
						className="flex w-full justify-center"
						style={{ margin: "30px 0", minHeight: 100 }}
					>
						<Image
							src="/images/logo.png"
							alt="Logo PROGER"
							width={180}
							height={80}
							className="object-contain"
							priority
						/>
					</div>

					{/* Formulário */}
					<div className="text-left" style={{ margin: "30px 0 40px 0", width: 340 }}>
						<h1 className="text-2xl font-semibold" style={{ color: "white", marginBottom: 8 }}>
							PROGER
						</h1>
						<h2 className="text-lg font-normal" style={{ color: "white", marginBottom: 8 }}>
							Programação de Geração Energética
						</h2>
						<h4
							className="text-base font-normal"
							style={{ color: "#f4ede8", marginBottom: 24 }}
						>
							Informe seu login
						</h4>

						<form
							onSubmit={loginForm.handleSubmit(handleLogin)}
							className="space-y-4"
							noValidate
						>
							<ProgerInput
								label="Usuário"
								id="usuario"
								registerProps={loginForm.register("usuario")}
								error={loginForm.formState.errors.usuario?.message}
							/>
							<ProgerInput
								label="Senha"
								id="senha"
								type="password"
								registerProps={loginForm.register("senha")}
								error={loginForm.formState.errors.senha?.message}
							/>
							<ProgerButton type="submit" disabled={loading}>
								{loading ? "Entrando..." : "Entrar"}
							</ProgerButton>
						</form>
					</div>
				</div>
			</div>

			{/* Painel Direito — Imagem de Fundo */}
			<RandomBackground />
		</div>
	);
}
