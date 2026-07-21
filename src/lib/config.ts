// ─── Environment Configuration ──────────────────────────────────────────────

const env = {
	apiGatewayUrl:
		process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3010/api/v2",
	wsUrl: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3010",
	appName: "PROGER v2.0",
};

export default env;
