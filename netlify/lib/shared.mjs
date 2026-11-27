import { getStore } from "@netlify/blobs";

// Anno del calendario (si può cambiare da Netlify con la variabile ADVENT_YEAR)
export const YEAR = Number(process.env.ADVENT_YEAR || 2026);

// Ogni pallina si apre alle 15:00 ora italiana del suo giorno.
// A dicembre l'Italia è in UTC+1, quindi le 15:00 italiane sono le 14:00 UTC.
export function unlockAt(day) {
  return Date.UTC(YEAR, 11, day, 14, 0, 0);
}

export function isUnlocked(day, now = Date.now()) {
  return now >= unlockAt(day);
}

export function store() {
  return getStore({ name: "gua-avvento", consistency: "strong" });
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export function isAdmin(req) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return false;
  const key = req.headers.get("x-admin-key") || "";
  return safeEqual(key, pass);
}

export function validDay(d) {
  const n = Number(d);
  return Number.isInteger(n) && n >= 1 && n <= 25 ? n : null;
}

export async function getDay(day) {
  return (await store().get(`days/${day}`, { type: "json" })) || null;
}

export const DEFAULT_NOTICE = "";

export async function getSettings() {
  const s = (await store().get("settings", { type: "json" })) || {};
  if (typeof s.notice !== "string") s.notice = DEFAULT_NOTICE;
  return s;
}

// tutti gli uploadId dei file usati da un giorno
export function fileIds(record) {
  return (record && Array.isArray(record.items) ? record.items : [])
    .filter((i) => i.file && i.file.uploadId)
    .map((i) => i.file.uploadId);
}

export async function cleanFiles(day, keepIds = []) {
  const s = store();
  const { blobs } = await s.list({ prefix: `files/${day}/` });
  for (const b of blobs) {
    const id = b.key.split("/")[2];
    if (!keepIds.includes(id)) await s.delete(b.key);
  }
}
