export const metadata = { title: 'horkos' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ font: '14px monospace', margin: 16 }}>{children}</body>
    </html>
  )
}
