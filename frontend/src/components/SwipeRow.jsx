import { useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trash2 } from "lucide-react";

const THRESHOLD = -110;

// Swipe left to delete (phones); tap still works as normal
function SwipeRow({ onDelete, children }) {
  const x = useMotionValue(0);
  const dragged = useRef(false);
  const revealOpacity = useTransform(x, [-100, -20, 0], [1, 0.4, 0]);

  return (
    <div className="relative overflow-hidden">
      <motion.div style={{ opacity: revealOpacity }}
        className="absolute inset-y-0 right-0 w-40 bg-neg flex items-center justify-end pr-6 text-white text-sm font-semibold gap-2">
        <Trash2 className="w-4 h-4" /> Delete
      </motion.div>
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        onDragStart={() => { dragged.current = true; }}
        onDragEnd={(_, info) => {
          if (info.offset.x < THRESHOLD) {
            animate(x, -600, { duration: 0.2 }).then(onDelete);
          } else {
            animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
          }
          setTimeout(() => { dragged.current = false; }, 0);
        }}
        onClickCapture={(e) => {
          // A drag shouldn't also count as a tap
          if (dragged.current) { e.stopPropagation(); e.preventDefault(); }
        }}
        className="relative bg-surface"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeRow;
