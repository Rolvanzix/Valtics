import { ClusterNetwork, RpcEndpointConfig } from '../types';

export const SOLANA_DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export const SOLANA_MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

export const DEFAULT_NETWORKS: RpcEndpointConfig[] = [
  {
    name: 'Solana Devnet (Official)',
    network: 'devnet',
    endpoint: (import.meta as any).env?.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },
  {
    name: 'Solana Devnet (Ankr Public)',
    network: 'devnet',
    endpoint: 'https://rpc.ankr.com/solana_devnet',
  },
];

export const DEFAULT_NETWORK: ClusterNetwork = 'devnet';

