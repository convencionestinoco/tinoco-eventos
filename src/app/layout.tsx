import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centro de Convenciones Tinoco - Gestión de Eventos",
  description: "Plataforma de gestión de eventos para Centro de Convenciones Tinoco",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

