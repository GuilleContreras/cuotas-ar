import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toaster";
import { BottomNav } from "@/components/BottomNav";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Cuotas AR",
  description: "Administrá tus compras en cuotas de tarjetas de crédito argentinas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cuotas AR",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#05070d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className="dark">
      <body className="min-h-screen bg-bg font-sans antialiased">
        <ToastProvider>
          <PwaRegister />
          <div className="mx-auto min-h-screen max-w-md px-4 pb-28">{children}</div>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
