import { useEffect, useState } from "react";
import { Mail, KeyRound, Copy, Check, FlaskConical, ExternalLink } from "lucide-react";
import api from "../api/api";
import { Card, Button, Field, Input, inputClass } from "./ui";

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
    <Card className="p-5">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-ink-2" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold">Import from bank emails</p>
          <p className="text-[13px] text-ink-3">Gmail · checks every 5 minutes</p>
        </div>
        <span className={`h-7 px-2.5 rounded-full text-xs font-semibold flex items-center ${hasKey ? "bg-pos/10 text-pos" : "bg-surface-2 text-ink-3"}`}>
          {hasKey ? "On" : "Off"}
        </span>
      </div>
      <p className="text-sm text-ink-2 mt-4">
        A small script in your own Gmail sends new bank alerts here. Each payment is imported once, even if the email arrives twice.
      </p>

      {isLocal && (
        <p className="text-[13px] text-warn bg-warn/10 rounded-2xl px-4 py-3 mt-4">
          You&apos;re on a local copy. Google can&apos;t reach localhost, so set this up from the live site.
        </p>
      )}

      <div className="mt-5 space-y-4">
        <Field label="Bank email sender" hint="Comma-separated for more than one bank, e.g. slice.bank.in, alerts@hdfcbank.net">
          <Input value={senders} onChange={(e) => setSenders(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button onClick={createKey}><KeyRound className="w-4 h-4" /> {hasKey ? "New key & script" : "Create key & script"}</Button>
          {hasKey && <Button variant="danger" onClick={revokeKey}>Turn off</Button>}
        </div>
        {error && <p className="text-sm text-neg">{error}</p>}
      </div>

      {key && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Your Gmail script</p>
            <button onClick={copy} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-[13px] text-warn mb-2">Copy it now. The key is shown only once.</p>
          <pre className="max-h-56 overflow-auto text-[11px] leading-relaxed text-ink-2 bg-bg border border-line rounded-2xl p-4 whitespace-pre">{script}</pre>
          <ol className="mt-4 space-y-2 text-sm text-ink-2 list-decimal list-inside">
            <li>
              Open{" "}
              <a href="https://script.google.com/home/projects/create" target="_blank" rel="noreferrer" className="text-accent-ink inline-flex items-center gap-1">
                script.google.com <ExternalLink className="w-3 h-3" />
              </a>{" "}
              in the Gmail account that gets your bank alerts (a computer is easiest).
            </li>
            <li>Delete the sample code, paste the script and click <b className="text-ink">Save</b>.</li>
            <li>Pick <b className="text-ink">setup</b> in the function menu and click <b className="text-ink">Run</b>.</li>
            <li>Allow access: <b className="text-ink">Advanced → Go to project → Allow</b> (it&apos;s your own script, so Google can&apos;t verify it).</li>
            <li>Done. The last 2 days are imported now, new alerts every 5 minutes.</li>
          </ol>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-line/70">
        <p className="text-sm font-semibold flex items-center gap-2"><FlaskConical className="w-4 h-4 text-ink-3" /> Test a message</p>
        <p className="text-[13px] text-ink-3 mt-0.5 mb-3">Paste a bank email or SMS to see how it would be imported. Nothing is saved.</p>
        <textarea value={sample} onChange={(e) => setSample(e.target.value)} rows={3}
          placeholder="₹1 debited from your slice bank account xx8625 via UPI. To KARTHIK G RRN 626429329770"
          className={`${inputClass} h-auto py-3 resize-y`} />
        <Button variant="secondary" size="sm" className="mt-3" onClick={test} disabled={!sample.trim()}>Test</Button>
        {preview && (
          <p className={`mt-3 text-sm rounded-2xl px-4 py-3 ${preview.status === "ok" ? "bg-pos/10 text-ink" : "bg-warn/10 text-warn"}`}>
            {preview.status === "ok" ? (
              <>
                Would add <b>{preview.parsed.title}</b> · <b className="tabular">{preview.parsed.amount < 0 ? "−" : "+"}₹{Math.abs(preview.parsed.amount).toLocaleString("en-IN")}</b> · {preview.parsed.category}
                {preview.parsed.ref && <span className="text-ink-3"> · ref {preview.parsed.ref}</span>}
              </>
            ) : (
              <>Would skip: {preview.reason}</>
            )}
          </p>
        )}
      </div>
    </Card>
  );
}

export default AutoImport;
