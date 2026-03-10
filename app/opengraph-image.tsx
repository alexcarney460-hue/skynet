import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SKYNETx — AI Infrastructure & Skills Marketplace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0a1a2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow effects */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,214,255,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(217,70,239,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              fontSize: '72px',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #06b6d4, #d946ef)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            SKYNETx
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            marginBottom: '48px',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          AI Infrastructure & Skills Marketplace
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {['Memory API', 'Skills Marketplace', 'Subscriptions', 'Crypto Payments'].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  padding: '12px 24px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#e2e8f0',
                  fontSize: '20px',
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '20px',
            color: '#64748b',
          }}
        >
          skynetx.io
        </div>
      </div>
    ),
    { ...size }
  );
}
