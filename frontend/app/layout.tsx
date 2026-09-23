import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meal Bear Skardu",
  description: "Order entry system",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="mx-auto w-full max-w-6xl min-h-screen bg-white flex flex-col">
          <nav className="flex border-b border-gray-200 text-sm font-medium">
            <Link href="/" className="flex-1 text-center py-3 hover:bg-gray-50">New order</Link>
            <Link href="/orders" className="flex-1 text-center py-3 border-l border-gray-200 hover:bg-gray-50">Orders</Link>
            <Link href="/riders" className="flex-1 text-center py-3 border-l border-gray-200 hover:bg-gray-50">Riders</Link>
            <Link href="/admin" className="flex-1 text-center py-3 border-l border-gray-200 hover:bg-gray-50">Admin</Link>
            <Link href="/dashboard" className="flex-1 text-center py-3 border-l border-gray-200 hover:bg-gray-50">Dashboard</Link>
          </nav>
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}