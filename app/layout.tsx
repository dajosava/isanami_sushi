import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Isanami Sushi — Sistema Interno",
  description: "Sistema de administracion de Isanami Sushi, Hojancha, Guanacaste.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Zen+Maru+Gothic:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
