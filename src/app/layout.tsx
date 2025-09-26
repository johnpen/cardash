import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LogProvider } from '@/components/debug/log-context';
import { DebugPanel } from '@/components/debug/debug-panel';

export const metadata: Metadata = {
  title: 'DriveAI Console',
  description: 'A modern car center console simulation with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />


        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-body antialiased" style={{backgroundImage: "url(https://cdn.motor1.com/images/mgl/JOByZn/s1/2025-aston-martin-dbx707-interior.jpg)", backgroundSize: "cover" }}>
        <LogProvider>
          {children}
          <DebugPanel />
        </LogProvider>
        <Toaster />
      </body>
    </html>
  );
}
