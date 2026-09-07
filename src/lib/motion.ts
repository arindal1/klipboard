export const softSpring = { type: "spring" as const, stiffness: 260, damping: 22 };
export const gentleSpring = { type: "spring" as const, stiffness: 180, damping: 24 };

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};