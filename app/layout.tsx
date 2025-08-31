import React from 'react'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* SVG favicon for modern browsers */}
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        {/* PNG favicon fallback for older browsers */}
        <link rel="alternate icon" type="image/png" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}