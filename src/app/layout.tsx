import type { Metadata } from 'next'
import './globals.css'
import TelemetryProvider from '@/components/TelemetryProvider'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://skyxvision.com'),
  title: 'SkyX Vision IT — Task-Based Business & E-Learning Platform',
  description: 'SkyX Vision is a professional task-based business platform offering data entry, design, and packaging jobs with a transparent commission system and team management',
  keywords: 'SkyX Vision It, referral business, task platform, data entry, commission, Bangladesh',
  openGraph: {
    title: 'SkyX Vision It',
    description: 'SkyX Vision IT — Task-Based Business & E-Learning Platform',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Register Service Worker for PWA
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                      },
                      function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                      }
                    );
                  });
                }

                // Prevent infinite reload loops
                var reloadKey = 'pwa_reload_count';
                // Wrap storage in try-catch since mobile webviews or incognito modes throw SecurityErrors
                try {
                  var lastReload = sessionStorage.getItem(reloadKey);
                  var now = Date.now();
                  
                  // If we reloaded less than 5 seconds ago, don't auto-reload again
                  if (lastReload && (now - parseInt(lastReload)) < 5000) {
                    return;
                  }
                } catch(e) { /* ignore storage errors */ }

                function handleLoadError(error) {
                  try {
                    var message = (error && error.message) || '';
                    var target = error && error.target;
                    var isScriptError = target && target.tagName === 'SCRIPT';
                    var isChunkError = /ChunkLoadError|Loading chunk|failed to fetch|MIME type|ERR_ABORTED/i.test(message) || isScriptError;
                    
                    if (isChunkError) {
                      console.warn('Recovering from load error. Message:', message);
                      try {
                        sessionStorage.setItem(reloadKey, Date.now().toString());
                      } catch(e) {}
                      
                      // Add a cache-buster query param and reload
                      var url = new URL(window.location.href);
                      url.searchParams.set('reload', Date.now());
                      window.location.replace(url.toString());
                    }
                  } catch (e) {
                    console.error('Error in recovery script:', e);
                  }
                }

                window.addEventListener('error', function(e) { handleLoadError(e); }, true);
                window.addEventListener('unhandledrejection', function(e) { 
                  handleLoadError(e.reason || e); 
                });
              })();
            `,
          }}
        />
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="ubzCDmesNy99qpiF9y1zNkahkgX2nmHPM0KPfszUXcU" />
      </head>
      <body suppressHydrationWarning>
        <TelemetryProvider />
        {children}
      </body>
    </html>
  )
}
