import './globals.css'
import {ClusterProvider} from '@/components/cluster/cluster-data-access'
import {SolanaProvider} from '@/components/solana/solana-provider'
import {UiLayout} from '@/components/ui/ui-layout'
import {ReactQueryProvider} from './react-query-provider'
import {ThemeProvider} from '@/components/theme-provider'
import type { Metadata } from 'next'

export const metadata = {
  title: 'Solana OPX | Epicentral Labs',
  description: 'The first decentralized options exchange on Solana',
  icons: [
    { rel: 'icon', url: '/favicon.png' },
  ],
}

const links = [
  { label: 'Trade', path: '/trade' },
  { label: 'OMLP', path: '/omlp' },
  { label: 'Option Lab', path: '/mint-option' },
  { label: 'Portfolio', path: '/account' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{
        backgroundImage: "url('/WebPageBackground.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        margin: 0,
      }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <ClusterProvider>
              <SolanaProvider>
                <UiLayout links={links}>{children}</UiLayout>
              </SolanaProvider>
            </ClusterProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
