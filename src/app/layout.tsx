import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { NavigationLoadingProvider } from "../components/ui/NavigationLoadingProvider"
import { CartProvider } from "../components/commerce/CartProvider"

const themeScript = `(function(){try{var t=localStorage.getItem('bukht-theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()`

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
    <html lang="mn" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <ClerkProvider>
          <NavigationLoadingProvider><CartProvider>{children}</CartProvider></NavigationLoadingProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
