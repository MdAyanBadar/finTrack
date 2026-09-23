import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Info, Smartphone, LogOut, ChevronRight } from "lucide-react";
import { useResource } from "../api/resourceStore";
import { clearLocal } from "../api/persist";
import { Page, PageHeader, Card, Section, Sheet, Button, Skeleton } from "./ui";
import AutoImport from "./AutoImport";
import SiriShortcut from "./SiriShortcut";
import NotificationSettings from "./NotificationSettings";

function Profile() {
  const navigate = useNavigate();
  const { data: user, loading } = useResource("/users/me", null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);

  const logout = () => {
    clearLocal();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Page>
      <PageHeader title="Profile" />

      {loading || !user ? (
        <Skeleton className="h-24" />
      ) : (
        <Card className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-xl font-bold text-white shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold truncate">{user.name}</p>
            <p className="text-sm text-ink-3 truncate">{user.email}</p>
            <p className="text-[13px] text-ink-3 mt-0.5">
              Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
          </div>
        </Card>
      )}

      <Section title="Notifications">
        <NotificationSettings />
      </Section>

      <Section title="Automation">
        <AutoImport />
      </Section>

      <Section title="Siri">
        <SiriShortcut />
      </Section>

      <Section title="App">
        <Card className="divide-y divide-line/60 overflow-hidden">
          <button onClick={() => setInstallHelp(true)} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-surface-2/60 transition">
            <Smartphone className="w-5 h-5 text-ink-2" />
            <span className="flex-1 text-[15px]">Add to Home Screen</span>
            <ChevronRight className="w-4 h-4 text-ink-3" />
          </button>
          <Link to="/about" className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-surface-2/60 transition">
            <Info className="w-5 h-5 text-ink-2" />
            <span className="flex-1 text-[15px]">About FinTrack</span>
            <ChevronRight className="w-4 h-4 text-ink-3" />
          </Link>
          <button onClick={() => setConfirmLogout(true)} className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left text-neg hover:bg-surface-2/60 transition">
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-[15px]">Sign out</span>
          </button>
        </Card>
      </Section>

      <Sheet open={installHelp} onClose={() => setInstallHelp(false)} title="Add to Home Screen">
        <ol className="space-y-3 text-[15px] text-ink-2 list-decimal list-inside">
          <li>Open FinTrack in <b className="text-ink">Safari</b> on your iPhone.</li>
          <li>Tap <b className="text-ink">Share</b> (the square with an arrow).</li>
          <li>Tap <b className="text-ink">Add to Home Screen</b>, then <b className="text-ink">Add</b>.</li>
          <li>Open it from your home screen and sign in once.</li>
        </ol>
        <p className="text-[13px] text-ink-3 mt-4">On Android Chrome: menu ⋮ → Install app.</p>
      </Sheet>

      <Sheet open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Sign out?">
        <p className="text-[15px] text-ink-2 mb-5">You&apos;ll need your email and password to sign back in.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmLogout(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={logout}>Sign out</Button>
        </div>
      </Sheet>
    </Page>
  );
}

export default Profile;
