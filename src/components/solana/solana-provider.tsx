'use client'

import dynamic from 'next/dynamic'
import { AnchorProvider } from '@coral-xyz/anchor'
import { WalletError } from '@solana/wallet-adapter-base'
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { ReactNode, useCallback, useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'

require('@solana/wallet-adapter-react-ui/styles.css')

const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL as string

if (!HELIUS_RPC_URL) {
  throw new Error('NEXT_PUBLIC_HELIUS_RPC_URL is not defined in environment variables')
}

export const WalletButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui')
    return function CustomWalletButton(props: any) {
      return (
        <WalletMultiButton 
          {...props} 
          className="bg-[#4a85ff] hover:bg-[#4a85ff]/90 text-white border-0 h-9"
        />
      )
    }
  },
  { ssr: false }
)

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => 
    // Always use Helius RPC for mainnet, fallback to cluster endpoint for other networks
    cluster.network === 'mainnet-beta' ? HELIUS_RPC_URL : cluster.endpoint
  , [cluster])

  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}
