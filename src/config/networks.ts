import { ClusterNetwork, RpcEndpointConfig, AppEnvironment } from '../types';

export const SOLANA_DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';

export const ENVIRONMENT_CONFIGS: Record<AppEnvironment, RpcEndpointConfig> = {
  devnet: {
    name: 'Solana Devnet',
    network: 'devnet',
    endpoint: (import.meta as any).env?.VITE_SOLANA_DEVNET_RPC_URL || (import.meta as any).env?.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },
  testnet: {
    name: 'Solana Devnet',
    network: 'devnet',
    endpoint: (import.meta as any).env?.VITE_SOLANA_DEVNET_RPC_URL || (import.meta as any).env?.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },
};

export const DEFAULT_NETWORKS: RpcEndpointConfig[] = [
  ENVIRONMENT_CONFIGS.devnet,
];

export const DEFAULT_ENVIRONMENT: AppEnvironment = 'devnet';
export const DEFAULT_NETWORK: ClusterNetwork = 'devnet';
