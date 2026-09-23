import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { lastSyncAt } from "../api/persist";

const ago = (ts) => {
  if (!ts) return null;
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// Shown while the device is offline: the app still works from stored data
function OfflineBar() {
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;
  const when = ago(lastSyncAt());

  return (
    <div role="status" className="sticky top-0 z-50 bg-warn/15 text-warn text-[13px] font-medium px-4 py-2 flex items-center justify-center gap-2">
      <CloudOff className="w-4 h-4 shrink-0" />
      Offline{when ? ` · showing data from ${when}` : ""}
    </div>
  );
}

export default OfflineBar;
