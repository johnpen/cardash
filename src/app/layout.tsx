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
        <link href='https://api.maptiler.com/maptiler-sdk-js/v1.1.1/maptiler-sdk.css' rel='stylesheet' />
        <link href='main.css' rel='stylesheet' />
        <link rel="icon" href="/favicon.ico" />
        <script src="/stt.js"></script>

        <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.wasm.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/bundle.min.js"></script>         
        <script src="stt.js"></script>    

      </head>
      <body className="font-body antialiased bg-background" style={{backgroundImage:"url(/img/dash.jpg)", backgroundSize:"cover"}}>
        <LogProvider>
            {children}
            <DebugPanel />
        </LogProvider>
        <Toaster />

        <script defer src="/stt.js"></script>
      </body>
    </html>
  );
}
