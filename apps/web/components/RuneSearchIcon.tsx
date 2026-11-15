// Лупа в духе рун с логотипа: шестигранная линза и прямая рукоять, углы
// рубленые, без скруглений, как у букв Norse. Lucide-лупа рядом с ними
// выглядела мягкой и чужой.
export default function RuneSearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 2.5 16.5 6.25v7.5L10 17.5l-6.5-3.75v-7.5Z" />
      <path d="M10 6.5v7M7.5 9l2.5-2.5L12.5 9" strokeWidth={1.5} />
      <path d="m15.5 15.5 6 6" />
    </svg>
  );
}
