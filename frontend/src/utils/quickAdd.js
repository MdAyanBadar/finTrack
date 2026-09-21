// Lets any button (tab bar, empty states) open the quick-add sheet
const EVENT = "fintrack:quick-add";

export const openQuickAdd = () => window.dispatchEvent(new Event(EVENT));

export const onQuickAdd = (handler) => {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};
