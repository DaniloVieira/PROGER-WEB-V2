"use client";

import React from "react";
import { createPortal } from "react-dom";

interface ProgerTooltipProps {
	children: React.ReactNode;
	content: string;
	position?: "top" | "bottom" | "left" | "right";
}

export function ProgerTooltip({
	children,
	content,
	position = "top",
}: ProgerTooltipProps) {
	const [isVisible, setIsVisible] = React.useState(false);
	const [coords, setCoords] = React.useState({ x: 0, y: 0 });
	const containerRef = React.useRef<HTMLDivElement>(null);

	const handleMouseEnter = () => setIsVisible(true);
	const handleMouseLeave = () => setIsVisible(false);

	// Estilos inline para o tooltip — aparecem instantaneamente
	const tooltipStyle: React.CSSProperties = {
		position: "fixed",
		left: coords.x,
		top: coords.y,
		zIndex: 9999,
		padding: "6px 10px",
		backgroundColor: "#1a1a1d",
		color: "#ffffff",
		fontSize: 12,
		borderRadius: 4,
		border: "1px solid #303033",
		whiteSpace: "pre-line",
		pointerEvents: "none",
		opacity: isVisible ? 1 : 0,
		transition: "opacity 0.08s ease-out",
		boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
		maxWidth: 280,
		lineHeight: 1.4,
	};

	const updatePosition = () => {
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		let x = rect.left + rect.width / 2;
		let y = rect.top;

		switch (position) {
			case "top":
				y = rect.top - 8;
				break;
			case "bottom":
				y = rect.bottom + 8;
				break;
			case "left":
				x = rect.left - 8;
				break;
			case "right":
				x = rect.right + 8;
				break;
		}

		setCoords({ x, y });
	};

	React.useEffect(() => {
		if (isVisible) {
			updatePosition();
			window.addEventListener("scroll", updatePosition, true);
			window.addEventListener("resize", updatePosition);
			return () => {
				window.removeEventListener("scroll", updatePosition, true);
				window.removeEventListener("resize", updatePosition);
			};
		}
	}, [isVisible]);

	return (
		<>
			<div
				ref={containerRef}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				style={{ display: "inline-flex" }}
			>
				{children}
			</div>
			{isVisible &&
				createPortal(
					<div style={tooltipStyle} role="tooltip">
						{content}
					</div>,
					document.body,
				)}
		</>
	);
}
