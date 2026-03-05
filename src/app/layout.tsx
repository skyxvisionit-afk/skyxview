import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SkyX Vision IT — Task-Based Business & E-Learning Platform',
  description: 'SkyX Vision is a professional task-based business platform offering data entry, design, and packaging jobs with a transparent commission system and team management',
  keywords: 'SkyX Vision It, referral business, task platform, data entry, commission, Bangladesh',
  openGraph: {
    title: 'SkyX Vision It',
    description: 'Professional task-based referral business platform',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
                // Prevent infinite reload loops
                var reloadKey = 'pwa_reload_count';
                var lastReload = sessionStorage.getItem(reloadKey);
                var now = Date.now();
                
                // If we reloaded less than 5 seconds ago, don't auto-reload again
                if (lastReload && (now - parseInt(lastReload)) < 5000) {
                  return;
                }

                function handleLoadError(error) {
                  var message = (error && error.message) || '';
                  var isChunkError = /ChunkLoadError|Loading chunk|failed to fetch|MIME type|ERR_ABORTED/i.test(message);
                  
                  if (isChunkError) {
                    console.warn('Recovering from load error:', message);
                    sessionStorage.setItem(reloadKey, Date.now().toString());
                    
                    // Add a cache-buster query param and reload
                    var url = new URL(window.location.href);
                    url.searchParams.set('reload', Date.now());
                    window.location.replace(url.toString());
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
      </head>
      <body>{children}</body>
    </html>
  )
}
