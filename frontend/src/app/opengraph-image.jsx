import { ImageResponse } from 'next/og';

// Preview card shown when a link to the site is shared (Facebook, Telegram, etc.).
export const alt = 'BloodLife AI — Blood Donation Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px', background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2C8 7 5 10.5 5 14a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" />
          </svg>
          <div style={{ fontSize: 72, fontWeight: 800 }}>BloodLife AI</div>
        </div>
        <div style={{ fontSize: 40, marginTop: 32, opacity: 0.95 }}>Save lives together</div>
        <div style={{ fontSize: 28, marginTop: 20, opacity: 0.8 }}>
          Donors, hospitals and patients across Cambodia — with an AI assistant in English, Khmer and Vietnamese
        </div>
      </div>
    ),
    size,
  );
}
