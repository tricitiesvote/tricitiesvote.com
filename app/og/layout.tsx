import '../../styles/og.css'

export default function OgLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="og-body">
        <div className="og-canvas">{children}</div>
      </body>
    </html>
  )
}
