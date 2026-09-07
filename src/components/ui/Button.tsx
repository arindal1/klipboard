"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";

type Variant = "primary" | "ghost";

const base = "neu-btn";

function variantClass(variant: Variant) {
  return variant === "primary" ? "neu-btn--primary" : "neu-btn--ghost";
}

export function ButtonLink({
  href,
  variant = "ghost",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} className="neu-btn-wrap">
      <Link href={href} className={clsx(base, variantClass(variant), className)}>
        {children}
      </Link>
    </motion.div>
  );
}

export function Button({
  variant = "ghost",
  className,
  children,
  ...rest
}: HTMLMotionProps<"button"> & { variant?: Variant }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      className={clsx(base, variantClass(variant), className)}
      {...rest}
    >
      {children}
    </motion.button>
  );
}