import { YEAR, unlockAt, isUnlocked, isAdmin, json, getDay, getSettings } from "../lib/shared.mjs";
import { PLAN } from "../lib/plan.mjs";

// Elenco delle 25 palline. Il contenuto viene mandato solo se la pallina è già aperta
// (o se chi chiede è la proprietaria con la password).
export default async (req) => {
  const admin = isAdmin(req);
  const now = Date.now();
  const days = [];
  for (let d = 1; d <= 25; d++) {
    const open = isUnlocked(d, now);
    const item = { day: d, unlockAt: unlockAt(d), unlocked: open };
    if (open || admin) {
      const data = await getDay(d);
      if (data) item.content = data;
    }
    days.push(item);
  }
  const settings = await getSettings();
  const out = { year: YEAR, now, admin, notice: settings.notice || "", days };
  if (admin) out.plan = PLAN; // il programma lo vede solo la proprietaria
  return json(out);
};

export const config = { path: "/api/days" };
