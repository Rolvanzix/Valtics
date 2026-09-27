import { ClusterNetwork, RpcEndpointConfig, AppEnvironment } from '../types';

export const SOLANA_DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export const SOLANA_MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

export const ENVIRONMENT_CONFIGS: Record<AppEnvironment, RpcEndpointConfig> = {
  testnet: {
    name: 'Solana Testnet / Devnet',
    network: 'testnet',
    endpoint: (import.meta as any).env?.VITE_SOLANA_DEVNET_RPC_URL || (import.meta as any).env?.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },
  mainnet: {
    name: 'Solana Mainnet (Production)',
    network: 'mainnet',
    endpoint: (import.meta as any).env?.VITE_SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com',
  },
};

export const DEFAULT_NETWORKS: RpcEndpointConfig[] = [
  ENVIRONMENT_CONFIGS.testnet,
  ENVIRONMENT_CONFIGS.mainnet,
];

export const DEFAULT_ENVIRONMENT: AppEnvironment = 'testnet';
export const DEFAULT_NETWORK: ClusterNetwork = 'testnet';
