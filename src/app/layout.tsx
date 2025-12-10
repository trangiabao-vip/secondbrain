import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { InterestHubApp } from '@/components/InterestHubApp';
import { GlobalSearchDialog } from '@/components/search/GlobalSearchDialog';

export const metadata: Metadata = {
  title: 'Trung tâm Sở thích',
  description: 'Quản lý sở thích, chủ đề, mục tiêu và công việc của bạn.',
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
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <InterestHubApp>
            <GlobalSearchDialog>
              {children}
            </GlobalSearchDialog>
          </InterestHubApp>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
