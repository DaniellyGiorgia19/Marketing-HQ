export default function handler(req: unknown, res: {
  json: (body: unknown) => void;
}) {
  return res.json({ status: "ok", message: "Marketing HQ API is running" });
}
