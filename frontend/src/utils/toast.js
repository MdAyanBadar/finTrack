// Show a short message from anywhere:
//   toast("Saved")
//   toast("Couldn't save", "error")
//   toast("Deleted Swiggy", { action: { label: "Undo", onClick: restore } })
const EVENT = "fintrack:toast";
export const toast = (text, opts = "info") => {
  const { type = "info", action, duration } = typeof opts === "string" ? { type: opts } : opts;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, type, action, duration } }));
};
export const onToast = (handler) => {
  const fn = (e) => handler(e.detail);
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
};
