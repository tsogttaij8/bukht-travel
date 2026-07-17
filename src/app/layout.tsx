import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { NavigationLoadingProvider } from "../components/ui/NavigationLoadingProvider"

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
        <ClerkProvider>
          <NavigationLoadingProvider>{children}</NavigationLoadingProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
