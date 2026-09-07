"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { softSpring } from "@/lib/motion";
import clsx from "clsx";

type PanelProps = HTMLMotionProps<"div"> & {
  inset?: boolean;
  hoverLift?: boolean;
};

/**
 * The core neumorphic surface used across the app - a soft, dark,
 * extruded panel. `inset` renders the pressed-in variant for editors
 * and wells; the default is the raised card variant.
 */
export function Panel({ inset = false, hoverLift = false, className, children, ...rest }: PanelProps) {
  return (
    <motion.div
      className={clsx("neu-panel", inset && "neu-panel--inset", className)}
      whileHover={hoverLift ? { y: -6 } : undefined}
      transition={softSpring}
      {...rest}
    >
      {children}
    </motion.div>
  );
}