import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { GlobalSearchDialog } from '@/components/search/GlobalSearchDialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { InterestHubApp } from '@/components/InterestHubApp';

export const metadata: Metadata = {
  title: 'Trung tâm Sở thích',
  description: 'Quản lý sở thích, chủ đề, mục tiêu và công việc của bạn.',
  manifest: '/manifest.json',
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
        <meta name="application-name" content="Trung tâm Sở thích" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Trung tâm Sở thích" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#111827" />
        <link rel="apple-touch-icon" href="/icon.svg" />
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
