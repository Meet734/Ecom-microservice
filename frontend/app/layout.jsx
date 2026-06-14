export const metadata = {
  title: 'ShopStack — E-commerce Platform',
  description: 'A modern microservice-powered e-commerce ecosystem.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Load Tailwind CSS via CDN since it is not locally installed */}
        <script src="https://cdn.tailwindcss.com"></script>
        {/* Load google fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
        `}</style>
      </head>
      <body className="bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
