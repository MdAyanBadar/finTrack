import { useEffect, useState } from "react";
import { Mail, KeyRound, Copy, Check, FlaskConical, Trash2, ExternalLink } from "lucide-react";
import api from "../api/api";

const inputCls =
  "w-full bg-white/[0.05] border border-white/[0.1] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all";

// Google Apps Script that runs in the user's Gmail and forwards new bank alerts
const buildScript = ({ url, key, senders }) => `// FinTrack: import bank alert emails from Gmail
// Keep this private: the key lets anyone add transactions to your account.
const FINTRACK_URL = "${url}";
const IMPORT_KEY = "${key}";
const SEARCH = "from:(${senders}) newer_than:2d";

// Run this once: it checks Gmail every 5 minutes from now on
function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("importBankEmails").timeBased().everyMinutes(5).create();
  importBankEmails();
}

function importBankEmails() {
  const props = PropertiesService.getScriptProperties();
  const since = Number(props.getProperty("lastImported") || 0);
  let newest = since;

  for (const thread of GmailApp.search(SEARCH, 0, 50)) {
    for (const msg of thread.getMessages()) {
      const time = msg.getDate().getTime();
      if (time <= since) continue;

      const res = UrlFetchApp.fetch(FINTRACK_URL, {
        method: "post",
        contentType: "application/json",
        headers: { "X-Ingest-Key": IMPORT_KEY },
        payload: JSON.stringify({
          text: msg.getSubject() + "\\n" + msg.getPlainBody(),
          date: msg.getDate().toISOString(),
          source: "email",
        }),
        muteHttpExceptions: true,
      });
      const code = res.getResponseCode();
      // Stop and retry next run; FinTrack skips anything already imported
      if (code >= 500 || code === 401) throw new Error("FinTrack import failed (" + code + "): " + res.getContentText());
      newest = Math.max(newest, time);
    }
  }
  props.setProperty("lastImported", String(newest));
}
`;

function AutoImport() {
  const [hasKey, setHasKey] = useState(false);
  const [key, setKey] = useState(""); // only known right after creating it
  const [senders, setSenders] = useState("slice.bank.in");
  const [copied, setCopied] = useState(false);
  const [sample, setSample] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const ingestUrl = `${api.defaults.baseURL.replace(/\/$/, "")}/ingest`;
  const isLocal = /localhost|127\.0\.0\.1/.test(ingestUrl);

  useEffect(() => {
    api.get("/ingest/key").then((res) => setHasKey(res.data.hasKey)).catch(() => {});
  }, []);

  const createKey = async () => {
    if (hasKey && !window.confirm("This replaces your current key. The old Gmail script will stop working until you paste the new one. Continue?")) return;
    try {
      const res = await api.post("/ingest/key");
      setKey(res.data.key);
      setHasKey(true);
      setError("");
    } catch {
      setError("Couldn't create a key. Try again.");
    }
  };

  const revokeKey = async () => {
    if (!window.confirm("Turn off auto-import? Your Gmail script will stop adding transactions.")) return;
    await api.delete("/ingest/key");
    setKey("");
    setHasKey(false);
  };

  const script = key ? buildScript({ url: ingestUrl, key, senders: senders.split(",").map((s) => s.trim()).filter(Boolean).join(" OR ") }) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Select the code and copy it manually.");
    }
  };

  const test = async () => {
    setPreview(null);
    try {
      const res = await api.post("/ingest/preview", { text: sample });
      setPreview(res.data);
    } catch (err) {
      setPreview({ status: "error", reason: err.response?.data?.message || "Test failed" });
    }
  };

  return (
    <div className="bg-slate-900/50 border border-white/[0.08] rounded-[2rem] p-6 sm:p-8 backdrop-blur-3xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
          <Mail className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Auto-import from bank emails</h3>
          <p className="text-xs text-slate-500">{hasKey ? "On" : "Off"} · Works with Gmail</p>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        A small script in your own Gmail checks for new bank alerts every 5 minutes and adds them here.
        Each payment is imported once, even if the email arrives twice.
      </p>

      {isLocal && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
          You&apos;re on a local copy. Google can&apos;t reach localhost, so set this up from the live site.
        </p>
      )}

      {/* Step 1: sender + key */}
      <label className="block text-sm text-slate-400 mb-2">Bank email sender (comma-separated for more than one bank)</label>
      <input value={senders} onChange={(e) => setSenders(e.target.value)} placeholder="slice.bank.in, alerts@hdfcbank.net" className={`${inputCls} mb-4`} />

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={createKey}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all">
          <KeyRound className="w-4 h-4" /> {hasKey ? "Create new key & script" : "Create key & script"}
        </button>
        {hasKey && (
          <button onClick={revokeKey}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
            <Trash2 className="w-4 h-4" /> Turn off
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {/* Step 2: script + instructions (only right after creating a key) */}
      {key && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-white font-semibold">Your Gmail script</p>
            <button onClick={copy} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-indigo-200">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-amber-300 mb-2">Copy it now. The key is shown only once. It&apos;s already filled in below.</p>
          <pre className="max-h-64 overflow-auto text-[11px] leading-relaxed text-slate-300 bg-black/40 border border-white/[0.06] rounded-xl p-4 whitespace-pre">{script}</pre>

          <ol className="mt-4 space-y-2 text-sm text-slate-300 list-decimal list-inside">
            <li>
              Open{" "}
              <a href="https://script.google.com/home/projects/create" target="_blank" rel="noreferrer" className="text-indigo-300 hover:underline inline-flex items-center gap-1">
                script.google.com <ExternalLink className="w-3 h-3" />
              </a>{" "}
              signed in to the Gmail account that gets your bank alerts. A computer is easiest.
            </li>
            <li>Delete the sample code, paste the script, and click <b>Save</b>.</li>
            <li>Pick <b>setup</b> in the function dropdown and click <b>Run</b>.</li>
            <li>
              Allow access. Google warns that the app isn&apos;t verified because it&apos;s your own script:
              click <b>Advanced → Go to project</b>, then <b>Allow</b>.
            </li>
            <li>Done. Your last 2 days of alerts are imported now, and new ones every 5 minutes.</li>
          </ol>
        </div>
      )}

      {/* Test a message */}
      <div className="border-t border-white/[0.06] pt-6">
        <p className="text-sm text-white font-semibold mb-1 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-indigo-400" /> Test a message
        </p>
        <p className="text-xs text-slate-500 mb-3">Paste a bank email or SMS to see how it would be imported. Nothing is saved.</p>
        <textarea value={sample} onChange={(e) => setSample(e.target.value)} rows={4}
          placeholder="₹1 debited from your slice bank account xx8625 via UPI. To KARTHIK G RRN 626429329770"
          className={`${inputCls} resize-y mb-3`} />
        <button onClick={test} disabled={!sample.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] disabled:opacity-40">
          Test
        </button>
        {preview && (
          <div className={`mt-3 text-sm rounded-xl px-4 py-3 border ${
            preview.status === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" : "bg-amber-500/10 border-amber-500/20 text-amber-200"
          }`}>
            {preview.status === "ok" ? (
              <>
                Would add <b>{preview.parsed.title}</b> ·{" "}
                <b>{preview.parsed.amount < 0 ? "-" : "+"}₹{Math.abs(preview.parsed.amount).toLocaleString("en-IN")}</b> ·{" "}
                {preview.parsed.category}
                {preview.parsed.ref && <span className="text-emerald-300/70"> · ref {preview.parsed.ref}</span>}
              </>
            ) : (
              <>Would skip: {preview.reason}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AutoImport;
