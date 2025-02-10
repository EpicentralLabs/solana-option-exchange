import './globals.css'
import {ClusterProvider} from '@/components/cluster/cluster-data-access'
import {SolanaProvider} from '@/components/solana/solana-provider'
import {UiLayout} from '@/components/ui/ui-layout'
import {ReactQueryProvider} from './react-query-provider'
import {ThemeProvider} from '@/components/theme-provider'
import type { Metadata } from 'next'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Solana OPX | Epicentral Labs',
  description: 'The first decentralized options exchange on Solana',
  icons: [
    { rel: 'icon', url: '/favicon.png' },
  ],
}

const links = [
  { label: 'Trade', path: '/trade' },
  { label: 'Portfolio', path: '/account' },
  { label: 'Mint Option', path: '/mint-option' },
  { label: 'OMLP', path: '/omlp' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-gradient-to-b from-[#101010] to-[#000000]")}>
        <ThemeProvider attribute="class" defaultTheme="dark">
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
