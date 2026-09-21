// Blood drop with a heart cut out — the emblem used on the auth cards and panels.
export default function DropHeart({ size = 56, color = '#c62828', heart = '#fff' }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 48 58" fill="none" aria-hidden="true">
      <path d="M24 2C24 2 5 23 5 37a19 19 0 0 0 38 0C43 23 24 2 24 2Z" fill={color} />
      <path d="M24 46s-9-5.6-9-11.4a4.9 4.9 0 0 1 9-2.6 4.9 4.9 0 0 1 9 2.6C33 40.4 24 46 24 46Z" fill={heart} />
    </svg>
  );
}
