import { isUnlocked, isAdmin, json, getDay, store, validDay } from "../lib/shared.mjs";

// Restituisce un pezzo di un file (audio o PDF) di un giorno, solo se è già sbloccato.
//   /api/file?day=3&f=<uploadId>&part=0
export default async (req) => {
  const url = new URL(req.url);
  const day = validDay(url.searchParams.get("day"));
  const f = (url.searchParams.get("f") || "").replace(/[^a-z0-9]/gi, "");
  const part = Number(url.searchParams.get("part") || 0);
  if (!day || !f || !Number.isInteger(part) || part < 0) return json({ error: "Richiesta non valida" }, 400);
  if (!isUnlocked(day) && !isAdmin(req)) return json({ error: "Ancora chiusa" }, 403);

  const data = await getDay(day);
  const item = data && (data.items || []).find((i) => i.file && i.file.uploadId === f);
  if (!item || part >= item.file.parts) return json({ error: "File non trovato" }, 404);

  const buf = await store().get(`files/${day}/${f}/${part}`, { type: "arrayBuffer" });
  if (!buf) return json({ error: "File non trovato" }, 404);

  return new Response(buf, {
    headers: { "content-type": "application/octet-stream", "cache-control": "private, max-age=3600" },
  });
};

export const config = { path: "/api/file" };
