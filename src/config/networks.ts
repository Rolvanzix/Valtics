import { ClusterNetwork, RpcEndpointConfig } from '../types';

export const DEFAULT_NETWORKS: RpcEndpointConfig[] = [
  {
    name: 'Solana Devnet (Official)',
    network: 'devnet',
    endpoint: (import.meta as any).env?.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },
  {
    name: 'Solana Mainnet-Beta (Public)',
    network: 'mainnet-beta',
    endpoint: 'https://api.mainnet-beta.solana.com',
  },
  {
    name: 'Solana Devnet (Ankr Public)',
    network: 'devnet',
    endpoint: 'https://rpc.ankr.com/solana_devnet',
  },
];

export const DEFAULT_NETWORK: ClusterNetwork = 
  ((import.meta as any).env?.VITE_SOLANA_NETWORK as ClusterNetwork) || 'devnet';
