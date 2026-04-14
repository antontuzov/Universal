import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Network = 'mainnet' | 'sepolia' | 'goerli';

interface NetworkState {
  ethereum: Network;
  bitcoin: Network;
  solana: Network;
  setNetwork: (chain: 'ethereum' | 'bitcoin' | 'solana', network: Network) => void;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set) => ({
      ethereum: 'sepolia',
      bitcoin: 'mainnet',
      solana: 'mainnet',
      setNetwork: (chain, network) =>
        set((state) => ({ ...state, [chain]: network })),
    }),
    {
      name: 'network-storage',
    }
  )
);
