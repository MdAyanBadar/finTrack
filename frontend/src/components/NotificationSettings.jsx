import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import api from "../api/api";
import { pushState, enablePush, disablePush, isIOS, isStandalone } from "../utils/push";
import { toast } from "../utils/toast";
import { Card, Button } from "./ui";

const WHAT = [
  "When you go over today's budget",
  "When a category reaches 80% and 100% of its limit",
  "The day before a recurring bill",
  "When a payment is imported from your bank email",
  "A summary on salary day",
];

function NotificationSettings() {
  const [state, setState] = useState("loading");
  const [busy, setBusy] = useState(false);
  const needsHomeScreen = isIOS() && !isStandalone();

  useEffect(() => {
    pushState().then(setState).catch(() => setState("unsupported"));
  }, []);

  const turnOn = async () => {
    try {
      setBusy(true);
      await enablePush();
      setState("on");
      await api.post("/push/test");
      toast("Notifications on. We sent you a test.");
    } catch (err) {
      if (err.message === "blocked") setState("blocked");
      const status = err.response?.status;
      toast(
        status === 503 ? "Notifications aren't set up on the server yet (missing VAPID keys)"
          : status === 404 ? "The server is being updated. Try again in a few minutes."
          : status === 401 ? "Please log in again, then turn notifications on"
          : err.message === "blocked" ? "Notifications are blocked in your settings"
          : err.message === "dismissed" ? "Notifications weren't allowed"
          : `Couldn't turn on notifications${status ? ` (server error ${status})` : err.name ? ` (${err.name})` : ""}`,
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    await disablePush().catch(() => {});
    setState("off");
    setBusy(false);
  };

  const test = async () => {
    const { data } = await api.post("/push/test");
    toast(data.sent ? "Test sent" : "No device received it. Try turning notifications off and on.", data.sent ? "info" : "error");
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-ink-2" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold">Notifications</p>
          <p className="text-[13px] text-ink-3">On this device</p>
        </div>
        <span className={`h-7 px-2.5 rounded-full text-xs font-semibold flex items-center ${state === "on" ? "bg-pos/10 text-pos" : "bg-surface-2 text-ink-3"}`}>
          {state === "on" ? "On" : state === "blocked" ? "Blocked" : "Off"}
        </span>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-ink-2">
        {WHAT.map((w) => <li key={w} className="flex gap-2"><span className="text-ink-3">·</span>{w}</li>)}
      </ul>

      <div className="mt-5">
        {needsHomeScreen ? (
          <p className="text-[13px] text-warn bg-warn/10 rounded-2xl px-4 py-3">
            On iPhone, notifications only work in the Home Screen app. Add FinTrack to your Home Screen
            (Safari → Share → Add to Home Screen), open it from there, then turn this on.
          </p>
        ) : state === "unsupported" ? (
          <p className="text-[13px] text-ink-3">This browser doesn&apos;t support notifications.</p>
        ) : state === "blocked" ? (
          <p className="text-[13px] text-warn">Notifications are blocked. Allow them for FinTrack in your device or browser settings, then come back.</p>
        ) : state === "on" ? (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={test}>Send test</Button>
            <Button variant="ghost" onClick={turnOff} disabled={busy}>Turn off</Button>
          </div>
        ) : (
          <Button onClick={turnOn} disabled={busy || state === "loading"}>{busy ? "Turning on…" : "Turn on notifications"}</Button>
        )}
      </div>
    </Card>
  );
}

export default NotificationSettings;
