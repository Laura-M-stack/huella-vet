/** Huella simple hecha con formas basicas (dibujo propio). */
export function PawMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <ellipse cx="16" cy="21.500" rx="7.500" ry="6" fill="currentColor" />
      <ellipse cx="6.500" cy="14" rx="2.800" ry="3.600" fill="currentColor" transform="rotate(-18 6.500 14)" />
      <ellipse cx="12.500" cy="8.500" rx="2.800" ry="3.800" fill="currentColor" transform="rotate(-6 12.500 8.500)" />
      <ellipse cx="19.500" cy="8.500" rx="2.800" ry="3.800" fill="currentColor" transform="rotate(6 19.500 8.500)" />
      <ellipse cx="25.500" cy="14" rx="2.800" ry="3.600" fill="currentColor" transform="rotate(18 25.500 14)" />
    </svg>
  );
}
