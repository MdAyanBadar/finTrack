import { useState } from "react";
import { Users, Plus, X } from "lucide-react";
import api from "../api/api";
import { useResource } from "../api/resourceStore";
import { toast } from "../utils/toast";
import { Card, Section, Sheet, Field, Input, Button, EmptyState } from "./ui";

const EMPTY = { name: "", members: [] };

/* =========================
   SPLIT GROUPS
   Just lists of names — flatmates, a trip, the office lunch crowd.
   Splitting a bill turns everyone else's share into money they owe you.
========================= */
function SplitGroups() {
  const { data: groups, setData: setGroups } = useResource("/split-groups", []);
  const [form, setForm] = useState(null); // { id?, name, members }
  const [person, setPerson] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addPerson = () => {
    const name = person.trim();
    if (!name) return;
    if (!form.members.includes(name)) setForm({ ...form, members: [...form.members, name] });
    setPerson("");
  };

  const save = async () => {
    const members = person.trim() && !form.members.includes(person.trim())
      ? [...form.members, person.trim()]
      : form.members;
    if (!form.name.trim()) {
      setError("Give the group a name");
      return;
    }
    if (members.length === 0) {
      setError("Add at least one person");
      return;
    }
    try {
      setSaving(true);
      const body = { name: form.name.trim(), members };
      const res = form.id ? await api.put(`/split-groups/${form.id}`, body) : await api.post("/split-groups", body);
      setGroups((prev) => [...prev.filter((g) => g.id !== res.data.id), res.data]);
      toast(form.id ? "Group updated" : `${res.data.name} created`);
      setForm(null);
      setPerson("");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save the group");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${form.name}"? Bills you've already split stay as they are.`)) return;
    try {
      setSaving(true);
      await api.delete(`/split-groups/${form.id}`);
      setGroups((prev) => prev.filter((g) => g.id !== form.id));
      setForm(null);
    } catch {
      setError("Couldn't delete the group");
    } finally {
      setSaving(false);
    }
  };

  const open = (g) => {
    setError("");
    setPerson("");
    setForm(g ? { id: g.id, name: g.name, members: [...g.members] } : EMPTY);
  };

  return (
    <Section title="Split groups" action="Add" onAction={() => open(null)}>
      <Card className="divide-y divide-line/60 overflow-hidden">
        {groups.length === 0 ? (
          <EmptyState icon={Users} title="No groups yet"
            text="Add the people you share bills with. Then split any expense equally and track who owes you."
            action={<Button size="sm" onClick={() => open(null)}><Plus className="w-4 h-4" /> New group</Button>} />
        ) : (
          groups.map((g) => (
            <button key={g.id} onClick={() => open(g)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-surface-2/60 transition">
              <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-ink-2" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium truncate">{g.name}</p>
                <p className="text-[13px] text-ink-3 truncate">You + {g.members.join(", ")}</p>
              </div>
              <span className="text-[13px] text-ink-3 shrink-0">{g.members.length + 1} people</span>
            </button>
          ))
        )}
      </Card>

      <Sheet open={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? "Edit group" : "New split group"}>
        {form && (
          <div className="space-y-4">
            <Field label="Group name" hint="For example: Goa trip, Flatmates">
              <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>

            <Field label="People" hint="You're always included; add the others.">
              <div className="flex gap-2">
                <Input placeholder="Name" value={person} onChange={(e) => setPerson(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPerson(); } }} />
                <Button variant="secondary" type="button" className="shrink-0" onClick={addPerson}>Add</Button>
              </div>
            </Field>

            {form.members.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.members.map((m) => (
                  <span key={m} className="h-9 pl-3.5 pr-2 rounded-full bg-surface-2 text-sm flex items-center gap-1.5">
                    {m}
                    <button type="button" aria-label={`Remove ${m}`}
                      onClick={() => setForm({ ...form, members: form.members.filter((x) => x !== m) })}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-ink-3 hover:text-ink">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-neg">{error}</p>}
            <div className="flex gap-3 pt-1">
              {form.id && <Button variant="danger" onClick={remove} disabled={saving}>Delete</Button>}
              <Button className="flex-1" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </Section>
  );
}

export default SplitGroups;
