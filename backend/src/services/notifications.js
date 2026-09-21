import webpush from "web-push";
import prisma from "../prisma.js";
import { financeToday } from "./finance.js";
import { cycleFor, keyOf, localDayNumber, occurrencesBetween } from "../utils/cycle.js";

/* =========================
   PUSH NOTIFICATIONS
   Configured with VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (npx web-push
   generate-vapid-keys). Without them everything here is a no-op.
========================= */
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
export const pushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:admin@fintrack.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}
export const vapidPublicKey = VAPID_PUBLIC_KEY || null;

const inr = (n) => `₹${Math.round(Math.abs(n)).toLocaleString("en-IN")}`;

// Send to every device of a user. With a `key`, the same alert is only ever sent once.
export const sendToUser = async (userId, { title, body, url = "/" }, key) => {
  if (!pushConfigured) return 0;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  if (key) {
    try {
      await prisma.notificationLog.create({ data: { userId, key } });
    } catch (err) {
      if (err.code === "P2002") return 0; // already sent
      throw err;
    }
  }

  const payload = JSON.stringify({ title, body, url, tag: key || undefined });
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12 });
        sent += 1;
      } catch (err) {
        // Device unsubscribed or app removed: forget it
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          console.error("Push failed:", err.statusCode, err.body || err.message);
        }
      }
    })
  );
  return sent;
};

const userTimeZone = async (userId) =>
  (await prisma.pushSubscription.findFirst({ where: { userId }, select: { timeZone: true } }))?.timeZone;

/* After a new expense: over today's budget? category limit at 80% / 100%? */
export const notifyAfterTransaction = async (userId, tx) => {
  if (!pushConfigured || tx.amount >= 0) return;
  const timeZone = await userTimeZone(userId);
  if (!timeZone) return; // no devices subscribed

  const f = await financeToday(userId, timeZone);
  const cycleKey = keyOf(f.cycle.start);

  if (localDayNumber(tx.date, timeZone) === f.today && f.leftToday < 0 && f.dailyBudget > 0) {
    await sendToUser(userId, {
      title: "Over today's budget",
      body: `You're ${inr(f.leftToday)} over today's ${inr(f.dailyBudget)}. Tomorrow's budget will be a little smaller.`,
    }, `over:${keyOf(f.today)}`);
  }

  const limit = f.limits.find((l) => l.category === tx.category);
  if (limit && limit.limit > 0) {
    const spent = f.spentByCategory[tx.category] || 0;
    const pct = (spent / limit.limit) * 100;
    if (pct >= 100) {
      await sendToUser(userId, {
        title: `${tx.category} limit reached`,
        body: `${inr(spent)} of ${inr(limit.limit)} spent this pay cycle.`,
        url: "/budget-goals",
      }, `limit:${tx.category}:100:${cycleKey}`);
    } else if (pct >= 80) {
      await sendToUser(userId, {
        title: `${tx.category} at ${Math.floor(pct)}%`,
        body: `${inr(limit.limit - spent)} left of your ${inr(limit.limit)} limit this pay cycle.`,
        url: "/budget-goals",
      }, `limit:${tx.category}:80:${cycleKey}`);
    }
  }
};

/* Imported from a bank email/SMS */
export const notifyImported = async (userId, tx) => {
  if (!pushConfigured) return;
  await sendToUser(userId, {
    title: tx.amount < 0 ? `${inr(tx.amount)} · ${tx.title}` : `+${inr(tx.amount)} from ${tx.title}`,
    body: `Added from your bank ${tx.source || "alert"} · ${tx.category}. Tap to change the category.`,
    url: "/transactions",
  }, `import:${tx.id}`);
  await notifyAfterTransaction(userId, tx);
};

/* Once a day (see .github/workflows/daily-notifications.yml): bills due tomorrow, new pay cycle */
export const runDaily = async (now = new Date()) => {
  if (!pushConfigured) return { users: 0, sent: 0, note: "push not configured" };
  const users = await prisma.pushSubscription.findMany({ distinct: ["userId"], select: { userId: true, timeZone: true } });
  let sent = 0;

  for (const { userId, timeZone } of users) {
    const today = localDayNumber(now, timeZone);
    const recurring = await prisma.recurringTransaction.findMany({ where: { userId, amount: { lt: 0 } } });
    for (const r of recurring) {
      if (occurrencesBetween(r, today + 1, today + 2, timeZone).length) {
        sent += await sendToUser(userId, {
          title: `${r.title} due tomorrow`,
          body: `${inr(r.amount)} will be added to your transactions tomorrow.`,
          url: "/budget-goals",
        }, `bill:${r.id}:${keyOf(today + 1)}`);
      }
    }

    // Salary day: summary of the cycle that just ended
    const budgetRow = await prisma.budget.findUnique({ where: { userId } });
    const cycle = cycleFor(budgetRow?.salaryDay ?? 1, today);
    if (today === cycle.start) {
      const prev = cycleFor(budgetRow?.salaryDay ?? 1, today - 1);
      const txs = await prisma.transaction.findMany({
        where: { userId, amount: { lt: 0 }, date: { gte: new Date((prev.start - 1) * 86400000), lt: new Date((prev.end + 1) * 86400000) } },
      });
      const spent = txs
        .filter((t) => { const n = localDayNumber(t.date, timeZone); return n >= prev.start && n < prev.end; })
        .reduce((a, t) => a - t.amount, 0);
      const saved = Math.max(0, (budgetRow?.monthlyBudget ?? 0) - spent);
      sent += await sendToUser(userId, {
        title: "New pay cycle 🎉",
        body: `Last cycle you spent ${inr(spent)}${saved > 0 ? ` and saved ${inr(saved)}` : ""}. Your budget has reset.`,
        url: "/insights",
      }, `cycle:${keyOf(cycle.start)}`);
    }
  }
  return { users: users.length, sent };
};
