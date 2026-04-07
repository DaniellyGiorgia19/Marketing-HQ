export default async function handler(req: { url?: string }, res: {
  status: (code: number) => { json: (body: unknown) => void };
  json: (body: unknown) => void;
}) {
  const requestUrl = req.url || "";

  if (requestUrl === "/api/health" || requestUrl.startsWith("/api/health?")) {
    return res.json({ status: "ok", message: "Marketing HQ API is running" });
  }

  try {
    const mod = await import("../server/app");
    const app = mod.default;
    return app(req, res);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao inicializar API serverless:", error);
    return res.status(500).json({
      error: "Erro ao inicializar API",
      detail
    });
  }
}
