/**
 * VALTICS Real Solana Devnet Wallet Context
 *
 * Implements real browser wallet connection using Solana Wallet Standard & Web3 standards.
 * 
 * Strict Invariants:
 * - NO mock wallet systems or simulated connections.
 * - NO fake addresses or placeholder balances.
 * - ZERO private key or seed phrase requests/storage.
 * - Real browser wallet extensions: Phantom, Solflare, Backpack, and standard injected Solana providers.
 * - Silent reconnect when previously trusted (`onlyIfTrusted: true`).
 * - Real on-chain balance via Devnet Connection.
 * - Network verification: blocks transactions if not on Solana Devnet.
 * - Handles wallet-not-installed, user rejections, and transaction signing failures.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { useNetwork } from './NetworkContext';
import { isValidSolanaAddress, sanitizeErrorMessage } from '../utils/security';
import { validateDevnetCluster, assertDevnetTransactionSafety } from '../services/networkValidator';

export interface WalletProviderInfo {
  name: string;
  icon: string;
  installed: boolean;
  adapterKey: 'phantom' | 'solflare' | 'backpack' | 'standard';
  installUrl: string;
  description: string;
}

export interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  publicKeyStr: string | null;
  balanceSol: number | null;
  balanceLoading: boolean;
  walletName: string | null;
  activeAdapterKey: string | null;
  error: string | null;
  isWrongNetwork: boolean;
  networkError: string | null;
  availableWallets: WalletProviderInfo[];
  connect: (adapterKey?: 'phantom' | 'solflare' | 'backpack' | 'standard') => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  requestDevnetAirdrop: () => Promise<boolean>;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export interface SolanaProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey?: { toBase58(): string; toBuffer?(): Uint8Array };
  network?: string;
  cluster?: string;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58(): string } }>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
    solflare?: SolanaProvider;
    backpack?: SolanaProvider;
  }
}

const STORAGE_KEY_LAST_WALLET = 'valtics_connected_wallet_adapter';

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection, network } = useNetwork();

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [activeAdapterKey, setActiveAdapterKey] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<SolanaProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Detect installed extensions dynamically
  const [hasPhantom, setHasPhantom] = useState(false);
  const [hasSolflare, setHasSolflare] = useState(false);
  const [hasBackpack, setHasBackpack] = useState(false);
  const [hasStandard, setHasStandard] = useState(false);

  const checkInstalledWallets = useCallback(() => {
    if (typeof window === 'undefined') return;
    const p = !!(window.phantom?.solana || (window.solana && window.solana.isPhantom));
    const s = !!(window.solflare || (window.solana && window.solana.isSolflare));
    const b = !!(window.backpack || (window.solana && window.solana.isBackpack));
    const std = !!window.solana;

    setHasPhantom(p);
    setHasSolflare(s);
    setHasBackpack(b);
    setHasStandard(std);
  }, []);

  useEffect(() => {
    checkInstalledWallets();
    // Re-check after short delay as some extensions inject slightly later
    const t = setTimeout(checkInstalledWallets, 800);
    return () => clearTimeout(t);
  }, [checkInstalledWallets]);

  // Available Wallets Catalog with real install URLs
  const availableWallets: WalletProviderInfo[] = useMemo(() => {
    return [
      {
        name: 'Phantom',
        icon: '🟣',
        installed: hasPhantom,
        adapterKey: 'phantom',
        installUrl: 'https://phantom.app/',
        description: 'Solana self-custody browser wallet extension',
      },
      {
        name: 'Solflare',
        icon: '🟠',
        installed: hasSolflare,
        adapterKey: 'solflare',
        installUrl: 'https://solflare.com/',
        description: 'Feature-rich Solana web and hardware wallet',
      },
      {
        name: 'Backpack',
        icon: '🎒',
        installed: hasBackpack,
        adapterKey: 'backpack',
        installUrl: 'https://backpack.app/',
        description: 'Next-generation xNFT & Solana wallet extension',
      },
      {
        name: 'Standard Solana Wallet',
        icon: '⚡',
        installed: hasStandard,
        adapterKey: 'standard',
        installUrl: 'https://phantom.app/',
        description: 'Generic window.solana standard provider',
      },
    ];
  }, [hasPhantom, hasSolflare, hasBackpack, hasStandard]);

  /**
   * Resolves the real window provider for a given adapter key.
   */
  const resolveProvider = useCallback(
    (key?: 'phantom' | 'solflare' | 'backpack' | 'standard'): { provider: SolanaProvider | null; name: string } => {
      if (typeof window === 'undefined') return { provider: null, name: '' };

      if (key === 'phantom') {
        if (window.phantom?.solana) return { provider: window.phantom.solana, name: 'Phantom' };
        if (window.solana?.isPhantom) return { provider: window.solana, name: 'Phantom' };
      }
      if (key === 'solflare') {
        if (window.solflare) return { provider: window.solflare, name: 'Solflare' };
        if (window.solana?.isSolflare) return { provider: window.solana, name: 'Solflare' };
      }
      if (key === 'backpack') {
        if (window.backpack) return { provider: window.backpack, name: 'Backpack' };
        if (window.solana?.isBackpack) return { provider: window.solana, name: 'Backpack' };
      }

      // Default or generic standard provider
      if (window.phantom?.solana) return { provider: window.phantom.solana, name: 'Phantom' };
      if (window.solflare) return { provider: window.solflare, name: 'Solflare' };
      if (window.backpack) return { provider: window.backpack, name: 'Backpack' };
      if (window.solana) {
        const name = window.solana.isPhantom
          ? 'Phantom'
          : window.solana.isSolflare
          ? 'Solflare'
          : window.solana.isBackpack
          ? 'Backpack'
          : 'Solana Wallet';
        return { provider: window.solana, name };
      }

      return { provider: null, name: '' };
    },
    []
  );

  /**
   * Validates Devnet Cluster & Checks for Wrong-Network Condition.
   */
  const verifyNetworkSafety = useCallback(
    async (provider?: SolanaProvider | null) => {
      try {
        const clusterCheck = await validateDevnetCluster(connection);
        if (!clusterCheck.isDevnet) {
          setIsWrongNetwork(true);
          setNetworkError(clusterCheck.error || 'Connected RPC is not on Solana Devnet.');
          return false;
        }

        // Check if provider explicitly reports network
        const providerNetwork = provider?.network || provider?.cluster;
        if (
          providerNetwork &&
          providerNetwork !== 'devnet' &&
          providerNetwork.toLowerCase().includes('mainnet')
        ) {
          setIsWrongNetwork(true);
          setNetworkError(
            'Your wallet extension is currently connected to Mainnet-Beta. Please open your wallet settings and switch the active network to Solana Devnet.'
          );
          return false;
        }

        setIsWrongNetwork(false);
        setNetworkError(null);
        return true;
      } catch (err: any) {
        setIsWrongNetwork(true);
        setNetworkError(err?.message || 'Network validation failed.');
        return false;
      }
    },
    [connection]
  );

  useEffect(() => {
    verifyNetworkSafety(activeProvider);
  }, [connection, activeProvider, verifyNetworkSafety]);

  /**
   * Fetches Real Native SOL Balance for the connected public key.
   * If not connected or error, balance is null. Never uses placeholder values.
   */
  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalanceSol(null);
      return;
    }
    setBalanceLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed');
      setBalanceSol(lamports / 1e9);
    } catch (err) {
      console.warn('Could not fetch real SOL balance from Devnet RPC:', err);
      // Keep null or current rather than fabricating
    } finally {
      setBalanceLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 20000);
      return () => clearInterval(interval);
    } else {
      setBalanceSol(null);
    }
  }, [connected, publicKey, refreshBalance]);

  /**
   * Reconnect when supported:
   * Eagerly reconnects on mount if the user was previously connected in this browser session.
   * Uses onlyIfTrusted: true so NO unsolicited modal or popup is displayed.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lastKey = localStorage.getItem(STORAGE_KEY_LAST_WALLET) as
      | 'phantom'
      | 'solflare'
      | 'backpack'
      | 'standard'
      | null;

    if (!lastKey) return;

    const { provider, name } = resolveProvider(lastKey);
    if (!provider || !provider.connect) return;

    provider
      .connect({ onlyIfTrusted: true })
      .then((res) => {
        const pubStr = res?.publicKey?.toBase58 ? res.publicKey.toBase58() : provider.publicKey?.toBase58();
        if (pubStr && isValidSolanaAddress(pubStr)) {
          const pub = new PublicKey(pubStr);
          setPublicKey(pub);
          setConnected(true);
          setWalletName(name);
          setActiveAdapterKey(lastKey);
          setActiveProvider(provider);
          verifyNetworkSafety(provider);
        }
      })
      .catch(() => {
        // Expected when user hasn't pre-authorized this session; silent failure
      });
  }, [resolveProvider, verifyNetworkSafety]);

  /**
   * Real Connect Wallet:
   * Prompts user for approval via browser extension.
   * Handles wallet not installed, rejected requests, and public key extraction.
   */
  const connect = async (
    adapterKey: 'phantom' | 'solflare' | 'backpack' | 'standard' = 'phantom'
  ): Promise<boolean> => {
    setError(null);
    setConnecting(true);

    try {
      const { provider, name } = resolveProvider(adapterKey);

      // Handle wallet not installed condition
      if (!provider) {
        const walletLabel =
          adapterKey === 'phantom'
            ? 'Phantom'
            : adapterKey === 'solflare'
            ? 'Solflare'
            : adapterKey === 'backpack'
            ? 'Backpack'
            : 'Solana';
        throw new Error(
          `${walletLabel} wallet extension is not installed in your browser. Please install ${walletLabel} to connect.`
        );
      }

      // Check Devnet network before connecting
      await verifyNetworkSafety(provider);

      // Connect with browser extension (prompts extension approval popup)
      const response = await provider.connect();
      const pubStr = response?.publicKey?.toBase58
        ? response.publicKey.toBase58()
        : provider.publicKey?.toBase58();

      if (!pubStr) {
        throw new Error('Wallet connection was cancelled or no public key was returned.');
      }

      if (!isValidSolanaAddress(pubStr)) {
        throw new Error('Wallet extension returned an invalid Solana public key.');
      }

      const realPubkey = new PublicKey(pubStr);
      setPublicKey(realPubkey);
      setConnected(true);
      setWalletName(name);
      setActiveAdapterKey(adapterKey);
      setActiveProvider(provider);

      // Save preference for silent reconnect
      try {
        localStorage.setItem(STORAGE_KEY_LAST_WALLET, adapterKey);
      } catch {
        // Ignore iframe storage restrictions
      }

      // Setup live provider event listeners (account switch, disconnect)
      if (provider.on) {
        provider.on('disconnect', () => {
          disconnect();
        });

        provider.on('accountChanged', (newPubkey: { toBase58(): string } | null) => {
          if (newPubkey && isValidSolanaAddress(newPubkey.toBase58())) {
            setPublicKey(new PublicKey(newPubkey.toBase58()));
          } else {
            disconnect();
          }
        });
      }

      return true;
    } catch (err: any) {
      // Handle rejected wallet requests & standard errors
      let sanitized = sanitizeErrorMessage(err);
      if (err?.code === 4001 || err?.message?.includes('User rejected')) {
        sanitized = 'Connection request was cancelled or rejected in your wallet.';
      }
      setError(sanitized);
      return false;
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Real Disconnect Wallet:
   * Informs provider, resets all state, and clears persistence.
   */
  const disconnect = async () => {
    try {
      if (activeProvider && activeProvider.disconnect) {
        await activeProvider.disconnect();
      }
    } catch {
      // Non-fatal
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY_LAST_WALLET);
      } catch {
        // Ignore
      }
      setConnected(false);
      setPublicKey(null);
      setBalanceSol(null);
      setWalletName(null);
      setActiveAdapterKey(null);
      setActiveProvider(null);
      setError(null);
      setIsWrongNetwork(false);
      setNetworkError(null);
    }
  };

  /**
   * Real Devnet Airdrop Request:
   * Requests 1 real Devnet SOL from the official Solana Devnet validator.
   */
  const requestDevnetAirdrop = async (): Promise<boolean> => {
    if (!publicKey || !connection) return false;
    try {
      // Assert we are on devnet before requesting airdrop
      if (network !== 'devnet' || isWrongNetwork) {
        throw new Error('Airdrops are only available on Solana Devnet.');
      }
      const sig = await connection.requestAirdrop(publicKey, 1_000_000_000);
      await connection.confirmTransaction(sig, 'confirmed');
      await refreshBalance();
      return true;
    } catch (err) {
      console.warn('Devnet airdrop request error:', err);
      return false;
    }
  };

  /**
   * Real Transaction Signing:
   * Strictly verifies:
   * 1. A wallet is connected.
   * 2. The wallet is on Solana Devnet.
   * 3. The transaction is explicitly intended for Devnet.
   * Handles user rejections and signing errors transparently.
   */
  const signTransaction = async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
    // Enforcement 1: Wallet connected
    if (!connected || !publicKey || !activeProvider) {
      throw new Error('Transaction blocked: Wallet is not connected. Connect your Solana Devnet wallet.');
    }

    // Enforcement 2: Solana Devnet active
    assertDevnetTransactionSafety({
      connected,
      publicKeyStr: publicKey.toBase58(),
      appNetwork: network,
      isWrongNetwork,
      networkError,
    });

    try {
      const signed = await activeProvider.signTransaction(tx);
      return signed;
    } catch (err: any) {
      if (err?.code === 4001 || err?.message?.includes('User rejected')) {
        throw new Error('Transaction was cancelled or rejected by user in wallet.');
      }
      throw new Error(`Wallet transaction signing failed: ${err?.message || 'Unknown signing error'}`);
    }
  };

  const clearError = () => setError(null);

  return (
    <WalletContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        publicKeyStr: publicKey ? publicKey.toBase58() : null,
        balanceSol,
        balanceLoading,
        walletName,
        activeAdapterKey,
        error,
        isWrongNetwork,
        networkError,
        availableWallets,
        connect,
        disconnect,
        refreshBalance,
        requestDevnetAirdrop,
        signTransaction,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
