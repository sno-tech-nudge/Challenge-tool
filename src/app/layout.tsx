import type { Metadata } from 'next';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import { ToastProvider } from '@/components/Toast';
import '@/styles/globals.css';

export const metadata: Metadata = { title: 'aahaar bazaar challenge', description: 'jury scoring and admin snapshot for the aahaar bazaar challenge' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
