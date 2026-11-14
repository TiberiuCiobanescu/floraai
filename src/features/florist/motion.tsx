import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/** Presentation only: delays are bounded so long lists never hold up interaction. */
export function useEntrance(index = 0) {
  const reduced = useReducedMotion();
  return {
    initial: reduced ? false as const : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.24, delay: reduced ? 0 : Math.min(index, 8) * 0.05 },
  };
}

export function AnimatedCount({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(value);
  useEffect(() => {
    if (reduced) return;
    setCount(0);
    const animation = animate(0, value, {
      duration: 0.45,
      ease: "easeOut",
      onUpdate: (current) => setCount(Math.round(current)),
    });
    return () => animation.stop();
  }, [value, reduced]);
  return <strong className="animated-count">{(reduced ? value : count).toString().padStart(2, "0")}</strong>;
}