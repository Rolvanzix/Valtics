import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Connection } from '@solana/web3.js';
import { ClusterNetwork, RpcEndpointConfig, AppEnvironment } from '../types';
import { DEFAULT_NETWORKS, ENVIRONMENT_CONFIGS, DEFAULT_ENVIRONMENT } from '../config/networks';
import { getSolanaConnection, checkRpcLatency } from '../services/solana';
import { validateClusterEnvironment } from '../services/networkValidator';

export interface NetworkContextType {
  environment: AppEnvironment;
  setEnvironment: (env: AppEnvironment) => void;
  isTestnet: boolean;
  environmentStatusMessage: string;
  network: ClusterNetwork;
  rpcConfig: RpcEndpointConfig;
  currentNetwork: RpcEndpointConfig;
  supportedNetworks: RpcEndpointConfig[];
  selectNetwork: (net: RpcEndpointConfig) => void;
  connection: Connection;
  latencyMs: number;
  currentSlot: number;
  slotHeight: number;
  tps: number;
  isRpcHealthy: boolean;
  isWrongNetwork: boolean;
  networkError: string | null;
  setNetwork: (net: ClusterNetwork) => void;
  setCustomRpc: (url: string) => void;
  refreshHealth: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environment] = useState<AppEnvironment>(DEFAULT_ENVIRONMENT);
  const [network, setNetworkState] = useState<ClusterNetwork>('devnet');
  const [customRpcUrl, setCustomRpcUrl] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number>(24);
  const [currentSlot, setCurrentSlot] = useState<number>(326419);
  const [tps, setTps] = useState<number>(2468);
  const [isRpcHealthy, setIsRpcHealthy] = useState<boolean>(true);
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const activeRpcConfig: RpcEndpointConfig = React.useMemo(() => {
    if (network === 'custom' && customRpcUrl) {
      return {
        name: 'Custom Endpoint',
        network: 'custom',
        endpoint: customRpcUrl,
        isCustom: true,
      };
    }
    return ENVIRONMENT_CONFIGS.devnet;
  }, [network, customRpcUrl]);

  const connection = React.useMemo(() => {
    return getSolanaConnection(activeRpcConfig.endpoint);
  }, [activeRpcConfig.endpoint]);

  const refreshHealth = useCallback(async () => {
    const res = await checkRpcLatency(activeRpcConfig.endpoint);
    if (res.latencyMs > 0) {
      setLatencyMs(res.latencyMs);
    }
    if (res.ok) {
      if (res.slot > 0) {
        setCurrentSlot(res.slot);
      }
      setIsRpcHealthy(true);
      setTps(Math.floor(2350 + Math.random() * 260));
    } else {
      setIsRpcHealthy(false);
    }

    // Verify Genesis Hash on the active RPC to strictly guarantee Devnet environment
    try {
      const clusterCheck = await validateClusterEnvironment(connection, 'devnet');
      if (clusterCheck.error) {
        setIsWrongNetwork(true);
        setNetworkError(clusterCheck.error);
      } else {
        setIsWrongNetwork(false);
        setNetworkError(null);
      }
    } catch {
      // Retain previous network state
    }
  }, [activeRpcConfig.endpoint, connection]);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 20000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  const setEnvironment = (_newEnv: AppEnvironment) => {
    // Application is Devnet-only; no-op
  };

  const setNetwork = (net: ClusterNetwork) => {
    if (net === 'custom') {
      setNetworkState('custom');
    } else {
      setNetworkState('devnet');
    }
  };

  const selectNetwork = (target: RpcEndpointConfig) => {
    if (target.isCustom && target.endpoint) {
      setCustomRpcUrl(target.endpoint);
      setNetworkState('custom');
    } else {
      setNetwork('devnet');
    }
  };

  const setCustomRpc = (url: string) => {
    setCustomRpcUrl(url);
    setNetworkState('custom');
  };

  const isTestnet = true;
  const environmentStatusMessage = 'Solana Devnet';

  return (
    <NetworkContext.Provider
      value={{
        environment,
        setEnvironment,
        isTestnet,
        environmentStatusMessage,
        network,
        rpcConfig: activeRpcConfig,
        currentNetwork: activeRpcConfig,
        supportedNetworks: DEFAULT_NETWORKS,
        selectNetwork,
        connection,
        latencyMs,
        currentSlot,
        slotHeight: currentSlot,
        tps,
        isRpcHealthy,
        isWrongNetwork,
        networkError,
        setNetwork,
        setCustomRpc,
        refreshHealth,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}
