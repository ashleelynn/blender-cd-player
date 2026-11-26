/* 18 px icons with a 1.5 px stroke, same drawings as the Figma icon components. */
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 18 18",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M9 3.5V14.5M3.5 9H14.5" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...base}>
    <path d="M3.5 9.5L7 13L14.5 5" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...base}>
    <circle cx="8" cy="8" r="5" />
    <path d="M11.75 11.75L15 15" />
  </svg>
);

export const ShuffleIcon = () => (
  <svg {...base}>
    <path d="M2.5 5.5H5C8 5.5 9 12.5 12 12.5H15.5M2.5 12.5H5C8 12.5 9 5.5 12 5.5H15.5M13.5 3.5L15.5 5.5L13.5 7.5M13.5 10.5L15.5 12.5L13.5 14.5" />
  </svg>
);
