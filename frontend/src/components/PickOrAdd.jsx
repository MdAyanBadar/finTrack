import { useState } from "react";
import { Select, Input } from "./ui";

const NEW = "__new";

/* =========================
   DROPDOWN OF WHAT YOU ALREADY USE, PLUS "ADD NEW"
   Used for categories and for who owes you money.
========================= */
function PickOrAdd({ value, onChange, options, newLabel = "Add new…", placeholder = "Name", allowEmpty, emptyLabel = "None" }) {
  // A value that isn't in the list yet (e.g. just typed) keeps the box open
  const [adding, setAdding] = useState(() => Boolean(value) && !options.includes(value));

  const pick = (next) => {
    if (next === NEW) {
      setAdding(true);
      onChange("");
      return;
    }
    setAdding(false);
    onChange(next);
  };

  return (
    <>
      <Select value={adding ? NEW : value} onChange={(e) => pick(e.target.value)}>
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={NEW}>{newLabel}</option>
      </Select>
      {adding && (
        <Input autoFocus placeholder={placeholder} value={value} className="mt-2"
          onChange={(e) => onChange(e.target.value)} />
      )}
    </>
  );
}

export default PickOrAdd;
