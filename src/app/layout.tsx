import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"

export const metadata = {
  title: "BUKHT",
  description: "China Mongolia platform",
  icons: {
    icon: "/bukht-app-icon.jpeg",
    shortcut: "/bukht-app-icon.jpeg",
    apple: "/bukht-app-icon.jpeg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="mn">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
