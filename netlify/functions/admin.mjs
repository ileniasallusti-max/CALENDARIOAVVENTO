import { isAdmin, json, store, validDay, getDay, getSettings, fileIds, cleanFiles } from "../lib/shared.mjs";

// Azioni della dashboard. Funzionano solo con la password giusta.
//  POST /api/admin/login                       → controlla la password
//  POST /api/admin/chunk?day=&upload=&part=    → riceve un pezzo di file (max ~3 MB)
//  POST /api/admin/save                         → salva il giorno {day, title, message, items[]}
//  POST /api/admin/delete?day=                  → svuota il giorno
//  POST /api/admin/notice                       → salva l'avviso in alto {notice}
const TYPES = ["audio", "youtube", "pdf", "link", "code"];

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Metodo non consentito" }, 405);
  if (!process.env.ADMIN_PASSWORD) return json({ error: "Manca la variabile ADMIN_PASSWORD su Netlify" }, 500);
  if (!isAdmin(req)) return json({ error: "Password sbagliata" }, 401);

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();
  const s = store();

  if (action === "login") return json({ ok: true });

  if (action === "chunk") {
    const day = validDay(url.searchParams.get("day"));
    const upload = (url.searchParams.get("upload") || "").replace(/[^a-z0-9]/gi, "");
    const part = Number(url.searchParams.get("part"));
    if (!day || !upload || !Number.isInteger(part) || part < 0 || part > 200) return json({ error: "Richiesta non valida" }, 400);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength) return json({ error: "Pezzo vuoto" }, 400);
    await s.set(`files/${day}/${upload}/${part}`, buf);
    return json({ ok: true });
  }

  if (action === "notice") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Dati non validi" }, 400); }
    const settings = await getSettings();
    settings.notice = String(body.notice || "").slice(0, 400);
    await s.setJSON("settings", settings);
    return json({ ok: true, notice: settings.notice });
  }

  if (action === "save") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Dati non validi" }, 400); }
    const day = validDay(body.day);
    if (!day) return json({ error: "Giorno non valido" }, 400);
    const raw = Array.isArray(body.items) ? body.items.slice(0, 8) : [];
    if (!raw.length) return json({ error: "Aggiungi almeno un contenuto" }, 400);

    const items = [];
    for (const it of raw) {
      if (!TYPES.includes(it.type)) return json({ error: "Tipo non valido" }, 400);
      const out = { type: it.type, label: String(it.label || "").slice(0, 100) };
      if (it.type === "youtube") {
        const id = youtubeId(String(it.youtube || ""));
        if (!id) return json({ error: "Link YouTube non valido" }, 400);
        out.youtube = String(it.youtube).trim();
        out.youtubeId = id;
      } else if (it.type === "code") {
        const c = String(it.code || "").trim();
        if (!c) return json({ error: "Scrivi il codice sconto" }, 400);
        out.code = c.slice(0, 60);
        const u = String(it.url || "").trim();
        if (u) {
          if (!/^https?:\/\/\S+$/i.test(u)) return json({ error: "Link del negozio non valido (deve iniziare con https://)" }, 400);
          out.url = u.slice(0, 500);
        }
      } else if (it.type === "link") {
        const u = String(it.url || "").trim();
        if (!/^https?:\/\/\S+$/i.test(u)) return json({ error: "Link non valido (deve iniziare con https://)" }, 400);
        out.url = u.slice(0, 500);
      } else {
        const f = it.file || {};
        const upload = String(f.uploadId || "").replace(/[^a-z0-9]/gi, "");
        const parts = Number(f.parts);
        if (!upload || !Number.isInteger(parts) || parts < 1) return json({ error: "Manca un file" }, 400);
        const { blobs } = await s.list({ prefix: `files/${day}/${upload}/` });
        if (blobs.length !== parts) return json({ error: "Caricamento incompleto, riprova" }, 400);
        out.file = {
          uploadId: upload,
          parts,
          name: String(f.name || (it.type === "pdf" ? "file.pdf" : "audio")).slice(0, 150),
          mime: String(f.mime || (it.type === "pdf" ? "application/pdf" : "audio/mpeg")).slice(0, 80),
          size: Number(f.size) || 0,
        };
      }
      items.push(out);
    }

    const record = {
      title: String(body.title || "").slice(0, 120),
      message: String(body.message || "").slice(0, 2000),
      items,
      updatedAt: Date.now(),
    };
    await s.setJSON(`days/${day}`, record);
    await cleanFiles(day, fileIds(record));
    return json({ ok: true, content: record });
  }

  if (action === "delete") {
    const day = validDay(url.searchParams.get("day"));
    if (!day) return json({ error: "Giorno non valido" }, 400);
    await s.delete(`days/${day}`);
    await cleanFiles(day, []);
    return json({ ok: true });
  }

  return json({ error: "Azione sconosciuta" }, 404);
};

function youtubeId(link) {
  link = link.trim();
  if (/^[\w-]{11}$/.test(link)) return link;
  try {
    const u = new URL(link);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return clean(u.pathname.slice(1));
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.searchParams.get("v")) return clean(u.searchParams.get("v"));
      const m = u.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch {}
  return null;
}
function clean(id) {
  const m = (id || "").match(/^[\w-]{11}/);
  return m ? m[0] : null;
}

export const config = { path: "/api/admin/*" };
