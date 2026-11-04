import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'QwikConnect - Admin Panel & API Backend',
  description: 'QwikConnect Dating & Social App Full-stack Backend Server and Admin Dashboard',
  icons: {
    icon: '/asset/img/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/asset/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/asset/css/app.min.css" />
        <link rel="stylesheet" href="/asset/css/components.css" />
        <link rel="stylesheet" href="/asset/css/custom.css" />
        <link rel="stylesheet" href="/asset/cdncss/iziToast.css" />
        <link rel="stylesheet" href="/asset/style/app.css" />
        <link rel="stylesheet" href="/asset/css/style.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
