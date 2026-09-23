import { useState } from "react";
import { Mic, Copy, Check } from "lucide-react";
import api from "../api/api";
import { Card } from "./ui";

/* =========================
   "HEY SIRI, HOW MUCH CAN I SPEND"
   Two Shortcuts on the phone, both using the import key from the card above.
========================= */
function SiriShortcut() {
  const [copied, setCopied] = useState("");
  const base = api.defaults.baseURL.replace(/\/$/, "");
  const summaryUrl = `${base}/ingest/summary`;
  const addUrl = `${base}/ingest`;

  const copy = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      /* clipboard blocked: the address is on screen to copy by hand */
    }
  };

  const Url = ({ value, which }) => (
    <div className="flex items-center gap-2 bg-bg border border-line rounded-xl px-3 py-2 mt-1.5">
      <code className="text-[12px] text-ink-2 truncate flex-1">{value}</code>
      <button onClick={() => copy(value, which)} aria-label="Copy address"
        className="text-accent-ink shrink-0">
        {copied === which ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
          <Mic className="w-5 h-5 text-ink-2" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">Ask Siri</p>
          <p className="text-[13px] text-ink-3">&ldquo;How much can I spend today?&rdquo;</p>
        </div>
      </div>

      <p className="text-sm text-ink-2 mt-4">
        Two shortcuts on your iPhone, both using the same import key as the Gmail script above.
        Create a key first if you haven&apos;t.
      </p>

      <div className="mt-5">
        <p className="text-sm font-semibold">1 · How much can I spend</p>
        <ol className="mt-2 space-y-1.5 text-sm text-ink-2 list-decimal list-inside">
          <li>Shortcuts app → <b className="text-ink">+</b> → add action <b className="text-ink">Get Contents of URL</b>.</li>
          <li>Paste this address, keep the method as <b className="text-ink">GET</b>:</li>
        </ol>
        <Url value={summaryUrl} which="summary" />
        <ol start={3} className="mt-2 space-y-1.5 text-sm text-ink-2 list-decimal list-inside">
          <li>Open <b className="text-ink">Headers</b> → add <b className="text-ink">X-Ingest-Key</b> with your key as the value.</li>
          <li>Add <b className="text-ink">Get Dictionary Value</b>, key <b className="text-ink">text</b>.</li>
          <li>Add <b className="text-ink">Show Result</b> (or <b className="text-ink">Speak Text</b>).</li>
          <li>Name it <b className="text-ink">How much can I spend</b>, then say &ldquo;Hey Siri, how much can I spend&rdquo;.</li>
        </ol>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">2 · Log an expense by voice (optional)</p>
        <ol className="mt-2 space-y-1.5 text-sm text-ink-2 list-decimal list-inside">
          <li>New shortcut → <b className="text-ink">Ask for Input</b> (Text), prompt &ldquo;What did you spend?&rdquo;</li>
          <li><b className="text-ink">Get Contents of URL</b>, method <b className="text-ink">POST</b>:</li>
        </ol>
        <Url value={addUrl} which="add" />
        <ol start={3} className="mt-2 space-y-1.5 text-sm text-ink-2 list-decimal list-inside">
          <li>Header <b className="text-ink">X-Ingest-Key</b> with your key.</li>
          <li>Request body <b className="text-ink">JSON</b>: key <b className="text-ink">text</b> → value <b className="text-ink">Provided Input</b>, and key <b className="text-ink">source</b> → <b className="text-ink">sms</b>.</li>
          <li>Name it <b className="text-ink">Log expense</b>. Then say &ldquo;spent 250 at Swiggy&rdquo; when it asks.</li>
        </ol>
      </div>

      <p className="text-[13px] text-ink-3 mt-5">
        The key can read this summary and add transactions. It can&apos;t change or delete anything.
      </p>
    </Card>
  );
}

export default SiriShortcut;
