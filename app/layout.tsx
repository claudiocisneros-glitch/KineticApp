import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

// Toda la app es privada y trabaja con datos en vivo (auth, puntos, check-ins),
// así que no hay nada que pre-renderizar como estático. Forzar renderizado
// dinámico evita que el build intente prerenderizar páginas que crean el
// cliente de Supabase (p. ej. /login) y falle en ese paso.
export const dynamic = "force-dynamic";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-montserrat",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kinetic Gym",
  description: "Entrená. Sumá. Ganá.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

// viewport-fit=cover: sin esto, env(safe-area-inset-bottom) siempre da 0 en
// iOS y el tab bar fijo termina metido debajo del home indicator.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} ${inter.variable} font-body`}>
        {children}
      </body>
    </html>
  );
}
