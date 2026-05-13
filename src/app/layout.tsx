import type { Metadata, Viewport } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { GlobalSearchDialog } from '@/components/search/GlobalSearchDialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { InterestHubApp } from '@/components/InterestHubApp';

export const metadata: Metadata = {
  title: 'Second Brain - Quản lý công việc',
  description: 'Ứng dụng quản lý nhiệm vụ, mục tiêu và ghi chú thông minh của bạn.',
  manifest: '/todo/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Second Brain',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/todo/icon-192x192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/todo/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Second Brain" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <InterestHubApp>
            <GlobalSearchDialog>
              <AppLayout>
                {children}
              </AppLayout>
            </GlobalSearchDialog>
          </InterestHubApp>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
