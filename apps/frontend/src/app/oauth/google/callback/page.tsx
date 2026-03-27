'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function OAuthCallbackInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      // User denied access or other error
      if (window.opener) {
        window.opener.postMessage(
          { type: 'google-oauth-callback', error },
          window.location.origin,
        );
      }
      setTimeout(() => window.close(), 2000);
      return;
    }

    if (code && window.opener) {
      window.opener.postMessage(
        { type: 'google-oauth-callback', code },
        window.location.origin,
      );
      setTimeout(() => window.close(), 1500);
    }
  }, [searchParams]);

  const error = searchParams.get('error');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0c14',
        color: '#e4e6f0',
        fontFamily: "'Segoe UI', -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Authentication Failed</h2>
            <p style={{ fontSize: 13, color: '#7b7f9e' }}>
              {error === 'access_denied'
                ? 'Access was denied. Please try again.'
                : `Error: ${error}`}
            </p>
            <p style={{ fontSize: 11, color: '#555878', marginTop: 12 }}>
              This window will close automatically...
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Connecting to Google...</h2>
            <p style={{ fontSize: 13, color: '#7b7f9e' }}>
              This window will close automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleOAuthCallback() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0c14',
            color: '#e4e6f0',
          }}
        >
          Loading...
        </div>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
