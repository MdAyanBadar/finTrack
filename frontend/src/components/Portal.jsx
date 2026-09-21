import { useEffect } from "react";
import { createPortal } from "react-dom";

// Renders popups at the end of <body>. A "position: fixed" popup inside a card
// with blur/transform gets pinned to that card instead of the screen (and is
// clipped by it), which hid the calendar popup on phones.
function Portal({ children, lockScroll = false }) {
  useEffect(() => {
    if (!lockScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lockScroll]);

  return createPortal(children, document.body);
}

export default Portal;
