import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function baseProps(props: IconProps) {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function BellOffIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8.7 3.7A6 6 0 0 1 18 8c0 4.2 1.05 6.5 1.9 7.8" />
      <path d="M6.26 6.26C6.1 6.79 6 7.37 6 8c0 7-3 9-3 9h13" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M2 2l20 20" />
    </svg>
  );
}
